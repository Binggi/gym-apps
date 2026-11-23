<?php

namespace App\Services;

use App\Models\Exercise;
use App\Models\Routine;
use App\Models\User;
use App\Models\Workout;
use App\Models\WorkoutSet;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Aturan program:
 * - Urutan tetap Dorong → Tarik → Kaki. Bolos satu hari: lanjut ke sesi berikutnya.
 * - Naik beban: kalau semua set sudah sampai batas atas repetisi dengan rapi.
 * - Treadmill 15–20 menit, mulai minggu 5: 25–30 menit.
 */
class TrainingPlanner
{
    /** Sesi berikutnya menurut urutan, berdasarkan latihan terakhir yang benar-benar dikerjakan. */
    public function nextRoutine(User $user): Routine
    {
        $routines = Routine::orderBy('position')->get();

        $last = $user->workouts()
            ->where(fn ($q) => $q->whereNotNull('finished_at')->orWhereHas('sets', fn ($s) => $s->where('done', true)))
            ->with('routine')
            ->orderByDesc('date')->orderByDesc('id')
            ->first();

        if (! $last) {
            return $routines->first();
        }

        $idx = $routines->search(fn (Routine $r) => $r->id === $last->routine_id);

        return $routines[($idx + 1) % $routines->count()];
    }

    public function isGymDay(CarbonInterface $date): bool
    {
        return Routine::where('day_of_week', $date->dayOfWeek)->exists();
    }

    /** Minggu program ke-berapa (dihitung dari latihan pertama). */
    public function programWeek(User $user, ?CarbonInterface $on = null): int
    {
        $first = $user->workouts()->min('date');
        if (! $first) {
            return 1;
        }

        $on ??= now();

        return intdiv((int) max(0, \Carbon\Carbon::parse($first)->startOfDay()->diffInDays($on->copy()->startOfDay())), 7) + 1;
    }

    /** @return array{min:int,max:int} */
    public function cardioTarget(User $user, ?CarbonInterface $on = null): array
    {
        $cfg = config('gym.cardio');

        return $this->programWeek($user, $on) >= $cfg['later_from_week'] ? $cfg['later'] : $cfg['early'];
    }

    /** Set yang selesai dari latihan terakhir (selain $exclude) untuk gerakan ini. */
    public function lastSets(User $user, Exercise $exercise, ?Workout $exclude = null): Collection
    {
        $workout = $user->workouts()
            ->when($exclude, fn ($q) => $q->where('id', '!=', $exclude->id))
            ->when($exclude, fn ($q) => $q->where('date', '<=', $exclude->date))
            ->whereHas('sets', fn ($q) => $q->where('exercise_id', $exercise->id)->where('done', true))
            ->orderByDesc('date')->orderByDesc('id')
            ->first();

        if (! $workout) {
            return collect();
        }

        return $workout->sets()->where('exercise_id', $exercise->id)->where('done', true)->get()
            ->each(fn (WorkoutSet $s) => $s->setRelation('workout', $workout));
    }

    /**
     * Saran untuk sesi ini berdasarkan sesi sebelumnya.
     *
     * @return array{type:string, text:string, last:?string, weight:?float}
     */
    public function suggestion(User $user, Exercise $exercise, ?Workout $current = null): array
    {
        $sets = $this->lastSets($user, $exercise, $current);

        if ($sets->isEmpty()) {
            return [
                'type' => 'first',
                'text' => $exercise->uses_weight
                    ? 'Pertama kali: pilih beban yang masih terasa sanggup 3 kali lagi saat set selesai.'
                    : 'Pertama kali: fokus ke gerakan yang rapi.',
                'last' => null,
                'weight' => null,
            ];
        }

        $unit = $exercise->is_timed ? ' dtk' : '';
        $repsList = $sets->pluck('reps')->map(fn ($r) => $r === null ? '–' : $r.$unit)->implode(', ');
        $weight = $exercise->uses_weight ? $sets->max('weight_kg') : null;
        $date = $sets->first()->workout->date->translatedFormat('j M');
        $last = ($weight ? self::kg($weight).' × ' : '').$repsList.' ('.$date.')';

        $hitTop = $sets->count() >= 3 && $sets->every(fn ($s) => (int) $s->reps >= $exercise->rep_max);

        if ($hitTop) {
            $text = match (true) {
                $exercise->is_timed => 'Semua set sudah '.$exercise->rep_max.' detik. Tambah 5–10 detik per set.',
                ! $exercise->uses_weight => 'Semua set sudah '.$exercise->rep_max.' kali. Tambah 1–2 repetisi atau pelankan gerakan.',
                default => 'Semua set sudah '.$exercise->rep_max.' kali dengan rapi. Naikkan ke beban terkecil berikutnya.',
            };

            return ['type' => 'up', 'text' => $text, 'last' => $last, 'weight' => $weight];
        }

        return [
            'type' => 'hold',
            'text' => $exercise->uses_weight
                ? 'Pertahankan '.self::kg($weight).', kejar '.$exercise->rep_max.' kali di semua set.'
                : 'Kejar '.$exercise->rep_max.($exercise->is_timed ? ' detik' : ' kali').' di semua set.',
            'last' => $last,
            'weight' => $weight,
        ];
    }

    /** Buat sesi baru dengan set kosong; beban diisi dari sesi sebelumnya. */
    public function startWorkout(User $user, Routine $routine, CarbonInterface $date): Workout
    {
        $workout = $user->workouts()->create([
            'routine_id' => $routine->id,
            'date' => $date->toDateString(),
            'cardio_speed' => config('gym.cardio.speed'),
        ]);

        foreach ($routine->exercises as $exercise) {
            $prev = $this->lastSets($user, $exercise, $workout)->values();
            for ($n = 1; $n <= $exercise->pivot->sets; $n++) {
                $workout->sets()->create([
                    'exercise_id' => $exercise->id,
                    'set_number' => $n,
                    'weight_kg' => $exercise->uses_weight ? ($prev[$n - 1]->weight_kg ?? $prev->last()?->weight_kg) : null,
                ]);
            }
        }

        return $workout;
    }

    public static function kg(?float $v): string
    {
        if ($v === null) {
            return '–';
        }

        return rtrim(rtrim(number_format($v, 1, ',', '.'), '0'), ',').' kg';
    }
}
