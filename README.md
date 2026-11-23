# Catatan Gym

Aplikasi pencatatan harian untuk program **Jadwal Gym Mingguan**
(Dorong · Tarik · Kaki, 3 set × 10–12, treadmill di akhir sesi).

Laravel 13 + MySQL. Tanpa build step: CSS/JS biasa di `public/css/app.css` dan `public/js/app.js`.

## Fitur

| Halaman | Isi |
|---|---|
| **Beranda** `/` | Strip minggu ini, sesi berikutnya (urutan tetap Dorong → Tarik → Kaki), ringkasan hari ini, tren berat |
| **Latihan** `/latihan` | Mulai sesi, catat beban & repetisi tiap set (tersimpan otomatis), timer istirahat 90 detik, saran naik beban, treadmill, riwayat, progres per gerakan |
| **Harian** `/harian` | Checklist 4 menu makan (protein & kkal otomatis), langkah, tidur, air, grafik 14 hari |
| **Badan** `/badan` | Berat & lingkar perut, laju turun kg/minggu + peringatan sesuai aturan program |

Aturan program (target, menu, kalori) ada di [config/gym.php](config/gym.php);
daftar gerakan & sesi di [database/seeders/ProgramSeeder.php](database/seeders/ProgramSeeder.php).

## Menjalankan

```bash
php artisan migrate --seed     # buat tabel + isi program
```

- **Laragon:** klik *Reload* Apache → buka http://gym-apps.test
- **Tanpa Laragon:** `php artisan serve` → http://localhost:8000

Pertama kali dibuka, buat akun di `/daftar`. Setelah satu akun ada, halaman daftar tertutup.

**Dari HP (satu Wi-Fi):** `php artisan serve --host=0.0.0.0 --port=8000`, lalu buka
`http://<IP-laptop>:8000` di HP. Bisa di-*Add to Home Screen* agar terasa seperti aplikasi.

## Test

```bash
php artisan test   # memakai database MySQL gym_apps_test
```
