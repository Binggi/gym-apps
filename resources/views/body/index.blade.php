@php
    $weightChart = ['type' => 'line', 'label' => 'Berat', 'unit' => 'kg', 'decimals' => 1, 'points' => $weightSeries, 'empty' => 'Timbang minimal 2 kali untuk melihat grafik.'];
    $waistChart = ['type' => 'line', 'label' => 'Lingkar perut', 'unit' => 'cm', 'decimals' => 1, 'height' => 160, 'points' => $waistSeries, 'empty' => 'Ukur lingkar perut tiap 2 minggu. Grafik muncul setelah 2 kali ukur.'];
    $fmt = fn ($v) => $v === null ? '–' : str_replace('.', ',', $v + 0);
@endphp
<x-layouts.app title="Badan">
    <div class="page-head">
        <h1>Badan</h1>
        <p class="lead">Timbang pagi setelah ke toilet, dengan timbangan yang sama, 2–3 kali seminggu.</p>
    </div>

    <div class="grid-2">
        <div class="stack">
            <form class="card" method="post" action="{{ route('body.store') }}">
                <h2>Catat</h2>
                @csrf
                <div class="form-grid">
                    <div class="field full">
                        <label for="date">Tanggal</label>
                        <input id="date" type="date" name="date" value="{{ old('date', now()->toDateString()) }}" max="{{ now()->toDateString() }}" required>
                    </div>
                    <div class="field">
                        <label for="weight_kg">Berat</label>
                        <div class="suffix">
                            <input id="weight_kg" name="weight_kg" type="number" inputmode="decimal" step="0.1" min="30" max="250"
                                   value="{{ old('weight_kg', $todayEntry?->weight_kg) }}" placeholder="77,0">
                            <span>kg</span>
                        </div>
                    </div>
                    <div class="field">
                        <label for="waist_cm">Lingkar perut <span class="hint">setinggi pusar</span></label>
                        <div class="suffix">
                            <input id="waist_cm" name="waist_cm" type="number" inputmode="decimal" step="0.5" min="40" max="200"
                                   value="{{ old('waist_cm', $todayEntry?->waist_cm) }}">
                            <span>cm</span>
                        </div>
                    </div>
                </div>
                <button class="btn primary block" type="submit">Simpan</button>
                <p class="muted" style="font-size:.88rem">Tanggal yang sama akan diperbarui, bukan ditambah.</p>
            </form>

            <x-trend-note :trend="$trend" />

            <section class="card">
                <h3>Aturan penyesuaian</h3>
                <ul style="margin:0;padding-left:1.2em;display:grid;gap:4px">
                    <li>Target turun <b>0,25–0,5 kg</b> per minggu.</li>
                    <li>Turun lebih dari 0,75 kg/minggu: <b>tambah 150–200 kkal</b>.</li>
                    <li>Tidak turun 2–3 minggu: <b>kurangi 150–200 kkal</b>.</li>
                    <li>Masih turun lebih dari 1 kg/minggu padahal makan sudah sesuai: periksa ke dokter (gula darah, tiroid). Lebih cepat kalau sering haus, sering kencing, lemas, atau jantung berdebar.</li>
                </ul>
            </section>
        </div>

        <div class="stack">
            <section class="card">
                <div class="card-head">
                    <h2>Berat badan</h2>
                    @if ($trend['avg7'])<span class="muted">rata-rata 7 hari {{ $fmt($trend['avg7']) }} kg</span>@endif
                </div>
                <div class="chart" data-chart='@json($weightChart)'></div>
            </section>
            <section class="card">
                <h2>Lingkar perut</h2>
                <div class="chart" data-chart='@json($waistChart)'></div>
            </section>
        </div>

        <section class="card span-2">
            <h2>Semua catatan</h2>
            @if ($entries->isEmpty())
                <p class="muted">Belum ada catatan.</p>
            @else
                <div class="tablewrap">
                    <table>
                        <thead><tr><th>Tanggal</th><th class="r">Berat</th><th class="r">Selisih</th><th class="r">Perut</th><th></th></tr></thead>
                        <tbody>
                        @foreach ($entries as $i => $m)
                            @php
                                $prev = $entries->slice($i + 1)->first(fn ($x) => $x->weight_kg !== null);
                                $diff = $m->weight_kg !== null && $prev ? round($m->weight_kg - $prev->weight_kg, 1) : null;
                            @endphp
                            <tr>
                                <td>{{ $m->date->translatedFormat('D, j M Y') }}</td>
                                <td class="r">{{ $fmt($m->weight_kg) }}{{ $m->weight_kg !== null ? ' kg' : '' }}</td>
                                <td class="r muted">{{ $diff === null ? '' : ($diff > 0 ? '+' : ($diff < 0 ? '−' : '±')).$fmt(abs($diff)) }}</td>
                                <td class="r">{{ $fmt($m->waist_cm) }}{{ $m->waist_cm !== null ? ' cm' : '' }}</td>
                                <td class="r">
                                    <form method="post" action="{{ route('body.destroy', $m) }}" class="inline" data-confirm="Hapus catatan {{ $m->date->translatedFormat('j M') }}?">
                                        @csrf @method('DELETE')
                                        <button class="btn ghost small" type="submit" aria-label="Hapus"><x-icon name="trash" /></button>
                                    </form>
                                </td>
                            </tr>
                        @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </section>
    </div>
</x-layouts.app>
