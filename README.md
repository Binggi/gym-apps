# Catatan Gym

Aplikasi HP (PWA) untuk mencatat program **Jadwal Gym Mingguan**:
Dorong · Tarik · Kaki, 3 set × 10–12, treadmill di akhir sesi.

Semua data disimpan **di HP** (IndexedDB). Tanpa akun, tanpa server, tetap jalan tanpa internet.

## Fitur

| Halaman | Isi |
|---|---|
| **Beranda** | Jadwal minggu ini, sesi berikutnya (urutan tetap Dorong → Tarik → Kaki), ringkasan hari ini, tren berat |
| **Latihan** | Catat beban & repetisi per set (tersimpan otomatis), timer istirahat 90 detik, layar tetap menyala, saran naik beban, foto alat bergerak, treadmill, riwayat, progres per gerakan |
| **Harian** | Checklist 4 menu makan, pemilih lauk warteg, langkah, tidur, air, grafik 14 hari |
| **Badan** | Berat & lingkar perut, laju turun kg/minggu + peringatan sesuai aturan program |
| **Cadangan** | Simpan / pulihkan semua data sebagai file `.json` |

## Pasang di HP Android

1. Buka alamat aplikasi di **Chrome** HP: `https://binggi.github.io/gym-apps/`
2. Ketuk menu **⋮** → **Instal aplikasi** (atau **Tambahkan ke layar utama**).
3. Buka dari ikon di layar utama. Setelah itu aplikasi jalan tanpa internet.

Data hanya ada di HP itu. Simpan cadangan rutin dari halaman **Cadangan**
(aplikasi mengingatkan kalau sudah lebih dari 2 minggu).

## Publikasi (GitHub Pages)

Sekali saja: di GitHub buka **Settings → Pages → Build and deployment**,
pilih **Deploy from a branch**, branch **main**, folder **/ (root)**, lalu **Save**.
Setiap push ke `main` akan memperbarui aplikasi; HP mengunduh versi baru saat online.

Saat mengubah file aplikasi, naikkan versi di dua tempat supaya HP mengambil versi baru:
`CACHE` di [sw.js](sw.js) dan `APP_VERSION` di [js/actions.js](js/actions.js).

## Struktur

```
index.html            kerangka + navigasi
manifest.webmanifest  nama, ikon, warna aplikasi
sw.js                 cache offline
css/app.css           tampilan
js/data.js            isi program: gerakan, sesi, menu, lauk warteg, target
js/logic.js           aturan program (tanpa DOM, dites di tests/)
js/db.js              penyimpanan IndexedDB + cadangan
js/charts.js          grafik SVG
js/pages/*.js         halaman
img/exercises/        foto gerakan (free-exercise-db, public domain)
```

Program, target, dan menu bisa diubah di [js/data.js](js/data.js).

## Menjalankan di PC

```bash
php -S 127.0.0.1:8000      # lalu buka http://127.0.0.1:8000
node tests/logic.test.js   # test aturan program
```

## Kredit

Foto gerakan: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense / public domain).
