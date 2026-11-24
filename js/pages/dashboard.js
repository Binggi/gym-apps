import { startSession, lastBackup } from '../actions.js';
import { MEALS, TARGETS, DAY_NAMES } from '../data.js';
import { state } from '../db.js';
import {
  addDays, diffDays, dow, isGymDay, mealKcal, mealProtein, nextRoutine, programWeek,
  routineBySlug, todayISO, weekStart, weightTrend, fmtKg, ROUTINES_BY_DOW,
} from '../logic.js';
import { chart, dateShort, esc, icon, num, trendNote } from '../ui.js';

export function render(root) {
  const today = todayISO();
  const ws = weekStart(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const weekWorkouts = state.workouts.filter((w) => w.date >= days[0] && w.date <= days[6]);
  const weekDone = weekWorkouts.filter((w) => w.finishedAt).length;

  const week = days.map((d) => {
    const plan = ROUTINES_BY_DOW[dow(d)];
    const done = weekWorkouts.filter((w) => w.date === d && (w.finishedAt || w.sets.some((s) => s.done)))[0];
    return `<li class="${plan ? 'lift' : ''} ${done ? 'done' : ''} ${d === today ? 'today' : ''}">
      <b>${DAY_NAMES[dow(d)].slice(0, 3)}</b><span>${esc(done ? routineBySlug(done.routine).name : plan?.name ?? 'Libur')}</span>
      <span class="check">${done ? icon('check') : ''}</span></li>`;
  }).join('');

  const next = nextRoutine(state.workouts);
  const gym = isGymDay(today);
  const todayWorkout = state.workouts.filter((w) => w.date === today).sort((a, b) => b.id - a.id)[0];

  let session;
  if (todayWorkout) {
    const r = routineBySlug(todayWorkout.routine);
    const fin = !!todayWorkout.finishedAt;
    session = `<div class="card-head"><h2>Sesi ${esc(r.name)}</h2><span class="tag ${fin ? 'muted' : ''}">${fin ? 'Selesai' : 'Sedang jalan'}</span></div>
      <p class="muted">${esc(r.focus)}</p>
      <a class="btn ${fin ? '' : 'primary'} block" href="#/latihan/${todayWorkout.id}">${icon(fin ? 'chart' : 'play')}${fin ? 'Lihat catatan sesi' : 'Lanjutkan sesi'}</a>`;
  } else {
    session = `<div class="card-head"><h2>${gym ? `Hari ini: ${esc(next.name)}` : 'Hari ini libur'}</h2>${gym ? '' : '<span class="tag muted">Istirahat</span>'}</div>
      <p class="muted">${gym
        ? `${esc(next.focus)}. Total sekitar 70–80 menit dari pemanasan sampai pendinginan.`
        : `Aktivitas biasa saja, tidak perlu cardio tambahan. Sesi berikutnya: <b>${esc(next.name)}</b> (${esc(next.focus)}).`}</p>
      <button class="btn ${gym ? 'primary' : ''} block" type="button" data-start="${next.slug}">${icon('play')}Mulai sesi ${esc(next.name)}${gym ? '' : ' sekarang'}</button>
      <p class="muted small">Urutan tetap Dorong → Tarik → Kaki. Kalau bolos, lanjut ke sesi berikutnya, jangan dobel.</p>`;
  }

  const log = state.daily.find((l) => l.date === today);
  const protein = log ? mealProtein(log) : null;
  const meter = (v, target) => `<span class="meter ${v >= target ? 'ok' : ''}"><i style="width:${Math.min(100, Math.round((v / target) * 100))}%"></i></span>`;

  const recent = state.body.filter((m) => diffDays(m.date, today) <= 60);
  const trend = weightTrend(recent);
  const latestW = [...state.body].filter((m) => m.weight != null).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const latestWaist = [...state.body].filter((m) => m.waist != null).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const needsWaist = !latestWaist || diffDays(latestWaist.date, today) > 14;
  const weightPts = recent.filter((m) => m.weight != null).sort((a, b) => (a.date < b.date ? -1 : 1)).map((m) => [m.date, m.weight]);

  const lb = lastBackup();
  const dataCount = state.workouts.length + state.body.length + state.daily.length;
  const backupDue = dataCount > 0 && (!lb || diffDays(lb.slice(0, 10), today) > 14);

  root.innerHTML = `
    <div class="page-head">
      <h1>${DAY_NAMES[dow(today)]}, ${esc(new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long' }).format(new Date()))}</h1>
      <p class="lead">Minggu program ke-${programWeek(state.workouts)} · ${weekDone} dari 3 sesi beban minggu ini</p>
    </div>
    <ol class="week" aria-label="Minggu ini">${week}</ol>
    ${backupDue ? `<a class="note warning" href="#/cadangan">${icon('shield')}<div><b>Waktunya simpan cadangan</b> <span>Data hanya ada di HP ini. ${lb ? `Cadangan terakhir ${dateShort(lb.slice(0, 10))}.` : 'Belum pernah dicadangkan.'} Ketuk untuk menyimpan file cadangan.</span></div></a>` : ''}
    <div class="grid-2">
      <div class="stack">
        <section class="card">${session}</section>
        <section class="card">
          <div class="card-head"><h2>Catatan hari ini</h2><a href="#/harian">${log ? 'Ubah' : 'Isi sekarang'}</a></div>
          <div class="stats">
            <a class="stat" href="#/harian"><span class="label">Protein</span>
              <span class="value">${protein ?? '–'}<small> / ${TARGETS.proteinMin} g</small></span>${meter(protein ?? 0, TARGETS.proteinMin)}</a>
            <a class="stat" href="#/harian"><span class="label">Langkah</span>
              <span class="value">${num(log?.steps)}</span>${meter(log?.steps ?? 0, TARGETS.steps)}</a>
            <a class="stat" href="#/harian"><span class="label">Tidur</span>
              <span class="value">${num(log?.sleep, 1)}<small> jam</small></span><span class="sub">target ${TARGETS.sleepMin}–${TARGETS.sleepMax} jam</span></a>
            <a class="stat" href="#/harian"><span class="label">Makan</span>
              <span class="value">${log?.meals?.length ?? 0}<small> / ${Object.keys(MEALS).length}</small></span><span class="sub">±${num(log ? mealKcal(log) : 0)} kkal</span></a>
          </div>
        </section>
      </div>
      <div class="stack">
        <section class="card">
          <div class="card-head"><h2>Berat badan</h2><a href="#/badan">Timbang</a></div>
          <div class="stats">
            <div class="stat"><span class="label">Terakhir</span><span class="value">${latestW ? fmtKg(latestW.weight) : '–'}</span><span class="sub">${latestW ? dateShort(latestW.date) : 'belum ada'}</span></div>
            <div class="stat"><span class="label">Lingkar perut</span><span class="value">${num(latestWaist?.waist, 1)}<small> cm</small></span><span class="sub">${latestWaist ? dateShort(latestWaist.date) : 'belum ada'}</span></div>
          </div>
          ${trendNote(trend)}
          ${chart({ type: 'line', label: 'Berat', unit: 'kg', decimals: 1, points: weightPts, empty: 'Timbang minimal 2 kali untuk melihat grafik.' })}
          ${needsWaist ? '<p class="muted small">Lingkar perut diukur setinggi pusar tiap 2 minggu. Sudah waktunya mengukur lagi.</p>' : ''}
        </section>
      </div>
    </div>`;

  root.querySelector('[data-start]')?.addEventListener('click', (e) => startSession(e.currentTarget.dataset.start, today));
}
