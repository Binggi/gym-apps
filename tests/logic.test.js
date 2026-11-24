import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { EXERCISES, ROUTINES } from '../js/data.js';
import {
  addDays, fillQuickWorkout, groupSets, lastGymDayBefore, mealKcal, mealProtein, newWorkout, nextGymDay,
  nextRoutine, programWeek, quickWorkout, routineForDate,
  suggestion, validateBackup, weekStart, weightTrend, cardioTarget,
} from '../js/logic.js';

const finish = (w, slug, weight, reps) => {
  for (const s of w.sets.filter((x) => x.exercise === slug)) Object.assign(s, { weight, reps, done: true });
  w.finishedAt = '2026-01-01T00:00:00Z';
  return w;
};

test('sesi baru berisi 3 set per gerakan sesuai program', () => {
  const w = newWorkout([], 'dorong', '2026-11-23', 1);
  assert.equal(w.sets.length, 6 * 3);
  assert.deepEqual(groupSets(w).map((g) => g.slug), ROUTINES[0].list);
});

test('urutan tetap Dorong → Tarik → Kaki → Dorong, dan sesi kosong tidak dihitung', () => {
  const ws = [];
  assert.equal(nextRoutine(ws).slug, 'dorong');
  ws.push(finish(newWorkout(ws, 'dorong', '2026-11-16', 1), 'chestpress', 30, 12));
  assert.equal(nextRoutine(ws).slug, 'tarik');
  ws.push(newWorkout(ws, 'tarik', '2026-11-18', 2)); // dibuka tapi tidak dikerjakan
  assert.equal(nextRoutine(ws).slug, 'tarik');
  ws.push(finish(newWorkout(ws, 'kaki', '2026-11-20', 3), 'legpress', 60, 12));
  assert.equal(nextRoutine(ws).slug, 'dorong');
});

test('saran naik beban kalau semua set sampai batas atas, dan beban terbawa ke sesi baru', () => {
  const ws = [finish(newWorkout([], 'dorong', '2026-11-16', 1), 'chestpress', 30, 12)];
  const s = suggestion(ws, 'chestpress');
  assert.equal(s.type, 'up');
  assert.equal(s.weight, 30);
  const w2 = newWorkout(ws, 'dorong', '2026-11-23', 2);
  assert.equal(w2.sets.find((x) => x.exercise === 'chestpress').weight, 30);
  // sesi saat ini tidak dihitung sebagai "sesi lalu"
  assert.equal(suggestion([...ws, w2], 'chestpress', w2).type, 'up');
});

test('saran pertahankan beban kalau repetisi belum sampai batas atas', () => {
  const ws = [finish(newWorkout([], 'dorong', '2026-11-16', 1), 'chestpress', 30, 10)];
  assert.equal(suggestion(ws, 'chestpress').type, 'hold');
  assert.equal(suggestion([], 'chestpress').type, 'first');
});

test('gerakan tahan (plank) memakai detik', () => {
  const ws = [finish(newWorkout([], 'dorong', '2026-11-16', 1), 'plank', null, 30)];
  const s = suggestion(ws, 'plank');
  assert.equal(s.type, 'up');
  assert.match(s.text, /detik/);
});

test('tren berat: turun ±1,5 kg/minggu selama 2 minggu → saran ke dokter', () => {
  const body = [[0, 80], [3, 79.4], [7, 78.6], [10, 78], [14, 77]].map(([d, kg]) => ({ date: addDays('2026-11-01', d), weight: kg }));
  const r = weightTrend(body);
  assert.equal(r.status, 'doctor');
  assert.ok(r.rate < -1);
});

test('tren berat: turun ±0,35 kg/minggu → sesuai target', () => {
  const body = [[0, 77], [4, 76.8], [8, 76.6], [12, 76.4]].map(([d, kg]) => ({ date: addDays('2026-11-01', d), weight: kg }));
  assert.equal(weightTrend(body).status, 'on_target');
});

test('tren berat: data kurang dari seminggu → belum cukup data', () => {
  assert.equal(weightTrend([{ date: '2026-11-01', weight: 77 }, { date: '2026-11-03', weight: 76.8 }]).status, 'insufficient');
});

test('protein & kalori harian dari menu + tambahan', () => {
  const log = { meals: ['sarapan', 'siang', 'malam'], extraProtein: 10, extraKcal: 100 };
  assert.equal(mealProtein(log), 26 + 61 + 47 + 10);
  assert.equal(mealKcal(log), 550 + 750 + 675 + 100);
  assert.equal(mealProtein({ meals: ['bukan-menu'] }), 0);
});

test('minggu program & target treadmill naik mulai minggu 5', () => {
  const ws = [newWorkout([], 'dorong', '2026-11-02', 1)];
  assert.equal(programWeek(ws, '2026-11-02'), 1);
  assert.equal(programWeek(ws, '2026-11-30'), 5);
  assert.deepEqual(cardioTarget(ws, '2026-11-23'), { min: 15, max: 20 });
  assert.deepEqual(cardioTarget(ws, '2026-11-30'), { min: 25, max: 30 });
});

test('sesi lama tanpa detail menggeser urutan & minggu program, lalu bisa dilengkapi', () => {
  const ws = [quickWorkout('dorong', '2026-11-02', 1), quickWorkout('tarik', '2026-11-04', 2)];
  assert.equal(nextRoutine(ws).slug, 'kaki');
  assert.equal(programWeek(ws, '2026-11-24'), 4);
  assert.equal(suggestion(ws, 'chestpress').type, 'first'); // tanpa beban → belum ada saran
  const full = fillQuickWorkout(ws, ws[0]);
  assert.equal(full.quick, false);
  assert.equal(full.sets.length, 18);
  assert.ok(full.finishedAt);
  assert.doesNotThrow(() => validateBackup({ app: 'catatan-gym', version: 1, workouts: ws, body: [], daily: [] }));
});

test('tanggal & sesi bawaan untuk mencatat sesi lama', () => {
  assert.equal(lastGymDayBefore('2026-11-24'), '2026-11-23'); // Selasa → Senin
  assert.equal(lastGymDayBefore('2026-11-23'), '2026-11-20'); // Senin → Jumat
  assert.equal(routineForDate('2026-11-23').slug, 'dorong');
  assert.equal(routineForDate('2026-11-25').slug, 'tarik');
  assert.equal(routineForDate('2026-11-24'), null);
});

test('hari gym berikutnya dari hari istirahat', () => {
  assert.equal(nextGymDay('2026-11-24'), '2026-11-25'); // Selasa → Rabu
  assert.equal(nextGymDay('2026-11-27'), '2026-11-30'); // Jumat → Senin
  assert.equal(nextGymDay('2026-11-28'), '2026-11-30'); // Sabtu → Senin
});

test('awal minggu adalah Senin', () => {
  assert.equal(weekStart('2026-11-24'), '2026-11-23'); // Selasa → Senin
  assert.equal(weekStart('2026-11-29'), '2026-11-23'); // Minggu → Senin sebelumnya
});

test('file cadangan divalidasi sebelum menimpa data', () => {
  const ok = { app: 'catatan-gym', version: 1, workouts: [newWorkout([], 'kaki', '2026-11-20', 5)], body: [{ date: '2026-11-20', weight: 77 }], daily: [] };
  assert.doesNotThrow(() => validateBackup(ok));
  assert.throws(() => validateBackup({ app: 'lain' }), /bukan cadangan/);
  assert.throws(() => validateBackup({ ...ok, version: 99 }), /lebih baru/);
  assert.throws(() => validateBackup({ ...ok, body: [{ date: 'kemarin' }] }), /tanggal/);
  assert.throws(() => validateBackup({ ...ok, workouts: [{ id: 1, date: '2026-11-20', routine: 'renang', sets: [] }] }), /rusak/);
});

test('setiap gerakan punya 2 foto, dan semua file aplikasi ada di daftar offline', async () => {
  for (const slug of Object.keys(EXERCISES)) {
    for (const n of [0, 1]) assert.ok(existsSync(new URL(`../img/exercises/${slug}-${n}.jpg`, import.meta.url)), `${slug}-${n}.jpg`);
  }
  const { readFileSync, readdirSync } = await import('node:fs');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const jsFiles = [
    ...readdirSync(new URL('../js/', import.meta.url)).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`),
    ...readdirSync(new URL('../js/pages/', import.meta.url)).map((f) => `js/pages/${f}`),
  ];
  for (const f of jsFiles) assert.ok(sw.includes(`'${f}'`), `${f} belum ada di SHELL sw.js`);
});
