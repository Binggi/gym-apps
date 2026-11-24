import { EXERCISES, GUIDE_URL } from '../data.js';
import { state } from '../db.js';
import { fmtKg, suggestion } from '../logic.js';
import { chart, esc, icon, photos } from '../ui.js';

export function render(root, params, slug) {
  const e = EXERCISES[slug];
  if (!e) {
    root.innerHTML = '<div class="page-head"><h1>Gerakan tidak ditemukan</h1></div><a class="btn" href="#/latihan">Kembali ke Latihan</a>';
    return;
  }
  const metric = e.weight ? 'Beban terberat' : e.timed ? 'Detik terlama' : 'Repetisi terbanyak';

  const history = state.workouts
    .map((w) => ({ w, sets: w.sets.filter((s) => s.exercise === slug && s.done).sort((a, b) => a.n - b.n) }))
    .filter((h) => h.sets.length)
    .sort((a, b) => (a.w.date === b.w.date ? a.w.id - b.w.id : a.w.date < b.w.date ? -1 : 1))
    .map((h) => ({ ...h, top: e.weight ? Math.max(...h.sets.map((s) => s.weight ?? 0)) || null : Math.max(...h.sets.map((s) => s.reps ?? 0)) || null }));

  const series = history.filter((h) => h.top !== null).map((h) => [h.w.date, h.top]);
  const s = suggestion(state.workouts, slug);
  const fmtDate = (iso) => new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso + 'T00:00'));

  const rows = [...history].reverse().map((h) => `<a class="row no-lead" href="#/latihan/${h.w.id}">
      <span><span class="title">${esc(fmtDate(h.w.date))}</span>
        <span class="sub">${e.timed ? 'Detik' : 'Repetisi'}: ${h.sets.map((x) => x.reps ?? '–').join(', ')}</span></span>
      <span class="trail">${e.weight ? esc([...new Set(h.sets.map((x) => x.weight))].map((x) => fmtKg(x)).join(' / ')) : ''}${icon('right')}</span>
    </a>`).join('');

  root.innerHTML = `
    <div class="page-head">
      <h1>${esc(e.name)}</h1>
      <p class="lead">${esc(e.machine)} · ${esc(e.muscle)} · target ${e.repMin === e.repMax ? e.repMin : `${e.repMin}–${e.repMax}`}${e.timed ? ' detik' : ''}${e.perSide ? ' per sisi' : ''}</p>
    </div>
    <div class="grid-2">
      <section class="card">
        <h2>Cara melakukan</h2>
        ${photos(e, true)}
        <ol>${e.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
        <p><b class="accent">Hindari:</b> ${esc(e.avoid)}</p>
        <div class="chips">
          <a class="chip" href="https://www.youtube.com/results?search_query=${encodeURIComponent(`cara ${e.q} pemula`)}" target="_blank" rel="noopener">${icon('play')}Video YouTube</a>
          <a class="chip" href="https://musclewiki.com/" target="_blank" rel="noopener">MuscleWiki</a>
          <a class="chip" href="${GUIDE_URL}" target="_blank" rel="noopener">Panduan bergambar</a>
        </div>
        <p class="muted tiny">Foto: free-exercise-db (public domain).</p>
      </section>
      <div class="stack">
        <section class="card">
          <h2>${metric} per sesi</h2>
          ${chart({ type: 'line', label: metric, unit: e.weight ? 'kg' : e.timed ? 'dtk' : 'kali', decimals: 1, minSpan: e.weight ? 2.5 : 2, points: series, empty: 'Selesaikan minimal 2 sesi dengan gerakan ini untuk melihat grafik.' })}
          <div class="hint-box ${s.type === 'up' ? 'up' : ''}"><span>Sesi berikutnya: ${esc(s.text)}</span></div>
        </section>
        <section class="card">
          <h2>Riwayat</h2>
          ${history.length ? `<div class="list">${rows}</div>` : '<p class="muted">Belum ada set yang selesai untuk gerakan ini.</p>'}
        </section>
      </div>
    </div>`;
}
