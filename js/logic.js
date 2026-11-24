// Aturan program, tanpa DOM supaya bisa dites di Node (tests/logic.test.mjs).
// Tanggal disimpan sebagai string lokal 'YYYY-MM-DD'.
import { CARDIO, EXERCISES, MEALS, ROUTINES, TARGETS } from './data.js';

/* ---------- Tanggal ---------- */
export const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const todayISO = () => toISO(new Date());
export const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
export const diffDays = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000); // b - a
export const dow = (iso) => parseISO(iso).getDay();
/** Senin di minggu yang sama */
export const weekStart = (iso) => addDays(iso, -((dow(iso) + 6) % 7));

/* ---------- Sesi ---------- */
export const routineBySlug = (slug) => ROUTINES.find((r) => r.slug === slug);
export const ROUTINES_BY_DOW = Object.fromEntries(ROUTINES.map((r) => [r.dow, r]));
const byNewest = (a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1);
export const isStarted = (w) => !!w.finishedAt || w.sets.some((s) => s.done);

/** Urutan tetap Dorong → Tarik → Kaki. Bolos: lanjut ke sesi berikutnya. */
export function nextRoutine(workouts) {
  const last = [...workouts].filter(isStarted).sort(byNewest)[0];
  if (!last) return ROUTINES[0];
  const i = ROUTINES.findIndex((r) => r.slug === last.routine);
  return ROUTINES[(i + 1) % ROUTINES.length];
}

export const isGymDay = (iso) => ROUTINES.some((r) => r.dow === dow(iso));

/** Hari gym terakhir sebelum `iso` (tidak termasuk hari itu sendiri). */
export function lastGymDayBefore(iso) {
  for (let i = 1; i <= 7; i++) {
    const d = addDays(iso, -i);
    if (isGymDay(d)) return d;
  }
  return null;
}

/** Sesi yang dijadwalkan pada tanggal itu (Senin Dorong, Rabu Tarik, Jumat Kaki), atau null. */
export const routineForDate = (iso) => ROUTINES.find((r) => r.dow === dow(iso)) ?? null;

/**
 * Sesi yang sudah dikerjakan tapi dicatat tanpa detail beban (misalnya sebelum pakai aplikasi).
 * Tetap dihitung untuk urutan sesi dan minggu program; detail bisa diisi belakangan.
 */
export function quickWorkout(routineSlug, date, id = Date.now()) {
  return { id, routine: routineBySlug(routineSlug).slug, date, finishedAt: `${date}T12:00:00.000Z`, quick: true,
    cardioMinutes: null, cardioSpeed: null, cardioIncline: null, notes: '', sets: [] };
}

/** Isi set kosong untuk sesi cepat supaya beban bisa dilengkapi. */
export function fillQuickWorkout(workouts, w) {
  const filled = newWorkout(workouts.filter((x) => x.id !== w.id), w.routine, w.date, w.id);
  return { ...w, quick: false, sets: filled.sets, cardioSpeed: w.cardioSpeed ?? filled.cardioSpeed };
}

/** Hari gym berikutnya setelah `iso` (tidak termasuk hari itu sendiri). */
export function nextGymDay(iso) {
  for (let i = 1; i <= 7; i++) {
    const d = addDays(iso, i);
    if (isGymDay(d)) return d;
  }
  return null;
}

export function programWeek(workouts, on = todayISO()) {
  if (!workouts.length) return 1;
  const first = workouts.reduce((m, w) => (w.date < m ? w.date : m), workouts[0].date);
  return Math.floor(Math.max(0, diffDays(first, on)) / 7) + 1;
}

export function cardioTarget(workouts, on = todayISO()) {
  return programWeek(workouts, on) >= CARDIO.laterFromWeek ? CARDIO.later : CARDIO.early;
}

/** Set selesai dari sesi terakhir (selain `exclude`) untuk gerakan ini. */
export function lastSets(workouts, slug, exclude = null) {
  const w = [...workouts]
    .filter((x) => !exclude || (x.id !== exclude.id && x.date <= exclude.date))
    .filter((x) => x.sets.some((s) => s.exercise === slug && s.done))
    .sort(byNewest)[0];
  if (!w) return { workout: null, sets: [] };
  return { workout: w, sets: w.sets.filter((s) => s.exercise === slug && s.done).sort((a, b) => a.n - b.n) };
}

export function fmtKg(v) {
  if (v === null || v === undefined || v === '') return '–';
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(v)} kg`;
}

const shortDate = (iso) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(parseISO(iso));

/** Saran sesi ini dari sesi sebelumnya: 'first' | 'up' | 'hold'. */
export function suggestion(workouts, slug, current = null) {
  const e = EXERCISES[slug];
  const { workout, sets } = lastSets(workouts, slug, current);

  if (!sets.length) {
    return {
      type: 'first',
      text: e.weight
        ? 'Pertama kali: pilih beban yang masih sanggup 3 kali lagi.'
        : 'Pertama kali: fokus gerakan rapi.',
      last: null,
      weight: null,
    };
  }

  const unit = e.timed ? ' dtk' : '';
  const reps = sets.map((s) => (s.reps == null ? '–' : s.reps + unit)).join(', ');
  const weight = e.weight ? Math.max(...sets.map((s) => s.weight ?? 0)) || null : null;
  const last = `${weight ? fmtKg(weight) + ' × ' : ''}${reps} (${shortDate(workout.date)})`;
  const hitTop = sets.length >= 3 && sets.every((s) => (s.reps ?? 0) >= e.repMax);

  if (hitTop) {
    const text = e.timed
      ? 'Tambah 5–10 detik per set.'
      : !e.weight
        ? 'Tambah 1–2 repetisi.'
        : 'Naikkan sedikit bebannya.';
    return { type: 'up', text, last, weight };
  }

  return {
    type: 'hold',
    text: e.weight
      ? `Tetap ${fmtKg(weight)}, kejar ${e.repMax} kali.`
      : `Kejar ${e.repMax}${e.timed ? ' detik' : ' kali'}.`,
    last,
    weight,
  };
}

/** Sesi baru dengan set kosong; beban diisi dari sesi sebelumnya. */
export function newWorkout(workouts, routineSlug, date, id = Date.now()) {
  const r = routineBySlug(routineSlug);
  const w = { id, routine: r.slug, date, finishedAt: null, cardioMinutes: null, cardioSpeed: CARDIO.speed, cardioIncline: null, notes: '', sets: [] };
  for (const slug of r.list) {
    const prev = lastSets(workouts, slug, w).sets;
    for (let n = 1; n <= r.sets; n++) {
      const p = prev[n - 1] ?? prev[prev.length - 1];
      w.sets.push({ exercise: slug, n, weight: EXERCISES[slug].weight ? (p?.weight ?? null) : null, reps: null, done: false });
    }
  }
  return w;
}

/** Total beban × repetisi dari set selesai (tanpa gerakan tahan). */
export const volume = (w) => w.sets
  .filter((s) => s.done && s.weight && s.reps && !EXERCISES[s.exercise]?.timed)
  .reduce((t, s) => t + s.weight * s.reps, 0);

/** Kelompokkan set per gerakan, urut sesuai program. */
export function groupSets(w) {
  const order = routineBySlug(w.routine)?.list ?? [];
  const rank = (slug) => { const i = order.indexOf(slug); return i < 0 ? 99 : i; };
  const map = new Map();
  for (const s of w.sets) {
    if (!map.has(s.exercise)) map.set(s.exercise, []);
    map.get(s.exercise).push(s);
  }
  return [...map.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([slug, sets]) => ({ slug, exercise: EXERCISES[slug], sets: sets.sort((a, b) => a.n - b.n) }));
}

/* ---------- Makan ---------- */
export const mealProtein = (log) => (log?.meals ?? []).reduce((t, k) => t + (MEALS[k]?.protein ?? 0), 0) + Number(log?.extraProtein || 0);
export const mealKcal = (log) => (log?.meals ?? []).reduce((t, k) => t + (MEALS[k]?.kcal ?? 0), 0) + Number(log?.extraKcal || 0);

/* ---------- Tren berat ----------
 * Laju (kg/minggu) dari garis tren timbangan 21 hari terakhir, dibandingkan aturan program:
 * target turun 0,25–0,5; > 0,75 → tambah 150–200 kkal; tidak turun 2–3 minggu → kurangi 150–200 kkal;
 * > 1 kg/minggu selama 2 minggu → periksa ke dokter.
 */
export function weightTrend(entries) {
  const pts = entries.filter((m) => m.weight != null).sort((a, b) => (a.date < b.date ? -1 : 1));
  const latest = pts[pts.length - 1];
  const res = (status, tone, title, text, rate, span, avg7) => ({ status, tone, title, text, rate, span, avg7 });

  const avg = (arr) => arr.reduce((t, m) => t + m.weight, 0) / arr.length;
  const avg7 = latest ? Math.round(avg(pts.filter((m) => diffDays(m.date, latest.date) < 7)) * 10) / 10 : null;
  const win = latest ? pts.filter((m) => diffDays(m.date, latest.date) <= 21) : [];
  const span = win.length > 1 ? diffDays(win[0].date, win[win.length - 1].date) : 0;

  if (win.length < 3 || span < 6) {
    return res('insufficient', 'neutral', 'Belum cukup data',
      'Timbang 2–3× seminggu. Tren muncul setelah ±1 minggu.', null, span, avg7);
  }

  const xs = win.map((m) => diffDays(win[0].date, m.date));
  const ys = win.map((m) => m.weight);
  const mx = xs.reduce((a, b) => a + b) / xs.length;
  const my = ys.reduce((a, b) => a + b) / ys.length;
  let num = 0, den = 0;
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
  const rate = Math.round((den ? num / den : 0) * 7 * 100) / 100; // negatif = turun
  const loss = -rate;
  const t = TARGETS;

  if (loss > t.lossRateDoctor && span >= 13) return res('doctor', 'critical', 'Turun terlalu cepat',
    'Lebih dari 1 kg/minggu selama 2 minggu. Kalau makan sudah cukup, periksa ke dokter.', rate, span, avg7);
  if (loss > t.lossRateTooFast) return res('too_fast', 'warning', 'Turun terlalu cepat',
    'Tambah 150–200 kkal/hari. Jangan tambah cardio.', rate, span, avg7);
  if (loss > t.lossRateMax) return res('bit_fast', 'warning', 'Sedikit di atas target',
    'Target 0,25–0,5 kg/minggu. Jangan lewatkan camilan.', rate, span, avg7);
  if (loss >= t.lossRateMin) return res('on_target', 'good', 'Sesuai target',
    'Pertahankan.', rate, span, avg7);
  if (span >= 14 && loss < 0.1) return res('stalled', 'warning', 'Belum turun',
    'Kurangi 150–200 kkal/hari.', rate, span, avg7);
  return res('slow', 'neutral', 'Turun pelan',
    'Tunggu 2–3 minggu sebelum ubah porsi.', rate, span, avg7);
}

/* ---------- Cadangan ---------- */
export const BACKUP_APP = 'catatan-gym';
export const BACKUP_VERSION = 1;

/** Validasi isi file cadangan sebelum menimpa data. Melempar Error dengan pesan yang bisa dibaca. */
export function validateBackup(data) {
  if (!data || data.app !== BACKUP_APP) throw new Error('File ini bukan cadangan Catatan Gym.');
  if (data.version > BACKUP_VERSION) throw new Error('Cadangan dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi dulu.');
  for (const k of ['workouts', 'body', 'daily']) {
    if (!Array.isArray(data[k])) throw new Error(`Bagian "${k}" di file cadangan rusak.`);
  }
  const isoOk = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (!data.workouts.every((w) => Number.isFinite(w.id) && isoOk(w.date) && routineBySlug(w.routine) && Array.isArray(w.sets))) {
    throw new Error('Ada catatan latihan yang rusak di file cadangan.');
  }
  if (![...data.body, ...data.daily].every((x) => isoOk(x.date))) throw new Error('Ada tanggal yang rusak di file cadangan.');
  return data;
}
