<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reciter extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'arabic_name',
        'relative_path',
        'description',
        'is_enabled',
        'priority',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'priority' => 'integer',
    ];

    /**
     * Get the chapter audio files for the reciter.
     */
    public function chapterAudioFiles(): HasMany
    {
        return $this->hasMany(ChapterAudioFile::class);
    }

    /**
     * Get the audio recitations for the reciter.
     */
    public function audioRecitations(): HasMany
    {
        return $this->hasMany(AudioRecitation::class);
    }

    /**
     * Scope a query to only include enabled reciters.
     */
    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    /**
     * Scope a query to order by priority.
     */
    public function scopeOrderByPriority($query)
    {
        return $query->orderBy('priority', 'asc');
    }
}
