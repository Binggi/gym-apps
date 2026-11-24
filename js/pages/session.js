import { go } from '../actions.js';
import { CARDIO, REST_SECONDS } from '../data.js';
import { put, remove, state } from '../db.js';
import { cardioTarget, groupSets, programWeek, routineBySlug, suggestion } from '../logic.js';
import { dateDayMonth, esc, icon, num, photos, toast, val } from '../ui.js';

export function render(root, params, id) {
  const w = state.workouts.find((x) => x.id === Number(id));
  if (!w) {
    root.innerHTML = '<div class="page-head"><h1>Sesi tidak ditemukan</h1><p class="lead"><a href="#/latihan">← Kembali ke Latihan</a></p></div>';
    return;
  }
  const r = routineBySlug(w.routine);
  const finished = !!w.finishedAt;
  const cardio = cardioTarget(state.workouts, w.date);
  const groups = groupSets(w);

  const cards = groups.map((g, gi) => {
    const e = g.exercise;
    const s = suggestion(state.workouts, g.slug, w);
    const unit = e.timed ? 'detik' : e.perSide ? 'per sisi' : 'kali';
    const rows = g.sets.map((set) => `
      <div class="set-row ${e.weight ? '' : 'no-weight'} ${set.done ? 'is-done' : ''}" data-set="${g.slug}:${set.n}">
        <span class="sn">${set.n}</span>
        ${e.weight ? `<label><input name="weight" type="text" inputmode="decimal" autocomplete="off" value="${esc(set.weight == null ? '' : String(set.weight).replace('.', ','))}" placeholder="kg" aria-label="Beban set ${set.n} (kg)"><span class="unit">kg</span></label>` : ''}
        <label><input name="reps" type="number" inputmode="numeric" min="0" max="600" value="${val(set.reps)}" placeholder="${e.repMax}" aria-label="${e.timed ? 'Detik' : 'Repetisi'} set ${set.n}"><span class="unit">${unit}</span></label>
        <button type="button" class="donebtn" aria-pressed="${set.done}" aria-label="Tandai set ${set.n} selesai">${icon('check')}</button>
      </div>`).join('');
    const allDone = g.sets.every((x) => x.done);

    return `<article class="card ex" id="ex-${g.slug}">
      <div class="ex-head">
        <span class="n">${gi + 1}</span>
        <div><h3>${esc(e.name)}</h3><p class="sign"><b>${esc(e.machine)}</b> · ${esc(e.muscle)} · target ${e.repMin === e.repMax ? e.repMin : `${e.repMin}–${e.repMax}`}${e.timed ? ' detik' : ''}${e.perSide ? ' per sisi' : ''}</p></div>
        <span class="done-badge" ${allDone ? '' : 'hidden'} title="Semua set selesai">${icon('check')}</span>
      </div>
      ${photos(e, gi === 0)}
      <div class="hint-box ${s.type === 'up' ? 'up' : ''}">
        <span>${s.type === 'up' ? '<b>Naik!</b> ' : ''}${esc(s.text)}</span>
        ${s.last ? `<span class="last">Sesi lalu: ${esc(s.last)}</span>` : ''}
      </div>
      <div class="sets">
        <div class="set-head ${e.weight ? '' : 'no-weight'}" aria-hidden="true"><span>Set</span>${e.weight ? '<span>Beban</span>' : ''}<span>${e.timed ? 'Detik' : 'Rep'}</span><span>Selesai</span></div>
        ${rows}
      </div>
      <div class="set-tools">
        <span class="save-state" aria-live="polite"></span>
        <div class="btn-row">
          ${g.sets.length > 1 ? `<button class="btn ghost small" type="button" data-del-set="${g.slug}">Hapus set</button>` : ''}
          <button class="btn ghost small" type="button" data-add-set="${g.slug}">${icon('plus')}Set</button>
        </div>
      </div>
      <details class="howto">
        <summary>Cara melakukan</summary>
        <ol>${e.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
        <p><b>Hindari:</b> ${esc(e.avoid)}</p>
        <p><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(`cara ${e.q} pemula`)}" target="_blank" rel="noopener">Cari video di YouTube</a> · <a href="#/gerakan/${g.slug}">Progres</a></p>
      </details>
    </article>`;
  }).join('');

  root.innerHTML = `
    <div class="page-head">
      <a class="muted small" href="#/latihan">← Latihan</a>
      <h1>${esc(r.name)} · ${esc(dateDayMonth(w.date))}</h1>
      <p class="lead">${esc(r.focus)} · minggu ke-${programWeek(state.workouts, w.date)}</p>
    </div>
    ${finished ? `<div class="note good">${icon('check')}<div><b>Sesi selesai</b> Kamu masih bisa mengubah angka di bawah; perubahan tersimpan otomatis.</div></div>` : ''}
    <details class="card howto">
      <summary>Pemanasan 8–10 menit</summary>
      <ol>
        <li>Jalan santai di treadmill 5 menit, tanpa tanjakan.</li>
        <li>Putar bahu, buka-tutup tangan, jongkok tanpa beban, bungkuk dari pinggul · masing-masing 10 kali.</li>
        <li>Sebelum alat pertama: 1 set 10 kali dengan sekitar setengah beban biasanya.</li>
      </ol>
    </details>
    <div class="grid-2">
      ${cards}
      <form class="card" id="cardio-form">
        <div class="ex-head">
          <span class="n">${groups.length + 1}</span>
          <div><h3>Jalan di Treadmill</h3>
            <p class="sign">Target ${cardio.min}–${cardio.max} menit · ±${num(CARDIO.speed, 1)} km/jam · tanjakan ${CARDIO.incline} · masih bisa bicara</p></div>
        </div>
        <div class="form-grid">
          <div class="field full"><label for="cardioMinutes">Menit</label>
            <input id="cardioMinutes" name="cardioMinutes" type="number" inputmode="numeric" min="0" max="300" value="${val(w.cardioMinutes)}" placeholder="${cardio.min}"></div>
          <div class="field"><label for="cardioSpeed">Kecepatan (km/jam)</label>
            <input id="cardioSpeed" name="cardioSpeed" type="number" inputmode="decimal" step="0.1" min="0" max="25" value="${val(w.cardioSpeed)}"></div>
          <div class="field"><label for="cardioIncline">Tanjakan</label>
            <input id="cardioIncline" name="cardioIncline" type="number" inputmode="decimal" step="0.5" min="0" max="15" value="${val(w.cardioIncline)}" placeholder="3–6"></div>
          <div class="field full"><label for="notes">Catatan <span class="hint">pegal, alat penuh, rasa badan…</span></label>
            <textarea id="notes" name="notes">${esc(w.notes)}</textarea></div>
        </div>
        <span class="save-state" aria-live="polite"></span>
        <p class="muted small">Pendinginan: jalan santai 2–3 menit, lalu peregangan dada, punggung, paha depan, paha belakang · 30 detik.</p>
        ${finished ? '' : `<button class="btn primary block" type="submit">${icon('check')}Selesaikan sesi</button>`}
      </form>
    </div>
    <div class="btn-row" style="justify-content:space-between">
      ${finished ? '<button class="btn small" type="button" data-reopen>Tandai belum selesai</button>' : '<span></span>'}
      <button class="btn ghost small danger" type="button" data-delete>${icon('trash')}Hapus sesi</button>
    </div>`;

  /* ---- Simpan ---- */
  let saveTimer;
  const save = (stateEl) => {
    clearTimeout(saveTimer);
    if (stateEl) stateEl.textContent = '…';
    saveTimer = setTimeout(async () => {
      try { await put('workouts', w); if (stateEl) stateEl.textContent = 'Tersimpan'; }
      catch { if (stateEl) stateEl.textContent = 'Gagal menyimpan'; toast('Gagal menyimpan. Memori HP mungkin penuh.', 'critical'); }
    }, 400);
  };
  const findSet = (key) => { const [slug, n] = key.split(':'); return w.sets.find((s) => s.exercise === slug && s.n === Number(n)); };

  root.querySelectorAll('[data-set]').forEach((row) => {
    const set = findSet(row.dataset.set);
    const card = row.closest('.ex');
    const st = card.querySelector('.save-state');
    const weight = row.querySelector('[name=weight]');
    const reps = row.querySelector('[name=reps]');
    const btn = row.querySelector('.donebtn');

    weight?.addEventListener('input', () => {
      const v = weight.value.trim().replace(',', '.');
      set.weight = v === '' || Number.isNaN(Number(v)) ? null : Number(v);
      save(st);
    });
    reps.addEventListener('input', () => { set.reps = reps.value === '' ? null : Math.max(0, Math.round(Number(reps.value))); save(st); });
    btn.addEventListener('click', () => {
      set.done = !set.done;
      if (set.done && set.reps == null) { set.reps = Number(reps.placeholder); reps.value = reps.placeholder; }
      btn.setAttribute('aria-pressed', String(set.done));
      row.classList.toggle('is-done', set.done);
      card.querySelector('.done-badge').hidden = !w.sets.filter((s) => s.exercise === set.exercise).every((s) => s.done);
      save(st);
      if (set.done) restTimer.start();
    });
  });

  // Render ulang lewat router supaya cleanup (wake lock, listener) dari render sebelumnya ikut jalan
  const rerender = () => window.dispatchEvent(new HashChangeEvent('hashchange'));
  const rerenderAt = async (slug) => {
    await put('workouts', w);
    rerender();
    root.querySelector(`#ex-${slug}`)?.scrollIntoView({ block: 'start' });
  };
  root.querySelectorAll('[data-add-set]').forEach((b) => b.addEventListener('click', () => {
    const slug = b.dataset.addSet;
    const sets = w.sets.filter((s) => s.exercise === slug);
    const last = sets[sets.length - 1];
    w.sets.push({ exercise: slug, n: (last?.n ?? 0) + 1, weight: last?.weight ?? null, reps: null, done: false });
    rerenderAt(slug);
  }));
  root.querySelectorAll('[data-del-set]').forEach((b) => b.addEventListener('click', () => {
    const slug = b.dataset.delSet;
    const maxN = Math.max(...w.sets.filter((s) => s.exercise === slug).map((s) => s.n));
    w.sets = w.sets.filter((s) => !(s.exercise === slug && s.n === maxN));
    rerenderAt(slug);
  }));

  const form = root.querySelector('#cardio-form');
  const readCardio = () => {
    const f = new FormData(form);
    const n = (k) => { const v = String(f.get(k) ?? '').replace(',', '.'); return v === '' || Number.isNaN(Number(v)) ? null : Number(v); };
    w.cardioMinutes = n('cardioMinutes');
    w.cardioSpeed = n('cardioSpeed');
    w.cardioIncline = n('cardioIncline');
    w.notes = String(f.get('notes') ?? '');
  };
  form.addEventListener('input', () => { readCardio(); save(form.querySelector('.save-state')); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    readCardio();
    w.finishedAt = new Date().toISOString();
    await put('workouts', w);
    const done = w.sets.filter((s) => s.done).length;
    toast(`Sesi ${r.name} selesai: ${done} dari ${w.sets.length} set. Mantap!`);
    go('/');
  });
  root.querySelector('[data-reopen]')?.addEventListener('click', async () => {
    w.finishedAt = null;
    await put('workouts', w);
    rerender();
  });
  root.querySelector('[data-delete]').addEventListener('click', async () => {
    if (!confirm('Hapus sesi ini beserta semua setnya?')) return;
    await remove('workouts', w.id);
    toast('Sesi dihapus.');
    go('/latihan');
  });

  // Layar tetap menyala selama halaman sesi terbuka
  let lock = null;
  const requestLock = async () => { try { lock = await navigator.wakeLock?.request('screen'); } catch { /* tidak didukung */ } };
  const onVis = () => { if (document.visibilityState === 'visible') requestLock(); };
  requestLock();
  document.addEventListener('visibilitychange', onVis);
  return () => {
    clearTimeout(saveTimer);
    put('workouts', w).catch(() => {});
    document.removeEventListener('visibilitychange', onVis);
    lock?.release?.().catch(() => {});
  };
}

/* ---- Timer istirahat (elemen #rest ada di index.html) ---- */
const restTimer = (() => {
  let end = 0, iv;
  const box = () => document.getElementById('rest');
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const stop = () => { clearInterval(iv); const b = box(); b.hidden = true; b.classList.remove('over'); };
  const tick = () => {
    const b = box();
    const left = Math.round((end - Date.now()) / 1000);
    if (left <= 0) {
      b.querySelector('.t').textContent = '0:00';
      b.querySelector('.lbl').textContent = 'Set berikutnya';
      if (!b.classList.contains('over')) { b.classList.add('over'); navigator.vibrate?.([200, 100, 200]); }
      if (left < -60) stop();
      return;
    }
    b.querySelector('.t').textContent = fmt(left);
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('#rest [data-add]')) { end = Math.max(end, Date.now()) + 30000; box().classList.remove('over'); box().querySelector('.lbl').textContent = 'Istirahat'; tick(); }
    if (e.target.closest('#rest [data-stop]')) stop();
  });
  return {
    start() {
      const b = box();
      end = Date.now() + REST_SECONDS * 1000;
      b.hidden = false; b.classList.remove('over'); b.querySelector('.lbl').textContent = 'Istirahat';
      clearInterval(iv); tick(); iv = setInterval(tick, 250);
    },
  };
})();
