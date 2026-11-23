<x-layouts.app title="Latihan">
    <div class="page-head">
        <h1>Latihan</h1>
        <p class="lead">3 set tiap gerakan · istirahat 90 detik · treadmill di akhir sesi</p>
    </div>

    <section class="card">
        <h2>Mulai sesi</h2>
        <div class="session-pick">
            @foreach ($routines as $r)
                <form method="post" action="{{ route('workouts.start', $r) }}">
                    @csrf
                    <button type="submit" class="{{ $r->id === $next->id ? 'next' : '' }}">
                        @if ($r->id === $next->id)<span class="tag">Berikutnya</span>@endif
                        <b>{{ $r->name }}</b>
                        <span>{{ $r->dayName() }} · {{ $r->focus }}</span>
                        <span>{{ $r->exercises->pluck('machine_name')->implode(', ') }}</span>
                    </button>
                </form>
            @endforeach
        </div>
        <details class="howto">
            <summary>Catat sesi yang terlewat (tanggal lain)</summary>
            <form method="post" id="past-form" class="form-grid" style="margin-top:10px"
                  onsubmit="this.action=this.routine.value">
                @csrf
                <div class="field">
                    <label for="past-date">Tanggal</label>
                    <input id="past-date" type="date" name="date" max="{{ now()->toDateString() }}" value="{{ now()->subDay()->toDateString() }}" required>
                </div>
                <div class="field">
                    <label for="past-routine">Sesi</label>
                    <select id="past-routine" name="routine">
                        @foreach ($routines as $r)
                            <option value="{{ route('workouts.start', $r) }}">{{ $r->name }}</option>
                        @endforeach
                    </select>
                </div>
                <button class="btn full" type="submit">Buat catatan</button>
            </form>
        </details>
    </section>

    <section class="stack">
        <h2>Riwayat</h2>
        @if ($workouts->isEmpty())
            <p class="chart-empty">Belum ada sesi. Mulai dari sesi {{ $next->name }} di atas.</p>
        @else
            <div class="history">
                @foreach ($workouts as $w)
                    @php
                        $done = $w->sets->where('done', true)->count();
                        $vol = $w->volume();
                    @endphp
                    <a class="item" href="{{ route('workouts.show', $w) }}">
                        <span class="date"><b>{{ $w->date->format('j') }}</b><small>{{ $w->date->translatedFormat('M') }}</small></span>
                        <span>
                            <b>{{ $w->routine->name }}</b> <span class="muted">· {{ $w->date->translatedFormat('l') }}</span><br>
                            <span class="meta">{{ $done }}/{{ $w->sets->count() }} set
                                @if ($vol) · volume {{ number_format($vol, 0, ',', '.') }} kg @endif
                                @if ($w->cardio_minutes) · treadmill {{ $w->cardio_minutes }} mnt @endif
                            </span>
                        </span>
                        <span class="tag {{ $w->isFinished() ? 'muted' : '' }}">{{ $w->isFinished() ? 'Selesai' : 'Belum selesai' }}</span>
                    </a>
                @endforeach
            </div>
            <div class="pagination">
                @if ($workouts->previousPageUrl())<a class="btn small" href="{{ $workouts->previousPageUrl() }}">Lebih baru</a>@endif
                @if ($workouts->nextPageUrl())<a class="btn small" href="{{ $workouts->nextPageUrl() }}">Lebih lama</a>@endif
            </div>
        @endif
    </section>

    <section class="card">
        <h2>Progres per gerakan</h2>
        <div class="tablewrap">
            <table>
                <tbody>
                @foreach ($routines as $r)
                    @foreach ($r->exercises as $e)
                        <tr>
                            <td><a href="{{ route('exercises.show', $e) }}">{{ $e->name }}</a><br><small>{{ $e->machine_name }}</small></td>
                            <td class="r"><small>{{ $r->name }}</small></td>
                        </tr>
                    @endforeach
                @endforeach
                </tbody>
            </table>
        </div>
    </section>
</x-layouts.app>
