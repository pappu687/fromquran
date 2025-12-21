<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AudioSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    /**
     * Get the recitations for this section.
     */
    public function audioRecitations(): HasMany
    {
        return $this->hasMany(AudioRecitation::class);
    }
}