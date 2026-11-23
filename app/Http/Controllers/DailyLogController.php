<?php

namespace App\Http\Controllers;

use App\Models\DailyLog;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class DailyLogController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $date = $this->dateFrom($request->query('tanggal'));

        $log = $user->dailyLogs()->whereDate('date', $date)->first()
            ?? new DailyLog(['date' => $date->toDateString()]);

        $from = now()->startOfDay()->subDays(13);
        $logs = $user->dailyLogs()->where('date', '>=', $from->toDateString())->get()
            ->keyBy(fn ($l) => $l->date->toDateString());
        $cardio = $user->workouts()->where('date', '>=', $from->toDateString())->get()
            ->groupBy(fn ($w) => $w->date->toDateString())->map->sum('cardio_minutes');

        $days = collect(range(0, 13))->map(function ($i) use ($from, $logs, $cardio) {
            $d = $from->copy()->addDays($i)->toDateString();
            $l = $logs[$d] ?? null;

            return [
                'date' => $d,
                'steps' => $l?->steps,
                'sleep' => $l?->sleep_hours,
                'water' => $l?->water_liters,
                'protein' => $l ? $l->protein() : null,
                'kcal' => $l ? $l->kcal() : null,
                'cardio' => $cardio[$d] ?? null,
            ];
        });

        return view('daily.index', [
            'date' => $date,
            'log' => $log,
            'days' => $days,
            'cardioToday' => $user->workouts()->whereDate('date', $date)->sum('cardio_minutes'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date', 'before_or_equal:today'],
            'steps' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'sleep_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'water_liters' => ['nullable', 'numeric', 'min:0', 'max:15'],
            'meals' => ['nullable', 'array'],
            'meals.*' => [Rule::in(array_keys(config('gym.meals')))],
            'extra_protein_g' => ['nullable', 'integer', 'min:0', 'max:500'],
            'extra_kcal' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        // Formulir mewakili seluruh catatan hari itu: kolom yang tidak dikirim dikosongkan.
        $fields = ['steps', 'sleep_hours', 'water_liters', 'extra_protein_g', 'extra_kcal', 'notes'];
        $data = array_merge(array_fill_keys($fields, null), $data);
        $data['meals'] = array_values($data['meals'] ?? []);

        $request->user()->dailyLogs()->updateOrCreate(['date' => $data['date']], $data);

        return redirect()->route('daily.index', ['tanggal' => $data['date']])->with('status', 'Catatan harian tersimpan.');
    }

    private function dateFrom(?string $value): Carbon
    {
        try {
            $d = $value ? Carbon::parse($value)->startOfDay() : now()->startOfDay();
        } catch (\Throwable) {
            $d = now()->startOfDay();
        }

        return $d->gt(now()) ? now()->startOfDay() : $d;
    }
}
