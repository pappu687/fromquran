<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AudioSegment extends Model
{
    use HasFactory;

    protected $fillable = [
        'audio_file_id',
        'audio_recitation_id',
        'chapter_id',
        'verse_id',
        'verse_key',
        'verse_number',
        'timestamp_from',
        'timestamp_to',
        'timestamp_median',
        'segments',
        'duration',
        'duration_ms',
        'percentile',
        'silent_duration',
        'relative_segments',
        'relative_silent_duration',
    ];

    protected $casts = [
        'timestamp_from' => 'integer',
        'timestamp_to' => 'integer',
        'timestamp_median' => 'integer',
        'segments' => 'array',
        'duration' => 'integer',
        'duration_ms' => 'integer',
        'percentile' => 'float',
        'silent_duration' => 'integer',
        'relative_segments' => 'array',
        'relative_silent_duration' => 'integer',
        'verse_number' => 'integer',
    ];

    /**
     * Get the audio file that owns the segment.
     */
    public function audioFile(): BelongsTo
    {
        return $this->belongsTo(AudioFile::class);
    }

    /**
     * Get the audio recitation that owns the segment.
     */
    public function audioRecitation(): BelongsTo
    {
        return $this->belongsTo(AudioRecitation::class);
    }

    /**
     * Get the verse that owns the segment.
     */
    public function verse(): BelongsTo
    {
        return $this->belongsTo(Verse::class);
    }

    /**
     * Get the chapter that owns the segment.
     */
    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    /**
     * Get segment duration in MM:SS format.
     */
    public function getFormattedDuration(): string
    {
        if (!$this->duration) {
            return '00:00';
        }

        $seconds = floor($this->duration / 1000);
        $minutes = floor($seconds / 60);
        $seconds = $seconds % 60;

        return sprintf('%02d:%02d', $minutes, $seconds);
    }

    /**
     * Get segments as array.
     */
    public function getSegmentsArray(): array
    {
        return $this->segments ?? [];
    }

    /**
     * Get relative segments as array.
     */
    public function getRelativeSegmentsArray(): array
    {
        return $this->relative_segments ?? [];
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
     * Get all word timings.
     */
    public function getAllWordTimings(): array
    {
        $segments = $this->getSegmentsArray();
        $timings = [];

        foreach ($segments as $segment) {
            if (isset($segment['position'])) {
                $timings[$segment['position']] = [
                    'start' => $segment['timestamp_from'],
                    'end' => $segment['timestamp_to'],
                    'duration' => $segment['timestamp_to'] - $segment['timestamp_from'],
                ];
            }
        }

        return $timings;
    }

    /**
     * Check if segment has word timings.
     */
    public function hasWordTimings(): bool
    {
        $segments = $this->getSegmentsArray();
        return !empty($segments) && isset($segments[0]['position']);
    }

    /**
     * Get pause duration.
     */
    public function getPauseDuration(): int
    {
        return $this->silent_duration + $this->relative_silent_duration;
    }

    /**
     * Get effective duration (excluding silence).
     */
    public function getEffectiveDuration(): int
    {
        return $this->duration - $this->getPauseDuration();
    }
}