// Service worker: simpan semua file aplikasi supaya jalan tanpa internet.
// Setiap kali file aplikasi berubah, naikkan CACHE (dan APP_VERSION di js/actions.js).
const CACHE = 'catatan-gym-v1.0.0';
const FONT_CACHE = 'catatan-gym-fonts';

const EXERCISES = ['chestpress', 'incline', 'shoulder', 'lateral', 'pushdown', 'pulldown', 'cablerow', 'row',
  'curl', 'legpress', 'goblet', 'legcurl', 'deadbug', 'plank', 'revcrunch'];

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js', 'js/actions.js', 'js/charts.js', 'js/data.js', 'js/db.js', 'js/logic.js', 'js/ui.js',
  'js/pages/backup.js', 'js/pages/body.js', 'js/pages/daily.js', 'js/pages/dashboard.js',
  'js/pages/exercise.js', 'js/pages/session.js', 'js/pages/workouts.js',
  'img/icon.svg', 'img/icon-180.png', 'img/icon-192.png', 'img/icon-512.png', 'img/icon-maskable-512.png',
  ...EXERCISES.flatMap((s) => [`img/exercises/${s}-0.jpg`, `img/exercises/${s}-1.jpg`]),
];

self.addEventListener('install', (e) => {
  // cache: 'reload' supaya tidak mengambil salinan lama dari cache HTTP (GitHub Pages menyimpan 10 menit)
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Font Google: pakai cache, perbarui di belakang layar
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONT_CACHE).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit ?? net;
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // File aplikasi: cache dulu, jaringan kalau belum ada
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit ?? fetch(req).catch(() => {
      if (req.mode === 'navigate') return caches.match('index.html');
      return Response.error();
    })),
  );
});
