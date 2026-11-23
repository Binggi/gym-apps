@php
    use App\Services\TrainingPlanner;
    $metric = $exercise->uses_weight ? 'Beban terberat' : ($exercise->is_timed ? 'Detik terlama' : 'Repetisi terbanyak');
    $chart = [
        'type' => 'line',
        'label' => $metric,
        'unit' => $exercise->uses_weight ? 'kg' : ($exercise->is_timed ? 'dtk' : 'kali'),
        'decimals' => 1,
        'minSpan' => $exercise->uses_weight ? 2.5 : 2,
        'points' => $series,
        'empty' => 'Selesaikan minimal 2 sesi dengan gerakan ini untuk melihat grafik.',
    ];
@endphp
<x-layouts.app :title="$exercise->name">
    <div class="page-head">
        <a class="muted" href="{{ route('workouts.index') }}" style="font-size:.95rem">← Latihan</a>
        <h1>{{ $exercise->name }}</h1>
        <p class="lead">{{ $exercise->machine_name }} · {{ $exercise->muscle }} · target {{ $exercise->targetLabel() }}</p>
    </div>

    <div class="grid-2">
        <section class="card">
            <h2>{{ $metric }} per sesi</h2>
            <div class="chart" data-chart='@json($chart)'></div>
            <div class="hint-box {{ $suggestion['type'] === 'up' ? 'up' : '' }}">
                <span>Sesi berikutnya: {{ $suggestion['text'] }}</span>
            </div>
        </section>

        <section class="card">
            <h2>Riwayat</h2>
            @if ($history->isEmpty())
                <p class="muted">Belum ada set yang selesai untuk gerakan ini.</p>
            @else
                <div class="tablewrap">
                    <table>
                        <thead><tr><th>Tanggal</th>@if ($exercise->uses_weight)<th class="r">Beban</th>@endif<th class="r">{{ $exercise->is_timed ? 'Detik' : 'Repetisi' }}</th></tr></thead>
                        <tbody>
                        @foreach ($history as $h)
                            <tr>
                                <td><a href="{{ route('workouts.show', $h['workout']) }}">{{ $h['workout']->date->translatedFormat('D, j M Y') }}</a></td>
                                @if ($exercise->uses_weight)
                                    <td class="r">{{ $h['weights']->unique()->map(fn ($w) => TrainingPlanner::kg($w))->implode(' / ') }}</td>
                                @endif
                                <td class="r">{{ $h['reps']->map(fn ($r) => $r ?? '–')->implode(', ') }}</td>
                            </tr>
                        @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </section>

        <section class="card span-2">
            <h2>Cara melakukan</h2>
            <ol>@foreach ($exercise->steps ?? [] as $step)<li>{{ $step }}</li>@endforeach</ol>
            @if ($exercise->avoid)<p><b style="color:var(--accent)">Hindari:</b> {{ $exercise->avoid }}</p>@endif
            <p><a href="https://www.youtube.com/results?search_query={{ urlencode('cara '.$exercise->video_query.' pemula') }}" target="_blank" rel="noopener">Cari video contoh di YouTube</a>
               · <a href="{{ config('gym.guide_url') }}" target="_blank" rel="noopener">Panduan bergambar</a></p>
        </section>
    </div>
</x-layouts.app>
