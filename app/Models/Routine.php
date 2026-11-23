<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Routine extends Model
{
    protected $guarded = [];

    public const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function exercises(): BelongsToMany
    {
        return $this->belongsToMany(Exercise::class)
            ->withPivot('position', 'sets')
            ->orderByPivot('position');
    }

    public function dayName(): string
    {
        return self::DAY_NAMES[$this->day_of_week];
    }
}
