import { APP_VERSION, LAST_BACKUP_KEY, installPrompt, lastBackup, refresh } from '../actions.js';
import { exportData, importData, state, storageInfo } from '../db.js';
import { todayISO } from '../logic.js';
import { dateShort, esc, icon, num, toast } from '../ui.js';

export function render(root) {
  const lb = lastBackup();
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;

  root.innerHTML = `
    <div class="note neutral">${icon('info')}<div>Data hanya ada di HP ini. Simpan cadangan tiap 2 minggu.</div></div>
    <div class="grid-2">
      <section class="card">
        <h2>Data di HP ini</h2>
        <div class="stats">
          <div class="stat"><span class="label">Sesi latihan</span><span class="value">${state.workouts.length}</span></div>
          <div class="stat"><span class="label">Catatan harian</span><span class="value">${state.daily.length}</span></div>
          <div class="stat"><span class="label">Catatan badan</span><span class="value">${state.body.length}</span></div>
          <div class="stat"><span class="label">Cadangan terakhir</span><span class="value small-value">${lb ? esc(dateShort(lb.slice(0, 10))) : 'Belum'}</span></div>
        </div>
        <p class="muted small" data-storage></p>
      </section>
      <section class="card">
        <h2>Simpan cadangan</h2>
        <p class="muted small">Simpan filenya ke Google Drive atau WhatsApp.</p>
        <button class="btn primary block" type="button" data-export>${icon('save')}Simpan file cadangan</button>
      </section>
      <section class="card">
        <h2>Pulihkan</h2>
        <p class="muted small">Untuk ganti HP. Data di HP ini akan diganti.</p>
        <label class="btn block" for="import-file">${icon('upload')}Pilih file cadangan</label>
        <input id="import-file" type="file" accept="application/json,.json" hidden>
        <p class="form-error" role="alert" hidden></p>
      </section>
      <section class="card">
        <h2>Pasang di layar utama</h2>
        ${standalone ? '<p class="muted small">Sudah terpasang.</p>' : `
          <p class="muted small">Chrome: menu <b>⋮</b> → <b>Instal aplikasi</b>.</p>
          <button class="btn block" type="button" data-install ${installPrompt() ? '' : 'hidden'}>Pasang sekarang</button>`}
        <p class="muted tiny">Versi ${APP_VERSION}</p>
      </section>
    </div>`;

  storageInfo().then(({ usage, persisted }) => {
    const el = root.querySelector('[data-storage]');
    if (!el) return;
    el.textContent = `${usage !== null ? `±${num(usage / 1024 / 1024, 1)} MB · ` : ''}${persisted
      ? 'penyimpanan permanen aktif'
      : 'pasang di layar utama supaya data lebih aman'}`;
  });

  root.querySelector('[data-export]').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `catatan-gym-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    try { localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString().slice(0, 10)); } catch { /* abaikan */ }
    toast('File cadangan dibuat. Cek folder Download.');
    refresh();
  });

  root.querySelector('#import-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    const err = root.querySelector('.form-error');
    err.hidden = true;
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const counts = `${data.workouts?.length ?? 0} sesi, ${data.daily?.length ?? 0} catatan harian, ${data.body?.length ?? 0} catatan badan`;
      if (!confirm(`Ganti semua catatan di HP ini dengan isi file (${counts})?`)) { e.target.value = ''; return; }
      await importData(data);
      toast('Cadangan dipulihkan.');
      refresh();
    } catch (ex) {
      err.textContent = ex instanceof SyntaxError ? 'File tidak bisa dibaca. Pilih file .json dari tombol "Simpan file cadangan".' : ex.message;
      err.hidden = false;
      e.target.value = '';
    }
  });

  root.querySelector('[data-install]')?.addEventListener('click', async () => {
    const p = installPrompt();
    if (!p) return;
    p.prompt();
    await p.userChoice;
    refresh();
  });
}
