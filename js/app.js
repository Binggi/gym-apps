// Catatan Gym — aplikasi HP (PWA). Router hash: #/, #/latihan, #/latihan/:id, #/gerakan/:slug,
// #/harian[/:tanggal], #/badan, #/cadangan. Semua data di IndexedDB (lihat db.js).
import { setInstallPrompt } from './actions.js';
import { renderCharts } from './charts.js';
import { open } from './db.js';
import { toast } from './ui.js';
import * as backup from './pages/backup.js';
import * as body from './pages/body.js';
import * as daily from './pages/daily.js';
import * as dashboard from './pages/dashboard.js';
import * as exercise from './pages/exercise.js';
import * as session from './pages/session.js';
import * as workouts from './pages/workouts.js';

// [pola, halaman, tab aktif, judul bilah atas, halaman induk untuk tombol kembali]
const ROUTES = [
  [/^\/?$/, dashboard, 'beranda', 'Catatan Gym', null],
  [/^\/latihan$/, workouts, 'latihan', 'Latihan', null],
  [/^\/latihan\/(\d+)$/, session, 'latihan', 'Sesi latihan', '/latihan'],
  [/^\/gerakan\/([a-z]+)$/, exercise, 'latihan', 'Gerakan', '/latihan'],
  [/^\/harian(?:\/(\d{4}-\d{2}-\d{2}))?$/, daily, 'harian', 'Harian', null],
  [/^\/badan$/, body, 'badan', 'Badan', null],
  [/^\/cadangan$/, backup, 'cadangan', 'Cadangan', '/'],
];
const titleEl = document.getElementById('appbar-title');
const backBtn = document.getElementById('back');
let backTo = null;
let navCount = 0; // berapa kali pindah halaman di dalam aplikasi (untuk tombol kembali)
backBtn.addEventListener('click', () => {
  if (navCount > 1) history.back(); else location.hash = '#' + backTo;
});

const main = document.getElementById('app');
let cleanup = null;
let lastPath = null;

function route() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const match = ROUTES.map(([re, ...rest]) => [path.match(re), ...rest]).find(([m]) => m);

  try { cleanup?.(); } catch { /* abaikan */ }
  cleanup = null;

  if (!match) { location.replace('#/'); return; }
  const [m, page, tab, title, parent] = match;
  document.querySelectorAll('[data-tab]').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  titleEl.textContent = title;
  document.title = title === 'Catatan Gym' ? title : `${title} · Catatan Gym`;
  backTo = parent;
  backBtn.hidden = !parent;
  if (path !== lastPath) navCount++;

  try {
    cleanup = page.render(main, new URLSearchParams(query), ...m.slice(1)) ?? null;
  } catch (e) {
    console.error(e);
    main.innerHTML = '<div class="page-head"><h1>Ada yang salah</h1><p class="lead">Halaman ini gagal dibuka. Kembali ke <a href="#/">Beranda</a>. Data kamu tetap aman.</p></div>';
  }
  renderCharts(main);
  if (path !== lastPath) window.scrollTo(0, 0);
  lastPath = path;
}

// Foto gerakan: ketuk untuk jeda / putar
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-anim]');
  if (!a) return;
  const paused = a.classList.toggle('paused');
  a.setAttribute('aria-pressed', String(paused));
  a.querySelector('.state').textContent = paused ? 'Dijeda · ketuk untuk putar' : 'Ketuk untuk jeda';
});

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setInstallPrompt(e); });
window.addEventListener('appinstalled', () => { setInstallPrompt(null); toast('Aplikasi terpasang di layar utama.'); });

async function start() {
  try {
    await open();
  } catch (e) {
    console.error(e);
    main.innerHTML = '<div class="page-head"><h1>Penyimpanan tidak tersedia</h1><p class="lead">Browser menolak menyimpan data. Jangan pakai mode penyamaran (incognito), lalu buka lagi.</p></div>';
    return;
  }
  window.addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw?.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            toast('Versi baru siap. Tutup lalu buka lagi aplikasinya untuk memakai.', 'neutral');
          }
        });
      });
    }).catch((e) => console.warn('Service worker gagal didaftarkan', e));
  }
}

start();
