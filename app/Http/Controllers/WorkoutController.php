<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use App\Models\Routine;
use App\Models\Workout;
use App\Models\WorkoutSet;
use App\Services\TrainingPlanner;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class WorkoutController extends Controller
{
    public function __construct(private TrainingPlanner $planner) {}

    public function index(Request $request): View
    {
        $user = $request->user();

        return view('workouts.index', [
            'workouts' => $user->workouts()->with(['routine', 'sets.exercise'])
                ->orderByDesc('date')->orderByDesc('id')->paginate(15),
            'routines' => Routine::with('exercises')->orderBy('position')->get(),
            'next' => $this->planner->nextRoutine($user),
        ]);
    }

    public function start(Request $request, Routine $routine): RedirectResponse
    {
        $data = $request->validate(['date' => ['nullable', 'date', 'before_or_equal:today']]);
        $date = isset($data['date']) ? Carbon::parse($data['date']) : now();
        $user = $request->user();

        $existing = $user->workouts()->where('routine_id', $routine->id)
            ->whereDate('date', $date)->whereNull('finished_at')->latest('id')->first();

        $workout = $existing ?? $this->planner->startWorkout($user, $routine->load('exercises'), $date);

        return redirect()->route('workouts.show', $workout);
    }

    public function show(Request $request, Workout $workout): View
    {
        $this->authorizeOwner($request, $workout);
        $user = $request->user();
        $workout->load(['routine.exercises', 'sets.exercise']);

        $routineOrder = $workout->routine->exercises->pluck('id')->flip();
        $groups = $workout->sets->groupBy('exercise_id')
            ->sortBy(fn ($sets, $id) => $routineOrder[$id] ?? 99)
            ->map(fn ($sets) => [
                'exercise' => $sets->first()->exercise,
                'sets' => $sets->sortBy('set_number')->values(),
                'suggestion' => $this->planner->suggestion($user, $sets->first()->exercise, $workout),
            ]);

        return view('workouts.show', [
            'workout' => $workout,
            'groups' => $groups,
            'cardio' => $this->planner->cardioTarget($user, $workout->date),
            'programWeek' => $this->planner->programWeek($user, $workout->date),
        ]);
    }

    public function update(Request $request, Workout $workout): RedirectResponse|JsonResponse
    {
        $this->authorizeOwner($request, $workout);

        $data = $request->validate([
            'date' => ['sometimes', 'date', 'before_or_equal:today'],
            'cardio_minutes' => ['nullable', 'integer', 'min:0', 'max:300'],
            'cardio_speed' => ['nullable', 'numeric', 'min:0', 'max:25'],
            'cardio_incline' => ['nullable', 'numeric', 'min:0', 'max:15'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $workout->update($data);

        return $request->expectsJson()
            ? response()->json(['ok' => true])
            : back()->with('status', 'Tersimpan.');
    }

    public function finish(Request $request, Workout $workout): RedirectResponse
    {
        $this->authorizeOwner($request, $workout);

        $data = $request->validate([
            'cardio_minutes' => ['nullable', 'integer', 'min:0', 'max:300'],
            'cardio_speed' => ['nullable', 'numeric', 'min:0', 'max:25'],
            'cardio_incline' => ['nullable', 'numeric', 'min:0', 'max:15'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $workout->update($data + ['finished_at' => $workout->finished_at ?? now()]);

        $done = $workout->sets()->where('done', true)->count();
        $total = $workout->sets()->count();

        return redirect()->route('dashboard')
            ->with('status', "Sesi {$workout->routine->name} selesai: {$done} dari {$total} set. Mantap!");
    }

    public function reopen(Request $request, Workout $workout): RedirectResponse
    {
        $this->authorizeOwner($request, $workout);
        $workout->update(['finished_at' => null]);

        return redirect()->route('workouts.show', $workout);
    }

    public function destroy(Request $request, Workout $workout): RedirectResponse
    {
        $this->authorizeOwner($request, $workout);
        $workout->delete();

        return redirect()->route('workouts.index')->with('status', 'Sesi dihapus.');
    }

    public function addSet(Request $request, Workout $workout): RedirectResponse
    {
        $this->authorizeOwner($request, $workout);
        $data = $request->validate(['exercise_id' => ['required', 'exists:exercises,id']]);

        $last = $workout->sets()->where('exercise_id', $data['exercise_id'])->orderByDesc('set_number')->first();
        $workout->sets()->create([
            'exercise_id' => $data['exercise_id'],
            'set_number' => ($last->set_number ?? 0) + 1,
            'weight_kg' => $last?->weight_kg,
        ]);

        return redirect()->to(route('workouts.show', $workout).'#ex-'.$data['exercise_id']);
    }

    public function updateSet(Request $request, WorkoutSet $set): JsonResponse
    {
        $this->authorizeOwner($request, $set->workout);

        $data = $request->validate([
            'weight_kg' => ['nullable', 'numeric', 'min:0', 'max:500'],
            'reps' => ['nullable', 'integer', 'min:0', 'max:600'],
            'done' => ['sometimes', 'boolean'],
        ]);

        $set->update($data);

        return response()->json(['ok' => true, 'set' => $set->only('id', 'weight_kg', 'reps', 'done')]);
    }

    public function destroySet(Request $request, WorkoutSet $set): RedirectResponse
    {
        $workout = $set->workout;
        $this->authorizeOwner($request, $workout);
        $exerciseId = $set->exercise_id;
        $set->delete();

        // Rapikan nomor set
        $workout->sets()->where('exercise_id', $exerciseId)->orderBy('set_number')->get()
            ->each(fn (WorkoutSet $s, $i) => $s->update(['set_number' => $i + 1]));

        return redirect()->to(route('workouts.show', $workout).'#ex-'.$exerciseId);
    }

    public function exercise(Request $request, Exercise $exercise): View
    {
        $user = $request->user();

        $history = $user->workouts()
            ->whereHas('sets', fn ($q) => $q->where('exercise_id', $exercise->id)->where('done', true))
            ->with(['sets' => fn ($q) => $q->where('exercise_id', $exercise->id)->where('done', true)->orderBy('set_number')])
            ->orderBy('date')->get()
            ->map(fn (Workout $w) => [
                'workout' => $w,
                'top' => $exercise->uses_weight ? $w->sets->max('weight_kg') : $w->sets->max('reps'),
                'reps' => $w->sets->pluck('reps'),
                'weights' => $w->sets->pluck('weight_kg'),
            ]);

        return view('workouts.exercise', [
            'exercise' => $exercise,
            'history' => $history->reverse()->values(),
            'series' => $history->filter(fn ($h) => $h['top'] !== null)
                ->map(fn ($h) => [$h['workout']->date->toDateString(), (float) $h['top']])->values(),
            'suggestion' => $this->planner->suggestion($user, $exercise),
        ]);
    }

    private function authorizeOwner(Request $request, Workout $workout): void
    {
        abort_unless($workout->user_id === $request->user()->id, 404);
    }
}
