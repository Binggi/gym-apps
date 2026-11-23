<?php

namespace App\Services;

use App\Models\BodyMetric;
use Illuminate\Support\Collection;

/**
 * Laju perubahan berat badan (kg/minggu) dari garis tren timbangan pagi
 * 21 hari terakhir, lalu dibandingkan dengan aturan program:
 * target turun 0,25–0,5 kg/minggu; > 0,75 → tambah 150–200 kkal;
 * tidak turun 2–3 minggu → kurangi 150–200 kkal; > 1 kg/minggu selama 2 minggu → periksa ke dokter.
 */
class WeightTrend
{
    /**
     * @param  Collection<int, BodyMetric>  $metrics
     * @return array{status:string, tone:string, title:string, text:string, rate:?float, span:int, avg7:?float}
     */
    public function analyze(Collection $metrics): array
    {
        $points = $metrics->filter(fn ($m) => $m->weight_kg !== null)->sortBy('date')->values();
        $latest = $points->last();

        $avg7 = $latest
            ? round($points->filter(fn ($m) => $m->date->gt($latest->date->copy()->subDays(7)))->avg('weight_kg'), 1)
            : null;

        $window = $latest
            ? $points->filter(fn ($m) => $m->date->gte($latest->date->copy()->subDays(21)))->values()
            : collect();

        $span = $window->count() > 1 ? (int) $window->first()->date->diffInDays($window->last()->date) : 0;

        if ($window->count() < 3 || $span < 6) {
            return $this->result('insufficient', 'neutral', 'Belum cukup data',
                'Timbang 2–3 kali seminggu saat pagi. Tren muncul setelah sekitar 1 minggu data.', null, $span, $avg7);
        }

        $rate = round($this->slopePerDay($window) * 7, 2); // kg/minggu, negatif = turun
        $loss = -$rate;
        $t = config('gym.targets');

        return match (true) {
            $loss > $t['loss_rate_doctor'] && $span >= 13 => $this->result('doctor', 'critical', 'Turun terlalu cepat',
                'Sudah lebih dari 1 kg per minggu selama 2 minggu. Pastikan menu harian habis. Kalau makan sudah sesuai, periksa ke dokter (cek gula darah dan tiroid).', $rate, $span, $avg7),
            $loss > $t['loss_rate_too_fast'] => $this->result('too_fast', 'warning', 'Turun terlalu cepat',
                'Lebih dari 0,75 kg per minggu. Tambah 150–200 kkal per hari dan jangan tambah cardio.', $rate, $span, $avg7),
            $loss > $t['loss_rate_max'] => $this->result('bit_fast', 'warning', 'Sedikit di atas target',
                'Targetnya 0,25–0,5 kg per minggu. Pastikan camilan tidak terlewat.', $rate, $span, $avg7),
            $loss >= $t['loss_rate_min'] => $this->result('on_target', 'good', 'Sesuai target',
                'Turun 0,25–0,5 kg per minggu. Pertahankan.', $rate, $span, $avg7),
            $span >= 14 && $loss < 0.1 => $this->result('stalled', 'warning', 'Belum turun',
                'Tidak turun selama 2–3 minggu. Kurangi 150–200 kkal per hari.', $rate, $span, $avg7),
            default => $this->result('slow', 'neutral', 'Turun pelan',
                'Di bawah 0,25 kg per minggu. Tunggu 2–3 minggu sebelum mengubah porsi.', $rate, $span, $avg7),
        };
    }

    private function slopePerDay(Collection $points): float
    {
        $x0 = $points->first()->date;
        $xs = $points->map(fn ($m) => (float) $x0->diffInDays($m->date));
        $ys = $points->pluck('weight_kg');
        $n = $points->count();
        $mx = $xs->avg();
        $my = $ys->avg();
        $num = 0.0;
        $den = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $num += ($xs[$i] - $mx) * ($ys[$i] - $my);
            $den += ($xs[$i] - $mx) ** 2;
        }

        return $den == 0.0 ? 0.0 : $num / $den;
    }

    private function result(string $status, string $tone, string $title, string $text, ?float $rate, int $span, ?float $avg7): array
    {
        return compact('status', 'tone', 'title', 'text', 'rate', 'span', 'avg7');
    }
}
