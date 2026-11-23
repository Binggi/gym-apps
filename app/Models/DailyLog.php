<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyLog extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'meals' => 'array',
            'sleep_hours' => 'float',
            'water_liters' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hasMeal(string $key): bool
    {
        return in_array($key, $this->meals ?? [], true);
    }

    public function protein(): int
    {
        $menu = config('gym.meals');

        return (int) collect($this->meals ?? [])->sum(fn ($k) => $menu[$k]['protein'] ?? 0)
            + (int) $this->extra_protein_g;
    }

    public function kcal(): int
    {
        $menu = config('gym.meals');

        return (int) collect($this->meals ?? [])->sum(fn ($k) => $menu[$k]['kcal'] ?? 0)
            + (int) $this->extra_kcal;
    }
}
