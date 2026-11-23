@php
    $finished = $workout->isFinished();
    $n = 0;
@endphp
<x-layouts.app :title="'Sesi '.$workout->routine->name">
    <div class="page-head" data-wakelock>
        <a class="muted" href="{{ route('workouts.index') }}" style="font-size:.95rem">← Latihan</a>
        <h1>{{ $workout->routine->name }} · {{ $workout->date->translatedFormat('l, j M') }}</h1>
        <p class="lead">{{ $workout->routine->focus }} · minggu ke-{{ $programWeek }}</p>
    </div>

    @if ($finished)
        <div class="note good"><x-icon name="check" /><div><b>Sesi selesai</b> Kamu masih bisa mengubah angka di bawah; perubahan tersimpan otomatis.</div></div>
    @endif

    <details class="card howto">
        <summary>Pemanasan 8–10 menit</summary>
        <ol>
            <li>Jalan santai di treadmill 5 menit, tanpa tanjakan.</li>
            <li>Putar bahu, buka-tutup tangan, jongkok tanpa beban, bungkuk dari pinggul · masing-masing 10 kali.</li>
            <li>Sebelum alat pertama: 1 set 10 kali dengan sekitar setengah beban biasanya.</li>
        </ol>
    </details>

    <div class="grid-2">
        @foreach ($groups as $g)
            @php
                $e = $g['exercise'];
                $s = $g['suggestion'];
                $n++;
            @endphp
            <article class="card ex" id="ex-{{ $e->id }}">
                <div class="ex-head">
                    <span class="n">{{ $n }}</span>
                    <div>
                        <h3>{{ $e->name }}</h3>
                        <p class="sign"><b>{{ $e->machine_name }}</b> · {{ $e->muscle }} · target {{ $e->targetLabel() }}</p>
                    </div>
                    <span class="done-badge" hidden title="Semua set selesai"><x-icon name="check" /></span>
                </div>

                <div class="hint-box {{ $s['type'] === 'up' ? 'up' : '' }}">
                    <span>@if ($s['type'] === 'up')<b>Naik!</b> @endif{{ $s['text'] }}</span>
                    @if ($s['last'])<span class="last">Sesi lalu: {{ $s['last'] }}</span>@endif
                </div>

                <div class="sets">
                    <div class="set-head {{ $e->uses_weight ? '' : 'no-weight' }}" aria-hidden="true">
                        <span>Set</span>@if ($e->uses_weight)<span>Beban</span>@endif<span>{{ $e->is_timed ? 'Detik' : 'Rep' }}</span><span>Selesai</span>
                    </div>
                    @foreach ($g['sets'] as $set)
                        <div class="set-row {{ $e->uses_weight ? '' : 'no-weight' }} {{ $set->done ? 'is-done' : '' }}"
                             data-set data-url="{{ route('sets.update', $set) }}">
                            <span class="sn">{{ $set->set_number }}</span>
                            @if ($e->uses_weight)
                                <label>
                                    <input name="weight_kg" type="text" inputmode="decimal" autocomplete="off"
                                           value="{{ $set->weight_kg !== null ? str_replace('.', ',', $set->weight_kg + 0) : '' }}"
                                           placeholder="kg" aria-label="Beban set {{ $set->set_number }} (kg)">
                                    <span class="unit">kg</span>
                                </label>
                            @endif
                            <label>
                                <input name="reps" type="number" inputmode="numeric" min="0" max="600"
                                       value="{{ $set->reps }}" placeholder="{{ $e->rep_max }}"
                                       aria-label="{{ $e->is_timed ? 'Detik' : 'Repetisi' }} set {{ $set->set_number }}">
                                <span class="unit">{{ $e->is_timed ? 'detik' : ($e->per_side ? 'per sisi' : 'kali') }}</span>
                            </label>
                            <button type="button" class="donebtn" aria-pressed="{{ $set->done ? 'true' : 'false' }}" aria-label="Tandai set {{ $set->set_number }} selesai">
                                <x-icon name="check" />
                            </button>
                        </div>
                    @endforeach
                </div>

                <div class="set-tools">
                    <span class="save-state" aria-live="polite"></span>
                    <div class="btn-row">
                        @if ($g['sets']->count() > 1)
                            <form method="post" action="{{ route('sets.destroy', $g['sets']->last()) }}" class="inline">
                                @csrf @method('DELETE')
                                <button class="btn ghost small" type="submit">Hapus set</button>
                            </form>
                        @endif
                        <form method="post" action="{{ route('workouts.sets.store', $workout) }}" class="inline">
                            @csrf
                            <input type="hidden" name="exercise_id" value="{{ $e->id }}">
                            <button class="btn ghost small" type="submit"><x-icon name="plus" />Set</button>
                        </form>
                    </div>
                </div>

                <details class="howto">
                    <summary>Cara melakukan</summary>
                    <ol>@foreach ($e->steps ?? [] as $step)<li>{{ $step }}</li>@endforeach</ol>
                    @if ($e->avoid)<p><b>Hindari:</b> {{ $e->avoid }}</p>@endif
                    <p class="btn-row">
                        <a href="https://www.youtube.com/results?search_query={{ urlencode('cara '.$e->video_query.' pemula') }}" target="_blank" rel="noopener">Cari video di YouTube</a>
                        · <a href="{{ route('exercises.show', $e) }}">Progres</a>
                    </p>
                </details>
            </article>
        @endforeach

        {{-- Treadmill + selesai --}}
        <form class="card" method="post" action="{{ route('workouts.finish', $workout) }}" data-autosave="{{ route('workouts.update', $workout) }}">
            @csrf
            <div class="ex-head">
                <span class="n">{{ $n + 1 }}</span>
                <div>
                    <h3>Jalan di Treadmill</h3>
                    <p class="sign">Target {{ $cardio['min'] }}–{{ $cardio['max'] }} menit · ±{{ str_replace('.', ',', config('gym.cardio.speed')) }} km/jam · tanjakan {{ config('gym.cardio.incline') }} · masih bisa bicara</p>
                </div>
            </div>
            <div class="form-grid">
                <div class="field full">
                    <label for="cardio_minutes">Menit</label>
                    <input id="cardio_minutes" name="cardio_minutes" type="number" inputmode="numeric" min="0" max="300" value="{{ $workout->cardio_minutes }}" placeholder="{{ $cardio['min'] }}">
                </div>
                <div class="field">
                    <label for="cardio_speed">Kecepatan (km/jam)</label>
                    <input id="cardio_speed" name="cardio_speed" type="number" inputmode="decimal" step="0.1" min="0" max="25" value="{{ $workout->cardio_speed }}">
                </div>
                <div class="field">
                    <label for="cardio_incline">Tanjakan</label>
                    <input id="cardio_incline" name="cardio_incline" type="number" inputmode="decimal" step="0.5" min="0" max="15" value="{{ $workout->cardio_incline }}" placeholder="3–6">
                </div>
                <div class="field full">
                    <label for="notes">Catatan <span class="hint">pegal, alat penuh, rasa badan…</span></label>
                    <textarea id="notes" name="notes">{{ $workout->notes }}</textarea>
                </div>
            </div>
            <span class="save-state" aria-live="polite"></span>
            <p class="muted" style="font-size:.9rem">Pendinginan: jalan santai 2–3 menit, lalu peregangan dada, punggung, paha depan, paha belakang · 30 detik.</p>
            @unless ($finished)
                <button class="btn primary block" type="submit"><x-icon name="check" />Selesaikan sesi</button>
            @endunless
        </form>
    </div>

    <div class="btn-row" style="justify-content:space-between">
        @if ($finished)
            <form method="post" action="{{ route('workouts.reopen', $workout) }}" class="inline">
                @csrf
                <button class="btn small" type="submit">Tandai belum selesai</button>
            </form>
        @endif
        <form method="post" action="{{ route('workouts.destroy', $workout) }}" class="inline" data-confirm="Hapus sesi ini beserta semua setnya?">
            @csrf @method('DELETE')
            <button class="btn ghost small danger" type="submit"><x-icon name="trash" />Hapus sesi</button>
        </form>
    </div>

    <div class="rest" id="rest" hidden data-seconds="{{ config('gym.rest_seconds') }}" role="timer" aria-live="off">
        <span><span class="t">1:30</span> <span class="lbl">Istirahat</span></span>
        <button type="button" data-add>+30 dtk</button>
        <button type="button" data-stop>Tutup</button>
    </div>
</x-layouts.app>
