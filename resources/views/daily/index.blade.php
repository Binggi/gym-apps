@php
    $t = config('gym.targets');
    $meals = config('gym.meals');
    $isToday = $date->isToday();
    $prev = $date->copy()->subDay()->toDateString();
    $next = $date->copy()->addDay();
    $checked = old('meals', $log->meals ?? []);
    $pts = fn ($key) => $days->map(fn ($d) => [$d['date'], $d[$key]])->values();
    $stepsChart = ['type' => 'bar', 'label' => 'Langkah', 'unit' => '', 'points' => $pts('steps'), 'target' => $t['steps'], 'targetLabel' => '8.000', 'empty' => 'Belum ada catatan langkah 14 hari terakhir.'];
    $proteinChart = ['type' => 'bar', 'label' => 'Protein', 'unit' => 'g', 'points' => $pts('protein'), 'target' => $t['protein_min'], 'targetLabel' => $t['protein_min'].' g', 'empty' => 'Belum ada catatan makan 14 hari terakhir.'];
    $sleepChart = ['type' => 'bar', 'label' => 'Tidur', 'unit' => 'jam', 'decimals' => 1, 'points' => $pts('sleep'), 'target' => $t['sleep_min'], 'targetLabel' => '7 jam', 'empty' => 'Belum ada catatan tidur 14 hari terakhir.'];
    $fmt = fn ($v) => $v === null ? '' : str_replace('.', ',', $v + 0);
@endphp
<x-layouts.app title="Harian">
    <div class="page-head">
        <h1>Harian</h1>
        <div class="btn-row" style="align-items:center">
            <a class="btn small" href="{{ route('daily.index', ['tanggal' => $prev]) }}" aria-label="Hari sebelumnya"><x-icon name="chevron-left" /></a>
            <b style="font-size:1.1rem">{{ $isToday ? 'Hari ini · ' : '' }}{{ $date->translatedFormat('l, j F Y') }}</b>
            @unless ($isToday)
                <a class="btn small" href="{{ route('daily.index', ['tanggal' => $next->toDateString()]) }}" aria-label="Hari berikutnya"><x-icon name="chevron-right" /></a>
                <a class="btn ghost small" href="{{ route('daily.index') }}">Hari ini</a>
            @endunless
        </div>
    </div>

    <div class="grid-2">
        <form class="stack" method="post" action="{{ route('daily.store') }}" data-meals data-protein-target="{{ $t['protein_min'] }}">
            @csrf
            <input type="hidden" name="date" value="{{ $date->toDateString() }}">

            <section class="card">
                <div class="card-head">
                    <h2>Makan</h2>
                    <span><b data-total-protein>0</b> g protein · ±<b data-total-kcal>0</b> kkal</span>
                </div>
                <span class="meter"><i data-protein-meter style="width:0"></i></span>
                <p class="muted" style="font-size:.88rem">Target ±{{ number_format($t['kcal'], 0, ',', '.') }} kkal · {{ $t['protein_min'] }}–{{ $t['protein_max'] }} g protein. Centang yang sudah habis. Lauk boleh ditukar selama proteinnya mirip.</p>
                <div class="meals">
                    @foreach ($meals as $key => $m)
                        <label class="meal">
                            <input type="checkbox" name="meals[]" value="{{ $key }}" data-protein="{{ $m['protein'] }}" data-kcal="{{ $m['kcal'] }}" @checked(in_array($key, $checked, true))>
                            <span><b>{{ $m['label'] }}</b><small>{{ $m['menu'] }}</small></span>
                            <span class="p">±{{ $m['protein'] }} g</span>
                        </label>
                    @endforeach
                </div>
                <div class="form-grid">
                    <div class="field">
                        <label for="extra_protein_g">Protein tambahan</label>
                        <div class="suffix"><input id="extra_protein_g" name="extra_protein_g" type="number" inputmode="numeric" min="0" max="500" value="{{ old('extra_protein_g', $log->extra_protein_g) }}"><span>g</span></div>
                    </div>
                    <div class="field">
                        <label for="extra_kcal">Kalori tambahan</label>
                        <div class="suffix"><input id="extra_kcal" name="extra_kcal" type="number" inputmode="numeric" min="0" max="5000" value="{{ old('extra_kcal', $log->extra_kcal) }}"><span>kkal</span></div>
                    </div>
                </div>
                <details class="howto">
                    <summary>Tukar lauk (protein per porsi)</summary>
                    <div class="tablewrap"><table><tbody>
                        @foreach (config('gym.swaps') as [$name, $p])
                            <tr><td>{{ $name }}</td><td class="r">±{{ $p }} g</td></tr>
                        @endforeach
                    </tbody></table></div>
                </details>
            </section>

            <section class="card">
                <h2>Aktivitas & istirahat</h2>
                <div class="form-grid">
                    <div class="field full">
                        <label for="steps">Langkah <span class="hint">target {{ number_format($t['steps'], 0, ',', '.') }}</span></label>
                        <input id="steps" name="steps" type="number" inputmode="numeric" min="0" max="100000" value="{{ old('steps', $log->steps) }}">
                    </div>
                    <div class="field">
                        <label for="sleep_hours">Tidur</label>
                        <div class="suffix"><input id="sleep_hours" name="sleep_hours" type="number" inputmode="decimal" step="0.5" min="0" max="24" value="{{ old('sleep_hours', $log->sleep_hours !== null ? $log->sleep_hours + 0 : null) }}" placeholder="7–8"><span>jam</span></div>
                    </div>
                    <div class="field">
                        <label for="water_liters">Air putih</label>
                        <div class="suffix"><input id="water_liters" name="water_liters" type="number" inputmode="decimal" step="0.25" min="0" max="15" value="{{ old('water_liters', $log->water_liters !== null ? $log->water_liters + 0 : null) }}" placeholder="2,5–3"><span>liter</span></div>
                    </div>
                    <div class="field full">
                        <span class="muted" style="font-size:.92rem">Cardio (treadmill) hari ini: <b>{{ $cardioToday ? $cardioToday.' menit' : 'belum ada' }}</b> · dicatat di halaman sesi latihan.</span>
                    </div>
                    <div class="field full">
                        <label for="notes">Catatan <span class="hint">pegal, mood, lapar…</span></label>
                        <textarea id="notes" name="notes">{{ old('notes', $log->notes) }}</textarea>
                    </div>
                </div>
                <button class="btn primary block" type="submit">Simpan catatan {{ $isToday ? 'hari ini' : $date->translatedFormat('j M') }}</button>
            </section>
        </form>

        <div class="stack">
            <section class="card">
                <h2>Protein · 14 hari</h2>
                <div class="chart" data-chart='@json($proteinChart)'></div>
            </section>
            <section class="card">
                <h2>Langkah · 14 hari</h2>
                <div class="chart" data-chart='@json($stepsChart)'></div>
            </section>
            <section class="card">
                <h2>Tidur · 14 hari</h2>
                <div class="chart" data-chart='@json($sleepChart)'></div>
            </section>
        </div>

        <section class="card span-2">
            <h2>14 hari terakhir</h2>
            <div class="tablewrap">
                <table>
                    <thead><tr><th>Tanggal</th><th class="r">Protein</th><th class="r">Kkal</th><th class="r">Langkah</th><th class="r">Tidur</th><th class="r">Air</th><th class="r">Cardio</th></tr></thead>
                    <tbody>
                    @foreach ($days->reverse() as $d)
                        @php $dd = \Carbon\Carbon::parse($d['date']); @endphp
                        <tr>
                            <td class="nowrap"><a href="{{ route('daily.index', ['tanggal' => $d['date']]) }}">{{ $dd->translatedFormat('D, j M') }}</a></td>
                            <td class="r">{{ $d['protein'] !== null ? $d['protein'].' g' : '–' }}</td>
                            <td class="r">{{ $d['kcal'] ? number_format($d['kcal'], 0, ',', '.') : '–' }}</td>
                            <td class="r">{{ $d['steps'] !== null ? number_format($d['steps'], 0, ',', '.') : '–' }}</td>
                            <td class="r">{{ $d['sleep'] !== null ? $fmt($d['sleep']).' j' : '–' }}</td>
                            <td class="r">{{ $d['water'] !== null ? $fmt($d['water']).' L' : '–' }}</td>
                            <td class="r">{{ $d['cardio'] ? $d['cardio'].' mnt' : '–' }}</td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</x-layouts.app>
