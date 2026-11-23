<?php

namespace Tests\Feature;

use App\Models\BodyMetric;
use App\Models\Exercise;
use App\Models\Routine;
use App\Models\User;
use App\Models\Workout;
use App\Services\TrainingPlanner;
use App\Services\WeightTrend;
use Database\Seeders\ProgramSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class GymFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ProgramSeeder::class);
    }

    private function user(): User
    {
        return User::factory()->create();
    }

    public function test_register_only_when_no_user_exists(): void
    {
        $this->get('/')->assertRedirect(route('login'));
        $this->get(route('login'))->assertRedirect(route('register'));

        $this->post(route('register'), [
            'name' => 'Saya', 'email' => 'saya@contoh.test',
            'password' => 'rahasia123', 'password_confirmation' => 'rahasia123',
        ])->assertRedirect(route('dashboard'));

        $this->post(route('logout'));
        $this->get(route('register'))->assertRedirect(route('login'));
        $this->post(route('register'), [
            'name' => 'Lain', 'email' => 'lain@contoh.test',
            'password' => 'rahasia123', 'password_confirmation' => 'rahasia123',
        ])->assertForbidden();
        $this->assertSame(1, User::count());
    }

    public function test_all_pages_render(): void
    {
        $this->actingAs($this->user());

        $this->get(route('dashboard'))->assertOk()->assertSee('Mulai sesi');
        $this->get(route('workouts.index'))->assertOk()->assertSee('Dorong');
        $this->get(route('daily.index'))->assertOk()->assertSee('Sarapan');
        $this->get(route('body.index'))->assertOk()->assertSee('Belum cukup data');
        $this->get(route('exercises.show', 'chestpress'))->assertOk()->assertSee('Chest Press Machine');
    }

    public function test_start_workout_creates_three_sets_per_exercise_and_resumes(): void
    {
        $user = $this->user();
        $this->actingAs($user);
        $dorong = Routine::where('slug', 'dorong')->first();

        $this->post(route('workouts.start', $dorong))->assertRedirect();
        $workout = Workout::first();
        $this->assertSame(6 * 3, $workout->sets()->count());

        // Mulai lagi di hari yang sama → lanjutkan sesi yang sama
        $this->post(route('workouts.start', $dorong));
        $this->assertSame(1, Workout::count());

        $this->get(route('workouts.show', $workout))->assertOk()->assertSee('Pertama kali');
    }

    public function test_set_autosave_and_finish(): void
    {
        $user = $this->user();
        $this->actingAs($user);
        $this->post(route('workouts.start', 'dorong'));
        $workout = Workout::first();
        $set = $workout->sets()->first();

        $this->patchJson(route('sets.update', $set), ['weight_kg' => 25, 'reps' => 12, 'done' => true])
            ->assertOk()->assertJson(['ok' => true]);
        $this->assertTrue($set->fresh()->done);
        $this->assertSame(25.0, $set->fresh()->weight_kg);

        $this->post(route('workouts.finish', $workout), ['cardio_minutes' => 18])->assertRedirect(route('dashboard'));
        $this->assertNotNull($workout->fresh()->finished_at);
        $this->assertSame(18, $workout->fresh()->cardio_minutes);
    }

    public function test_other_users_data_is_hidden(): void
    {
        $owner = $this->user();
        $this->actingAs($owner)->post(route('workouts.start', 'dorong'));
        $workout = Workout::first();

        $this->actingAs($this->user());
        $this->get(route('workouts.show', $workout))->assertNotFound();
        $this->patchJson(route('sets.update', $workout->sets()->first()), ['reps' => 1])->assertNotFound();
    }

    public function test_next_routine_follows_fixed_order_and_suggests_progression(): void
    {
        $user = $this->user();
        $planner = app(TrainingPlanner::class);
        $this->assertSame('dorong', $planner->nextRoutine($user)->slug);

        $w = $planner->startWorkout($user, Routine::where('slug', 'dorong')->with('exercises')->first(), Carbon::parse('2026-11-16'));
        $chest = Exercise::where('slug', 'chestpress')->first();
        $w->sets()->where('exercise_id', $chest->id)->update(['weight_kg' => 30, 'reps' => 12, 'done' => true]);
        $w->update(['finished_at' => now()]);

        $this->assertSame('tarik', $planner->nextRoutine($user)->slug);

        $s = $planner->suggestion($user, $chest);
        $this->assertSame('up', $s['type']);
        $this->assertSame(30.0, $s['weight']);

        // Sesi baru mewarisi beban sebelumnya
        $w2 = $planner->startWorkout($user, Routine::where('slug', 'dorong')->with('exercises')->first(), Carbon::parse('2026-11-23'));
        $this->assertSame(30.0, $w2->sets()->where('exercise_id', $chest->id)->first()->weight_kg);
    }

    public function test_hold_suggestion_when_reps_below_top(): void
    {
        $user = $this->user();
        $planner = app(TrainingPlanner::class);
        $w = $planner->startWorkout($user, Routine::where('slug', 'dorong')->with('exercises')->first(), Carbon::parse('2026-11-16'));
        $chest = Exercise::where('slug', 'chestpress')->first();
        $w->sets()->where('exercise_id', $chest->id)->update(['weight_kg' => 30, 'reps' => 10, 'done' => true]);

        $this->assertSame('hold', $planner->suggestion($user, $chest)['type']);
    }

    public function test_weight_trend_flags_fast_loss(): void
    {
        $user = $this->user();
        foreach ([[0, 80.0], [3, 79.4], [7, 78.6], [10, 78.0], [14, 77.0]] as [$d, $kg]) {
            BodyMetric::create(['user_id' => $user->id, 'date' => Carbon::parse('2026-11-01')->addDays($d), 'weight_kg' => $kg]);
        }

        $r = app(WeightTrend::class)->analyze($user->bodyMetrics()->get());
        $this->assertSame('doctor', $r['status']); // ±1,5 kg/minggu selama 2 minggu
        $this->assertLessThan(-1.0, $r['rate']);
    }

    public function test_weight_trend_on_target(): void
    {
        $user = $this->user();
        foreach ([[0, 77.0], [4, 76.8], [8, 76.6], [12, 76.4]] as [$d, $kg]) {
            BodyMetric::create(['user_id' => $user->id, 'date' => Carbon::parse('2026-11-01')->addDays($d), 'weight_kg' => $kg]);
        }

        $this->assertSame('on_target', app(WeightTrend::class)->analyze($user->bodyMetrics()->get())['status']);
    }

    public function test_daily_log_upserts_and_computes_protein(): void
    {
        $user = $this->user();
        $this->actingAs($user);
        $date = now()->toDateString();

        $this->post(route('daily.store'), ['date' => $date, 'meals' => ['sarapan', 'siang'], 'steps' => 6500, 'sleep_hours' => 7.5, 'extra_protein_g' => 10])
            ->assertRedirect();
        $this->post(route('daily.store'), ['date' => $date, 'meals' => ['sarapan', 'siang', 'malam'], 'steps' => 8200]);

        $this->assertSame(1, $user->dailyLogs()->count());
        $log = $user->dailyLogs()->first();
        $this->assertSame(26 + 61 + 47, $log->protein());
        $this->assertSame(8200, $log->steps);

        $this->post(route('daily.store'), ['date' => $date, 'meals' => ['bukan-menu']])->assertSessionHasErrors('meals.0');
    }

    public function test_body_metric_keeps_existing_value_when_field_left_empty(): void
    {
        $user = $this->user();
        $this->actingAs($user);
        $date = now()->toDateString();

        $this->post(route('body.store'), ['date' => $date, 'weight_kg' => 77.2, 'waist_cm' => 88]);
        $this->post(route('body.store'), ['date' => $date, 'weight_kg' => 77.0]);

        $m = $user->bodyMetrics()->first();
        $this->assertSame(77.0, $m->weight_kg);
        $this->assertSame(88.0, $m->waist_cm);
    }
}
