<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChapterAudioFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'chapter_id',
        'reciter_id',
        'audio_recitation_id',
        'audio_url',
        'duration',
        'file_size',
        'format',
        'mime_type',
        'is_enabled',
        'priority',
    ];

    protected $casts = [
        'duration' => 'integer',
        'file_size' => 'decimal:2',
        'is_enabled' => 'boolean',
        'priority' => 'integer',
    ];

    /**
     * Get the chapter that owns the audio file.
     */
    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    /**
     * Get the reciter that owns the audio file.
     */
    public function reciter(): BelongsTo
    {
        return $this->belongsTo(Reciter::class);
    }

    /**
     * Get the audio recitation that owns the audio file.
     */
    public function audioRecitation(): BelongsTo
    {
        return $this->belongsTo(AudioRecitation::class);
    }

    /**
     * Get the verse timings for the audio file.
     */
    public function verseTimings(): HasMany
    {
        return $this->hasMany(VerseTiming::class);
    }

    /**
     * Scope a query to only include enabled audio files.
     */
    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    /**
     * Scope a query to filter by chapter and reciter.
     */
    public function scopeByChapterAndReciter($query, $chapterId, $reciterId)
    {
        return $query->where('chapter_id', $chapterId)
            ->where('reciter_id', $reciterId);
    }

    /**
     * Get duration in formatted string (MM:SS).
     */
    public function getFormattedDuration(): string
    {
        if (!$this->duration) {
            return '00:00';
        }

        $totalSeconds = floor($this->duration / 1000);
        $minutes = floor($totalSeconds / 60);
        $seconds = $totalSeconds % 60;

        return sprintf('%02d:%02d', $minutes, $seconds);
    }

    /**
     * Get the timing for a specific verse.
     */
    public function getVerseTiming($verseNumber): ?VerseTiming
    {
        $verseKey = "{$this->chapter_id}:{$verseNumber}";
        return $this->verseTimings()->where('verse_key', $verseKey)->first();
    }
}
