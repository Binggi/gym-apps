<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Akun pengguna dibuat lewat halaman /daftar saat pertama kali dibuka.
     */
    public function run(): void
    {
        $this->call(ProgramSeeder::class);
    }
}
