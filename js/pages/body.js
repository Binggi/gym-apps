import { refresh } from '../actions.js';
import { put, remove, state } from '../db.js';
import { diffDays, todayISO, weightTrend } from '../logic.js';
import { chart, esc, icon, num, toast, trendNote, val } from '../ui.js';

export function render(root, params) {
  const today = todayISO();
  const all = [...state.body].sort((a, b) => (a.date < b.date ? -1 : 1));
  const recent = all.filter((m) => diffDays(m.date, today) <= 120);
  const trend = weightTrend(all.filter((m) => diffDays(m.date, today) <= 60));
  const todayEntry = all.find((m) => m.date === today);
  const weightPts = recent.filter((m) => m.weight != null).map((m) => [m.date, m.weight]);
  const waistPts = recent.filter((m) => m.waist != null).map((m) => [m.date, m.waist]);
  const entries = [...all].reverse();
  const fmtDate = (iso) => new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso + 'T00:00'));

  const rows = entries.map((m, i) => {
    const prev = entries.slice(i + 1).find((x) => x.weight != null);
    const diff = m.weight != null && prev ? Math.round((m.weight - prev.weight) * 10) / 10 : null;
    const sign = diff === null ? '' : diff > 0 ? '+' : diff < 0 ? '−' : '±';
    const sub = [m.waist != null ? `perut ${num(m.waist, 1)} cm` : null, diff !== null ? `${sign}${num(Math.abs(diff), 1)} kg` : null].filter(Boolean).join(' · ');
    return `<div class="row no-lead">
      <span><span class="title">${m.weight != null ? `${num(m.weight, 1)} kg` : `Perut ${num(m.waist, 1)} cm`}</span>
        <span class="sub">${esc(fmtDate(m.date))}${sub && m.weight != null ? ' · ' + esc(sub) : ''}</span></span>
      <button class="iconbtn" type="button" data-del="${m.date}" aria-label="Hapus catatan ${esc(fmtDate(m.date))}">${icon('trash')}</button>
    </div>`;
  }).join('');

  root.innerHTML = `
    <div class="grid-2">
      <div class="stack">
        <form class="card" id="body-form">
          <div><h2>Catat timbangan</h2><p class="muted small">Pagi, setelah ke toilet.</p></div>
          <div class="form-grid">
            <div class="field full"><label for="bdate">Tanggal</label>
              <input id="bdate" type="date" name="date" value="${today}" max="${today}" required></div>
            <div class="field"><label for="weight">Berat</label>
              <div class="suffix"><input id="weight" name="weight" type="number" inputmode="decimal" step="0.1" min="30" max="250" value="${val(todayEntry?.weight)}"><span>kg</span></div></div>
            <div class="field"><label for="waist">Perut</label>
              <div class="suffix"><input id="waist" name="waist" type="number" inputmode="decimal" step="0.5" min="40" max="200" value="${val(todayEntry?.waist)}"><span>cm</span></div></div>
          </div>
          <p class="form-error" role="alert" hidden></p>
          <button class="btn primary block" type="submit">Simpan</button>
        </form>
        ${entries.length ? trendNote(trend) : ''}
      </div>
      <div class="stack">
        ${weightPts.length >= 2 || waistPts.length >= 2 ? `
          ${weightPts.length >= 2 ? `<section class="card">
            <div class="card-head"><h2>Berat badan</h2>${trend.avg7 ? `<span class="pill">rata-rata ${num(trend.avg7, 1)} kg</span>` : ''}</div>
            ${chart({ type: 'line', label: 'Berat', unit: 'kg', decimals: 1, points: weightPts })}
          </section>` : ''}
          ${waistPts.length >= 2 ? `<section class="card">
            <h2>Lingkar perut</h2>
            ${chart({ type: 'line', label: 'Lingkar perut', unit: 'cm', decimals: 1, height: 160, points: waistPts })}
          </section>` : ''}`
        : `<p class="chart-empty">Grafik muncul setelah 2 kali timbang.</p>`}
        <details class="card howto">
          <summary>Aturan porsi</summary>
          <ul class="tips">
            <li>Target turun <b>0,25–0,5 kg</b> per minggu.</li>
            <li>Turun lebih dari 0,75 kg/minggu: <b>tambah 150–200 kkal</b>.</li>
            <li>Tidak turun 2–3 minggu: <b>kurangi 150–200 kkal</b>.</li>
            <li>Masih turun lebih dari 1 kg/minggu padahal makan sudah sesuai: periksa ke dokter (gula darah, tiroid). Lebih cepat kalau sering haus, sering kencing, lemas, atau jantung berdebar.</li>
          </ul>
        </details>
      </div>
      ${entries.length ? `<section class="card span-2">
        <h2>Semua catatan</h2>
        <div class="list">${rows}</div>
      </section>` : ''}
    </div>`;

  const form = root.querySelector('#body-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const err = form.querySelector('.form-error');
    const n = (k) => { const v = String(f.get(k) ?? '').replace(',', '.'); return v === '' ? null : Number(v); };
    const date = String(f.get('date'));
    const weight = n('weight'), waist = n('waist');
    const problem = !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today ? 'Pilih tanggal hari ini atau sebelumnya.'
      : weight === null && waist === null ? 'Isi berat atau lingkar perut.'
      : weight !== null && !(weight >= 30 && weight <= 250) ? 'Berat harus antara 30 dan 250 kg.'
      : waist !== null && !(waist >= 40 && waist <= 200) ? 'Lingkar perut harus antara 40 dan 200 cm.' : null;
    err.hidden = !problem;
    err.textContent = problem ?? '';
    if (problem) return;

    const old = state.body.find((m) => m.date === date) ?? { date, weight: null, waist: null };
    await put('body', { date, weight: weight ?? old.weight, waist: waist ?? old.waist });
    toast('Catatan badan tersimpan.');
    refresh();
  });

  root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Hapus catatan ini?')) return;
    await remove('body', b.dataset.del);
    toast('Catatan dihapus.');
    refresh();
  }));
}
