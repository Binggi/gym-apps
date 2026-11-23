<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workout extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'finished_at' => 'datetime',
            'cardio_speed' => 'float',
            'cardio_incline' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function routine(): BelongsTo
    {
        return $this->belongsTo(Routine::class);
    }

    public function sets(): HasMany
    {
        return $this->hasMany(WorkoutSet::class)->orderBy('set_number');
    }

    public function isFinished(): bool
    {
        return $this->finished_at !== null;
    }

    /** Total volume (beban × repetisi) dari set yang selesai, tanpa gerakan tahan. */
    public function volume(): float
    {
        return (float) $this->sets
            ->filter(fn (WorkoutSet $s) => $s->done && $s->weight_kg && $s->reps && ! $s->exercise?->is_timed)
            ->sum(fn (WorkoutSet $s) => $s->weight_kg * $s->reps);
    }
}
