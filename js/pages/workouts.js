import { startSession } from '../actions.js';
import { EXERCISES, ROUTINES, DAY_NAMES } from '../data.js';
import { state } from '../db.js';
import { addDays, nextRoutine, routineBySlug, todayISO, volume } from '../logic.js';
import { esc, monthShort, num, weekday } from '../ui.js';

const PAGE = 15;

export function render(root, params) {
  const page = Math.max(1, Number(params.get('hal')) || 1);
  const next = nextRoutine(state.workouts);
  const today = todayISO();
  const all = [...state.workouts].sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1));
  const list = all.slice((page - 1) * PAGE, page * PAGE);

  const pick = ROUTINES.map((r) => `
    <button type="button" class="${r.slug === next.slug ? 'next' : ''}" data-start="${r.slug}">
      ${r.slug === next.slug ? '<span class="tag">Berikutnya</span>' : ''}
      <b>${esc(r.name)}</b>
      <span>${DAY_NAMES[r.dow]} · ${esc(r.focus)}</span>
      <span>${r.list.map((s) => esc(EXERCISES[s].machine)).join(', ')}</span>
    </button>`).join('');

  const history = list.map((w) => {
    const done = w.sets.filter((s) => s.done).length;
    const vol = volume(w);
    const d = Number(w.date.slice(8));
    return `<a class="item" href="#/latihan/${w.id}">
      <span class="date"><b>${d}</b><small>${esc(monthShort(w.date))}</small></span>
      <span><b>${esc(routineBySlug(w.routine).name)}</b> <span class="muted">· ${esc(weekday(w.date))}</span><br>
        <span class="meta">${done}/${w.sets.length} set${vol ? ` · volume ${num(vol)} kg` : ''}${w.cardioMinutes ? ` · treadmill ${w.cardioMinutes} mnt` : ''}</span></span>
      <span class="tag ${w.finishedAt ? 'muted' : ''}">${w.finishedAt ? 'Selesai' : 'Belum selesai'}</span>
    </a>`;
  }).join('');

  const exList = ROUTINES.flatMap((r) => r.list.map((s) => [r, EXERCISES[s]]))
    .filter(([, e], i, arr) => arr.findIndex(([, x]) => x.slug === e.slug) === i)
    .map(([r, e]) => `<tr>
      <td><a href="#/gerakan/${e.slug}"><img class="thumb" src="img/exercises/${e.slug}-0.jpg" loading="lazy" alt=""></a></td>
      <td><a href="#/gerakan/${e.slug}">${esc(e.name)}</a><br><small>${esc(e.machine)}</small></td>
      <td class="r"><small>${esc(r.name)}</small></td></tr>`).join('');

  root.innerHTML = `
    <div class="page-head">
      <h1>Latihan</h1>
      <p class="lead">3 set tiap gerakan · istirahat 90 detik · treadmill di akhir sesi</p>
    </div>
    <section class="card">
      <h2>Mulai sesi</h2>
      <div class="session-pick">${pick}</div>
      <details class="howto">
        <summary>Catat sesi yang terlewat (tanggal lain)</summary>
        <form class="form-grid" id="past-form" style="margin-top:10px">
          <div class="field"><label for="past-date">Tanggal</label>
            <input id="past-date" type="date" name="date" max="${today}" value="${addDays(today, -1)}" required></div>
          <div class="field"><label for="past-routine">Sesi</label>
            <select id="past-routine" name="routine">${ROUTINES.map((r) => `<option value="${r.slug}">${esc(r.name)}</option>`).join('')}</select></div>
          <button class="btn full" type="submit">Buat catatan</button>
        </form>
      </details>
    </section>
    <section class="stack">
      <h2>Riwayat</h2>
      ${list.length ? `<div class="history">${history}</div>
        <div class="pagination">
          ${page > 1 ? `<a class="btn small" href="#/latihan?hal=${page - 1}">Lebih baru</a>` : ''}
          ${all.length > page * PAGE ? `<a class="btn small" href="#/latihan?hal=${page + 1}">Lebih lama</a>` : ''}
        </div>` : `<p class="chart-empty">Belum ada sesi. Mulai dari sesi ${esc(next.name)} di atas.</p>`}
    </section>
    <section class="card">
      <h2>Kenali alat & progres</h2>
      <div class="tablewrap"><table class="ex-list"><tbody>${exList}</tbody></table></div>
    </section>`;

  root.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', () => startSession(b.dataset.start, today)));
  root.querySelector('#past-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const date = String(f.get('date'));
    if (date > today) return;
    startSession(String(f.get('routine')), date);
  });
}
