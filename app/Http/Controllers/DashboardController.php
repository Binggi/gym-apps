<?php

namespace App\Http\Controllers;

use App\Models\Routine;
use App\Services\TrainingPlanner;
use App\Services\WeightTrend;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __invoke(Request $request, TrainingPlanner $planner, WeightTrend $trend): View
    {
        $user = $request->user();
        $today = now()->startOfDay();

        $weekStart = $today->copy()->startOfWeek(); // Senin
        $weekWorkouts = $user->workouts()->with('routine')
            ->whereBetween('date', [$weekStart->toDateString(), $weekStart->copy()->addDays(6)->toDateString()])
            ->get();

        $schedule = Routine::pluck('name', 'day_of_week');
        $week = collect(range(0, 6))->map(function ($i) use ($weekStart, $weekWorkouts, $schedule, $today) {
            $d = $weekStart->copy()->addDays($i);
            $done = $weekWorkouts->first(fn ($w) => $w->date->isSameDay($d));

            return [
                'label' => mb_substr(Routine::DAY_NAMES[$d->dayOfWeek], 0, 3),
                'plan' => $schedule[$d->dayOfWeek] ?? 'Libur',
                'lift' => isset($schedule[$d->dayOfWeek]),
                'done' => $done?->routine->name,
                'today' => $d->isSameDay($today),
            ];
        });

        $todayWorkout = $user->workouts()->with('routine')->whereDate('date', $today)->latest('id')->first();
        $metrics = $user->bodyMetrics()->where('date', '>=', $today->copy()->subDays(60))->orderBy('date')->get();
        $latestWeight = $user->bodyMetrics()->whereNotNull('weight_kg')->orderByDesc('date')->first();
        $latestWaist = $user->bodyMetrics()->whereNotNull('waist_cm')->orderByDesc('date')->first();
        $log = $user->dailyLogs()->whereDate('date', $today)->first();

        return view('dashboard', [
            'today' => $today,
            'week' => $week,
            'weekDone' => $weekWorkouts->whereNotNull('finished_at')->count(),
            'next' => $planner->nextRoutine($user),
            'isGymDay' => $planner->isGymDay($today),
            'todayWorkout' => $todayWorkout,
            'programWeek' => $planner->programWeek($user),
            'trend' => $trend->analyze($metrics),
            'latestWeight' => $latestWeight,
            'latestWaist' => $latestWaist,
            'weightSeries' => $metrics->whereNotNull('weight_kg')->map(fn ($m) => [$m->date->toDateString(), $m->weight_kg])->values(),
            'log' => $log,
            'needsWaist' => ! $latestWaist || $latestWaist->date->lt($today->copy()->subDays(14)),
        ]);
    }
}
