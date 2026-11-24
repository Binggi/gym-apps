// Formulir "catat sesi yang sudah lewat": dipakai di Beranda (saat belum ada catatan) dan di Latihan.
import { go } from './actions.js';
import { ROUTINES } from './data.js';
import { put, state } from './db.js';
import { lastGymDayBefore, newWorkout, quickWorkout, routineBySlug, routineForDate, todayISO } from './logic.js';
import { dateDayMonth, esc, icon, toast } from './ui.js';

export function pastForm(id) {
  const today = todayISO();
  const date = lastGymDayBefore(today);
  const def = routineForDate(date) ?? ROUTINES[0];
  return `<form class="past-form" id="${id}">
      <div class="form-grid">
        <div class="field"><label for="${id}-date">Tanggal</label>
          <input id="${id}-date" type="date" name="date" max="${today}" value="${date}" required></div>
        <div class="field"><label for="${id}-routine">Sesi</label>
          <select id="${id}-routine" name="routine">${ROUTINES.map((r) => `<option value="${r.slug}" ${r.slug === def.slug ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></div>
      </div>
      <div class="btn-row">
        <button class="btn dark" type="submit" name="mode" value="quick">${icon('check')}Sudah dikerjakan</button>
        <button class="btn" type="submit" name="mode" value="detail">Isi beban</button>
      </div>
    </form>`;
}

/** @param {() => void} onSaved dipanggil setelah sesi cepat tersimpan (untuk render ulang). */
export function bindPastForm(root, id, onSaved) {
  const form = root.querySelector(`#${id}`);
  if (!form) return;
  const dateIn = form.querySelector('[name=date]');
  const sel = form.querySelector('[name=routine]');

  // Ikuti jadwal: Senin Dorong, Rabu Tarik, Jumat Kaki
  dateIn.addEventListener('change', () => {
    const r = /^\d{4}-\d{2}-\d{2}$/.test(dateIn.value) ? routineForDate(dateIn.value) : null;
    if (r) sel.value = r.slug;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = dateIn.value;
    const routine = sel.value;
    const mode = e.submitter?.value ?? 'quick';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayISO()) { toast('Pilih tanggal hari ini atau sebelumnya.', 'critical'); return; }

    const name = routineBySlug(routine).name;
    if (state.workouts.some((w) => w.date === date && w.routine === routine)) {
      toast(`Sesi ${name} tanggal itu sudah tercatat.`, 'neutral');
      return;
    }
    if (mode === 'detail') {
      const w = await put('workouts', { ...newWorkout(state.workouts, routine, date), finishedAt: `${date}T12:00:00.000Z` });
      go(`/latihan/${w.id}`);
      return;
    }
    await put('workouts', quickWorkout(routine, date));
    toast(`Sesi ${name} · ${dateDayMonth(date)} dicatat.`);
    onSaved();
  });
}
