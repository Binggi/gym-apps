<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Program latihan: daftar gerakan (alat) dan sesi (Dorong / Tarik / Kaki)
 * beserta urutan gerakannya. Data awal diisi oleh ProgramSeeder.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');                 // Nama Indonesia, mis. "Dorong Dada (duduk)"
            $table->string('machine_name');         // Nama alat, mis. "Chest Press Machine"
            $table->string('muscle');               // Otot yang dilatih
            $table->unsignedTinyInteger('rep_min'); // Target repetisi (atau detik untuk gerakan tahan)
            $table->unsignedTinyInteger('rep_max');
            $table->boolean('is_timed')->default(false);  // Plank: dihitung detik, bukan repetisi
            $table->boolean('per_side')->default(false);  // Dihitung per sisi
            $table->boolean('uses_weight')->default(true);
            $table->json('steps')->nullable();      // Langkah singkat
            $table->string('avoid')->nullable();    // "Hindari: ..."
            $table->string('video_query')->nullable();
            $table->timestamps();
        });

        Schema::create('routines', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');                         // Dorong / Tarik / Kaki
            $table->string('focus');
            $table->unsignedTinyInteger('day_of_week');     // 0 = Minggu ... 6 = Sabtu (jadwal ideal)
            $table->unsignedTinyInteger('position');        // Urutan tetap: 1, 2, 3
            $table->timestamps();
        });

        Schema::create('exercise_routine', function (Blueprint $table) {
            $table->id();
            $table->foreignId('routine_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->unsignedTinyInteger('sets')->default(3);
            $table->unique(['routine_id', 'exercise_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exercise_routine');
        Schema::dropIfExists('routines');
        Schema::dropIfExists('exercises');
    }
};
