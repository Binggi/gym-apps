// Aksi yang dipakai beberapa halaman.
import { put, state } from './db.js';
import { newWorkout } from './logic.js';

export const go = (path) => { location.hash = '#' + path; };

/** Render ulang halaman ini lewat router: cleanup render lama jalan dan grafik digambar ulang. */
export const refresh = () => window.dispatchEvent(new HashChangeEvent('hashchange'));

/** Mulai sesi; kalau sesi yang sama di tanggal itu belum selesai, lanjutkan saja. */
export async function startSession(routine, date) {
  const open = state.workouts
    .filter((w) => w.routine === routine && w.date === date && !w.finishedAt)
    .sort((a, b) => b.id - a.id)[0];
  const w = open ?? await put('workouts', newWorkout(state.workouts, routine, date));
  go(`/latihan/${w.id}`);
}

// Naikkan bersama CACHE di sw.js setiap kali file aplikasi berubah.
export const APP_VERSION = '1.1.0';

// Tombol "Pasang" memakai event beforeinstallprompt dari Chrome (ditangkap di app.js).
let deferredInstall = null;
export const installPrompt = () => deferredInstall;
export const setInstallPrompt = (p) => { deferredInstall = p; };

export const LAST_BACKUP_KEY = 'catatan-gym:last-backup';
export function lastBackup() {
  try { return localStorage.getItem(LAST_BACKUP_KEY); } catch { return null; }
}
