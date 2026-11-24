import { refresh, startSession } from '../actions.js';
import { EXERCISES, ROUTINES, DAY_NAMES } from '../data.js';
import { state } from '../db.js';
import { nextRoutine, routineBySlug, todayISO } from '../logic.js';
import { bindPastForm, pastForm } from '../past.js';
import { esc, icon, monthShort, weekday } from '../ui.js';

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
      <span>${r.list.length} gerakan</span>
    </button>`).join('');

  const history = list.map((w) => {
    const done = w.sets.filter((s) => s.done).length;
    return `<a class="item" href="#/latihan/${w.id}">
      <span class="date"><b>${Number(w.date.slice(8))}</b><small>${esc(monthShort(w.date))}</small></span>
      <span><b>${esc(routineBySlug(w.routine).name)}</b> <span class="muted small">· ${esc(weekday(w.date))}</span><br>
        <span class="meta">${w.quick ? 'Tanpa detail beban' : `${done}/${w.sets.length} set`}${w.cardioMinutes ? ` · ${w.cardioMinutes} mnt jalan` : ''}</span></span>
      <span class="tag ${w.finishedAt ? 'muted' : ''}">${w.finishedAt ? 'Selesai' : 'Berjalan'}</span>
    </a>`;
  }).join('');

  const seen = new Set();
  const exercises = ROUTINES.map((r) => {
    const rows = r.list.filter((s) => !seen.has(s) && seen.add(s)).map((s) => {
      const e = EXERCISES[s];
      return `<a class="row" href="#/gerakan/${e.slug}">
        <img class="thumb" src="img/exercises/${e.slug}-0.jpg" loading="lazy" alt="">
        <span><span class="title">${esc(e.name)}</span><span class="sub">${esc(e.machine)}</span></span>
        <span class="trail">${icon('right')}</span>
      </a>`;
    }).join('');
    return `<h4 class="section-title">${esc(r.name)}</h4><div class="list">${rows}</div>`;
  }).join('');

  root.innerHTML = `
    <section class="card">
      <h2>Mulai sesi</h2>
      <div class="session-pick">${pick}</div>
    </section>
    <details class="card howto" ${state.workouts.length ? '' : 'open'}>
      <summary>Catat sesi lama</summary>
      ${pastForm('past-latihan')}
    </details>
    <h3 class="section-title">Riwayat</h3>
    ${list.length ? `<div class="history">${history}</div>
      <div class="pagination">
        ${page > 1 ? `<a class="btn small" href="#/latihan?hal=${page - 1}">${icon('left')}Lebih baru</a>` : ''}
        ${all.length > page * PAGE ? `<a class="btn small" href="#/latihan?hal=${page + 1}">Lebih lama${icon('right')}</a>` : ''}
      </div>` : `<p class="chart-empty">Belum ada sesi.</p>`}
    <section class="card">
      <h2>Kenali alat & progres</h2>
      ${exercises}
    </section>`;

  root.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', () => startSession(b.dataset.start, today)));
  bindPastForm(root, 'past-latihan', refresh);
}
