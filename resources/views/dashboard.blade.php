@php
    use App\Models\Routine;
    use App\Services\TrainingPlanner;
    $t = config('gym.targets');
    $dayName = Routine::DAY_NAMES[$today->dayOfWeek];
    $protein = $log?->protein();
    $weightChart = ['type' => 'line', 'label' => 'Berat', 'unit' => 'kg', 'decimals' => 1, 'points' => $weightSeries, 'empty' => 'Timbang minimal 2 kali untuk melihat grafik.'];
@endphp
<x-layouts.app title="Beranda">
    <div class="page-head">
        <h1>{{ $dayName }}, {{ $today->translatedFormat('j F') }}</h1>
        <p class="lead">Minggu program ke-{{ $programWeek }} · {{ $weekDone }} dari 3 sesi beban minggu ini</p>
    </div>

    <ol class="week" aria-label="Minggu ini">
        @foreach ($week as $d)
            <li class="{{ $d['lift'] ? 'lift' : '' }} {{ $d['done'] ? 'done' : '' }} {{ $d['today'] ? 'today' : '' }}">
                <b>{{ $d['label'] }}</b>
                <span>{{ $d['done'] ?? $d['plan'] }}</span>
                <span class="check">@if ($d['done'])<x-icon name="check" />@endif</span>
            </li>
        @endforeach
    </ol>

    <div class="grid-2">
        <div class="stack">
            {{-- Sesi hari ini / berikutnya --}}
            <section class="card">
                @if ($todayWorkout)
                    <div class="card-head">
                        <h2>Sesi {{ $todayWorkout->routine->name }}</h2>
                        <span class="tag {{ $todayWorkout->isFinished() ? 'muted' : '' }}">{{ $todayWorkout->isFinished() ? 'Selesai' : 'Sedang jalan' }}</span>
                    </div>
                    <p class="muted">{{ $todayWorkout->routine->focus }}</p>
                    <a class="btn {{ $todayWorkout->isFinished() ? '' : 'primary' }} block" href="{{ route('workouts.show', $todayWorkout) }}">
                        <x-icon name="{{ $todayWorkout->isFinished() ? 'chart' : 'play' }}" />{{ $todayWorkout->isFinished() ? 'Lihat catatan sesi' : 'Lanjutkan sesi' }}
                    </a>
                @else
                    <div class="card-head">
                        <h2>{{ $isGymDay ? 'Hari ini: '.$next->name : 'Hari ini libur' }}</h2>
                        @unless ($isGymDay)<span class="tag muted">Istirahat</span>@endunless
                    </div>
                    <p class="muted">
                        @if ($isGymDay)
                            {{ $next->focus }}. Total sekitar 70–80 menit dari pemanasan sampai pendinginan.
                        @else
                            Aktivitas biasa saja, tidak perlu cardio tambahan. Sesi berikutnya: <b>{{ $next->name }}</b> ({{ $next->focus }}).
                        @endif
                    </p>
                    <form method="post" action="{{ route('workouts.start', $next) }}">
                        @csrf
                        <button class="btn {{ $isGymDay ? 'primary' : '' }} block" type="submit">
                            <x-icon name="play" />Mulai sesi {{ $next->name }}{{ $isGymDay ? '' : ' sekarang' }}
                        </button>
                    </form>
                    <p class="muted" style="font-size:.88rem">Urutan tetap Dorong → Tarik → Kaki. Kalau bolos, lanjut ke sesi berikutnya, jangan dobel.</p>
                @endif
            </section>

            {{-- Hari ini --}}
            <section class="card">
                <div class="card-head">
                    <h2>Catatan hari ini</h2>
                    <a href="{{ route('daily.index') }}">{{ $log ? 'Ubah' : 'Isi sekarang' }}</a>
                </div>
                <div class="stats">
                    <a class="stat" href="{{ route('daily.index') }}">
                        <span class="label">Protein</span>
                        <span class="value">{{ $protein ?? '–' }}<small> / {{ $t['protein_min'] }} g</small></span>
                        <span class="meter {{ ($protein ?? 0) >= $t['protein_min'] ? 'ok' : '' }}"><i style="width: {{ min(100, round(($protein ?? 0) / $t['protein_min'] * 100)) }}%"></i></span>
                    </a>
                    <a class="stat" href="{{ route('daily.index') }}">
                        <span class="label">Langkah</span>
                        <span class="value">{{ $log?->steps ? number_format($log->steps, 0, ',', '.') : '–' }}</span>
                        <span class="meter {{ ($log?->steps ?? 0) >= $t['steps'] ? 'ok' : '' }}"><i style="width: {{ min(100, round(($log?->steps ?? 0) / $t['steps'] * 100)) }}%"></i></span>
                    </a>
                    <a class="stat" href="{{ route('daily.index') }}">
                        <span class="label">Tidur</span>
                        <span class="value">{{ $log?->sleep_hours !== null ? str_replace('.', ',', $log->sleep_hours + 0) : '–' }}<small> jam</small></span>
                        <span class="sub">target {{ $t['sleep_min'] }}–{{ $t['sleep_max'] }} jam</span>
                    </a>
                    <a class="stat" href="{{ route('daily.index') }}">
                        <span class="label">Makan</span>
                        <span class="value">{{ count($log?->meals ?? []) }}<small> / {{ count(config('gym.meals')) }}</small></span>
                        <span class="sub">±{{ number_format($log?->kcal() ?? 0, 0, ',', '.') }} kkal</span>
                    </a>
                </div>
            </section>
        </div>

        <div class="stack">
            {{-- Badan --}}
            <section class="card">
                <div class="card-head">
                    <h2>Berat badan</h2>
                    <a href="{{ route('body.index') }}">Timbang</a>
                </div>
                <div class="stats">
                    <div class="stat">
                        <span class="label">Terakhir</span>
                        <span class="value">{{ $latestWeight ? TrainingPlanner::kg($latestWeight->weight_kg) : '–' }}</span>
                        <span class="sub">{{ $latestWeight?->date->translatedFormat('j M') ?? 'belum ada' }}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Lingkar perut</span>
                        <span class="value">{{ $latestWaist ? str_replace('.', ',', $latestWaist->waist_cm + 0) : '–' }}<small> cm</small></span>
                        <span class="sub">{{ $latestWaist?->date->translatedFormat('j M') ?? 'belum ada' }}</span>
                    </div>
                </div>
                <x-trend-note :trend="$trend" />
                <div class="chart" data-chart='@json($weightChart)'></div>
                @if ($needsWaist)
                    <p class="muted" style="font-size:.9rem">Lingkar perut diukur setinggi pusar tiap 2 minggu. Sudah waktunya mengukur lagi.</p>
                @endif
            </section>
        </div>
    </div>
</x-layouts.app>
