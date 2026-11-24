import { lastBackup, refresh, startSession } from '../actions.js';
import { MEALS, TARGETS, DAY_NAMES } from '../data.js';
import { state } from '../db.js';
import {
  addDays, diffDays, dow, isGymDay, mealKcal, mealProtein, nextGymDay, nextRoutine, programWeek,
  routineBySlug, todayISO, weekStart, weightTrend, fmtKg, ROUTINES_BY_DOW,
} from '../logic.js';
import { bindPastForm, pastForm } from '../past.js';
import { chart, dateDayMonth, dateShort, esc, icon, num, trendNote } from '../ui.js';

export function render(root, params) {
  const today = todayISO();
  const ws = weekStart(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const weekWorkouts = state.workouts.filter((w) => w.date >= days[0] && w.date <= days[6]);
  const weekDone = weekWorkouts.filter((w) => w.finishedAt).length;

  const week = days.map((d) => {
    const plan = ROUTINES_BY_DOW[dow(d)];
    const done = weekWorkouts.find((w) => w.date === d && (w.finishedAt || w.sets.some((s) => s.done)));
    return `<li class="${plan ? 'lift' : ''} ${done ? 'done' : ''} ${d === today ? 'today' : ''}">
      <b>${DAY_NAMES[dow(d)].slice(0, 3)}</b><span>${esc(done ? routineBySlug(done.routine).name : plan?.name ?? 'Libur')}</span>
      <span class="check">${done ? icon('check') : ''}</span></li>`;
  }).join('');

  /* ---- Sesi hari ini ---- */
  const next = nextRoutine(state.workouts);
  const todayWorkout = state.workouts.filter((w) => w.date === today).sort((a, b) => b.id - a.id)[0];
  let session;
  if (todayWorkout) {
    const r = routineBySlug(todayWorkout.routine);
    const fin = !!todayWorkout.finishedAt;
    session = `<div class="card-head"><h2>Sesi ${esc(r.name)}</h2><span class="tag ${fin ? 'muted' : ''}">${fin ? 'Selesai' : 'Sedang jalan'}</span></div>
      <p class="muted">${esc(r.focus)}</p>
      <a class="btn ${fin ? '' : 'primary'} block" href="#/latihan/${todayWorkout.id}">${icon(fin ? 'chart' : 'play')}${fin ? 'Lihat catatan sesi' : 'Lanjutkan sesi'}</a>`;
  } else if (isGymDay(today)) {
    session = `<div class="card-head"><h2>Hari ini: ${esc(next.name)}</h2></div>
      <p class="muted">${esc(next.focus)} · ±75 menit</p>
      <button class="btn primary block" type="button" data-start="${next.slug}">${icon('play')}Mulai sesi ${esc(next.name)}</button>`;
  } else {
    // Hari istirahat: tunjukkan sesi berikutnya dan harinya, tanpa tombol besar yang mengajak latihan
    session = `<div class="card-head"><h2>Hari ini istirahat</h2><span class="tag muted">Libur</span></div>
      <p>Sesi berikutnya: <b>${esc(next.name)}</b> · ${esc(dateDayMonth(nextGymDay(today)))}</p>
      <p class="muted">Cukup jalan kaki, kejar ${num(TARGETS.steps)} langkah.</p>
      <button class="btn ghost small self-start" type="button" data-start="${next.slug}" data-confirm-rest>Tetap latihan hari ini ${icon('right')}</button>`;
  }

  /* ---- Belum ada catatan sama sekali: ajak catat sesi sebelum pakai aplikasi ---- */
  const onboarding = state.workouts.length ? '' : `
    <section class="card">
      <h2>Sudah latihan sebelumnya?</h2>
      <p class="muted">Catat sesi lama supaya urutan sesi benar.</p>
      ${pastForm('past-dash')}
    </section>`;

  /* ---- Catatan hari ini ---- */
  const log = state.daily.find((l) => l.date === today);
  const meter = (v, target) => `<span class="meter ${v >= target ? 'ok' : ''}"><i style="width:${Math.min(100, Math.round((v / target) * 100))}%"></i></span>`;
  const todayCard = log ? (() => {
    const protein = mealProtein(log);
    return `<div class="stats">
      <a class="stat" href="#/harian"><span class="label">Protein</span>
        <span class="value">${protein}<small> / ${TARGETS.proteinMin} g</small></span>${meter(protein, TARGETS.proteinMin)}</a>
      <a class="stat" href="#/harian"><span class="label">Langkah</span>
        <span class="value">${num(log.steps)}</span>${meter(log.steps ?? 0, TARGETS.steps)}</a>
      <a class="stat" href="#/harian"><span class="label">Tidur</span>
        <span class="value">${num(log.sleep, 1)}<small> jam</small></span><span class="sub">target ${TARGETS.sleepMin}–${TARGETS.sleepMax}</span></a>
      <a class="stat" href="#/harian"><span class="label">Makan</span>
        <span class="value">${log.meals?.length ?? 0}<small> / ${Object.keys(MEALS).length}</small></span><span class="sub">±${num(mealKcal(log))} kkal</span></a>
    </div>`;
  })() : `<a class="btn block" href="#/harian">${icon('calendar')}Isi catatan hari ini</a>`;

  /* ---- Berat badan ---- */
  const recent = state.body.filter((m) => diffDays(m.date, today) <= 60);
  const byNewest = (a, b) => (a.date < b.date ? 1 : -1);
  const latestW = state.body.filter((m) => m.weight != null).sort(byNewest)[0];
  const latestWaist = state.body.filter((m) => m.waist != null).sort(byNewest)[0];
  const needsWaist = !latestWaist || diffDays(latestWaist.date, today) > 14;
  const weightPts = recent.filter((m) => m.weight != null).sort((a, b) => -byNewest(a, b)).map((m) => [m.date, m.weight]);
  const weightCard = latestW || latestWaist ? `
      <div class="stats">
        <div class="stat"><span class="label">Terakhir</span><span class="value">${latestW ? fmtKg(latestW.weight) : '–'}</span><span class="sub">${latestW ? dateShort(latestW.date) : 'belum ada'}</span></div>
        <div class="stat"><span class="label">Perut</span><span class="value">${latestWaist ? `${num(latestWaist.waist, 1)}<small> cm</small>` : '–'}</span><span class="sub">${latestWaist ? dateShort(latestWaist.date) : 'belum diukur'}</span></div>
      </div>
      ${trendNote(weightTrend(recent))}
      ${weightPts.length >= 2 ? chart({ type: 'line', label: 'Berat', unit: 'kg', decimals: 1, points: weightPts }) : ''}
      ${needsWaist ? '<p class="muted small">Waktunya ukur lingkar perut.</p>' : ''}`
    : `<a class="btn block" href="#/badan">${icon('scale')}Catat berat badan</a>`;

  /* ---- Pengingat cadangan: hanya kalau data sudah ada ≥ 7 hari ---- */
  const lb = lastBackup();
  const allDates = [...state.workouts, ...state.body, ...state.daily].map((x) => x.date).sort();
  const oldest = allDates[0];
  const backupDue = oldest && diffDays(oldest, today) >= 7 && (!lb || diffDays(lb.slice(0, 10), today) > 14);

  root.innerHTML = `
    <div class="page-head">
      <h1>${DAY_NAMES[dow(today)]}, ${esc(new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long' }).format(new Date()))}</h1>
      <p class="lead">Minggu ke-${programWeek(state.workouts)} · ${weekDone}/3 sesi</p>
    </div>
    <ol class="week" aria-label="Minggu ini">${week}</ol>
    ${backupDue ? `<a class="note warning" href="#/cadangan">${icon('shield')}<div><b>Waktunya simpan cadangan</b> <span>Data hanya ada di HP ini.</span></div></a>` : ''}
    <div class="grid-2">
      <div class="stack">
        <section class="card">${session}</section>
        ${onboarding}
        <section class="card">
          <div class="card-head"><h2>Catatan hari ini</h2>${log ? `<a class="chip" href="#/harian">Ubah ${icon('right')}</a>` : ''}</div>
          ${todayCard}
        </section>
      </div>
      <div class="stack">
        <section class="card">
          <div class="card-head"><h2>Berat badan</h2>${latestW || latestWaist ? `<a class="chip" href="#/badan">Timbang ${icon('right')}</a>` : ''}</div>
          ${weightCard}
        </section>
      </div>
    </div>`;

  root.querySelector('[data-start]')?.addEventListener('click', (e) => {
    const b = e.currentTarget;
    if ('confirmRest' in b.dataset && !confirm(`Hari ini jadwal istirahat. Tetap mulai ${next.name}?`)) return;
    startSession(b.dataset.start, today);
  });
  bindPastForm(root, 'past-dash', refresh);
}
