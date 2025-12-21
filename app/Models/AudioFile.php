<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AudioFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'verse_id',
        'url',
        'duration',
        'segments',
        'mime_type',
        'format',
        'is_enabled',
        'recitation_id',
        'verse_key',
        'chapter_id',
        'verse_number',
        'juz_number',
        'hizb_number',
        'rub_el_hizb_number',
        'page_number',
        'ruku_number',
        'surah_ruku_number',
        'manzil_number',
    ];

    protected $casts = [
        'duration' => 'integer',
        'segments' => 'array',
        'is_enabled' => 'boolean',
        'verse_number' => 'integer',
        'juz_number' => 'integer',
        'hizb_number' => 'integer',
        'rub_el_hizb_number' => 'integer',
        'page_number' => 'integer',
        'ruku_number' => 'integer',
        'surah_ruku_number' => 'integer',
        'manzil_number' => 'integer',
    ];

    /**
     * Get the verse that owns the audio file.
     */
    public function verse(): BelongsTo
    {
        return $this->belongsTo(Verse::class);
    }

    /**
     * Get the chapter that owns the audio file.
     */
    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    /**
     * Get the recitation that owns the audio file.
     */
    public function recitation(): BelongsTo
    {
        return $this->belongsTo(AudioRecitation::class, 'recitation_id');
    }

    /**
     * Get the audio segments for the audio file.
     */
    public function audioSegments(): HasMany
    {
        return $this->hasMany(AudioSegment::class);
    }

    /**
     * Scope a query to only include enabled audio files.
     */
    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    /**
     * Scope a query to only include files from specific chapter.
     */
    public function scopeByChapter($query, $chapterId)
    {
        return $query->where('chapter_id', $chapterId);
    }

    /**
     * Scope a query to only include files from specific juz.
     */
    public function scopeByJuz($query, $juzNumber)
    {
        return $query->where('juz_number', $juzNumber);
    }

    /**
     * Scope a query to only include files from specific page.
     */
    public function scopeByPage($query, $pageNumber)
    {
        return $query->where('page_number', $pageNumber);
    }

    /**
     * Get file size in human readable format.
     */
    public function getFileSize(): string
    {
        // This could be implemented to get actual file size from URL
        return 'Unknown';
    }

    /**
     * Get duration in MM:SS format.
     */
    public function getFormattedDuration(): string
    {
        if (!$this->duration) {
            return '00:00';
        }

        $minutes = floor($this->duration / 60);
        $seconds = $this->duration % 60;

        return sprintf('%02d:%02d', $minutes, $seconds);
    }

    /**
     * Get audio segments as array.
     */
    public function getSegmentsArray(): array
    {
        return $this->segments ?? [];
    }

    /**
     * Get word timing for word at position.
     */
    public function getWordTiming($wordPosition): ?array
    {
        $segments = $this->getSegmentsArray();

        foreach ($segments as $segment) {
            if ($segment['position'] === $wordPosition) {
                return [
                    'start' => $segment['timestamp_from'],
                    'end' => $segment['timestamp_to'],
                    'duration' => $segment['timestamp_to'] - $segment['timestamp_from'],
                ];
            }
        }

        return null;
    }

    /**
     * Check if audio file has word timings.
     */
    public function hasWordTimings(): bool
    {
        $segments = $this->getSegmentsArray();
        return !empty($segments) && isset($segments[0]['position']);
    }

    /**
     * Get audio stream URL.
     */
    public function getStreamUrl(): string
    {
        return $this->url;
    }

    /**
     * Get audio download URL.
     */
    public function getDownloadUrl(): string
    {
        return $this->url;
    }
}