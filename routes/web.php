<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BodyMetricController;
use App\Http\Controllers\DailyLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\WorkoutController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/masuk', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/masuk', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::get('/daftar', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/daftar', [AuthController::class, 'register']);
});

Route::middleware('auth')->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');
    Route::post('/keluar', [AuthController::class, 'logout'])->name('logout');

    Route::get('/latihan', [WorkoutController::class, 'index'])->name('workouts.index');
    Route::post('/latihan/mulai/{routine}', [WorkoutController::class, 'start'])->name('workouts.start');
    Route::get('/latihan/{workout}', [WorkoutController::class, 'show'])->name('workouts.show');
    Route::patch('/latihan/{workout}', [WorkoutController::class, 'update'])->name('workouts.update');
    Route::post('/latihan/{workout}/selesai', [WorkoutController::class, 'finish'])->name('workouts.finish');
    Route::post('/latihan/{workout}/buka', [WorkoutController::class, 'reopen'])->name('workouts.reopen');
    Route::delete('/latihan/{workout}', [WorkoutController::class, 'destroy'])->name('workouts.destroy');
    Route::post('/latihan/{workout}/set', [WorkoutController::class, 'addSet'])->name('workouts.sets.store');
    Route::patch('/set/{set}', [WorkoutController::class, 'updateSet'])->name('sets.update');
    Route::delete('/set/{set}', [WorkoutController::class, 'destroySet'])->name('sets.destroy');
    Route::get('/gerakan/{exercise}', [WorkoutController::class, 'exercise'])->name('exercises.show');

    Route::get('/badan', [BodyMetricController::class, 'index'])->name('body.index');
    Route::post('/badan', [BodyMetricController::class, 'store'])->name('body.store');
    Route::delete('/badan/{metric}', [BodyMetricController::class, 'destroy'])->name('body.destroy');

    Route::get('/harian', [DailyLogController::class, 'index'])->name('daily.index');
    Route::post('/harian', [DailyLogController::class, 'store'])->name('daily.store');
});
