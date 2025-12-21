<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecitationStyle extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'arabic',
        'slug',
        'description',
        'recitations_count',
    ];

    protected $casts = [
        'recitations_count' => 'integer',
    ];

    /**
     * Get the audio recitations for this style.
     */
    public function audioRecitations(): HasMany
    {
        return $this->hasMany(AudioRecitation::class);
    }
}