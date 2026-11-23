<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catatan harian pengguna: sesi latihan + set, berat badan / lingkar perut,
 * dan log harian (langkah, tidur, air, makan & protein).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('routine_id')->constrained();
            $table->date('date');
            $table->timestamp('finished_at')->nullable();
            $table->unsignedSmallInteger('cardio_minutes')->nullable();
            $table->decimal('cardio_speed', 3, 1)->nullable();    // km/jam
            $table->decimal('cardio_incline', 3, 1)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'date']);
        });

        Schema::create('workout_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained();
            $table->unsignedTinyInteger('set_number');
            $table->decimal('weight_kg', 5, 1)->nullable();
            $table->unsignedSmallInteger('reps')->nullable();  // repetisi, atau detik untuk gerakan tahan
            $table->boolean('done')->default(false);
            $table->timestamps();
            $table->index(['exercise_id', 'workout_id']);
        });

        Schema::create('body_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->decimal('weight_kg', 5, 1)->nullable();
            $table->decimal('waist_cm', 5, 1)->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'date']);
        });

        Schema::create('daily_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('steps')->nullable();
            $table->decimal('sleep_hours', 3, 1)->nullable();
            $table->decimal('water_liters', 3, 1)->nullable();
            $table->json('meals')->nullable();                    // ["sarapan","siang",...] yang sudah dimakan
            $table->unsignedSmallInteger('extra_protein_g')->nullable();
            $table->unsignedSmallInteger('extra_kcal')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_logs');
        Schema::dropIfExists('body_metrics');
        Schema::dropIfExists('workout_sets');
        Schema::dropIfExists('workouts');
    }
};
