<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exercise extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'is_timed' => 'boolean',
            'per_side' => 'boolean',
            'uses_weight' => 'boolean',
            'steps' => 'array',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function routines(): BelongsToMany
    {
        return $this->belongsToMany(Routine::class)->withPivot('position', 'sets');
    }

    public function sets(): HasMany
    {
        return $this->hasMany(WorkoutSet::class);
    }

    /** "10–12", "8 per sisi", "20–30 detik" */
    public function targetLabel(): string
    {
        $range = $this->rep_min === $this->rep_max ? (string) $this->rep_min : $this->rep_min.'–'.$this->rep_max;

        return $range.($this->is_timed ? ' detik' : '').($this->per_side ? ' per sisi' : '');
    }

    public function unitLabel(): string
    {
        return $this->is_timed ? 'detik' : 'rep';
    }
}
