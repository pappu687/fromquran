<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerseTiming extends Model
{
    use HasFactory;

    protected $fillable = [
        'chapter_audio_file_id',
        'verse_key',
        'timestamp_from',
        'timestamp_to',
        'duration',
        'segments',
    ];

    protected $casts = [
        'timestamp_from' => 'integer',
        'timestamp_to' => 'integer',
        'duration' => 'integer',
        'segments' => 'array',
    ];

    /**
     * Get the chapter audio file that owns the verse timing.
     */
    public function chapterAudioFile(): BelongsTo
    {
        return $this->belongsTo(ChapterAudioFile::class);
    }

    /**
     * Get chapter and verse numbers from verse_key.
     */
    public function getChapterNumber(): int
    {
        return (int) explode(':', $this->verse_key)[0];
    }

    /**
     * Get verse number from verse_key.
     */
    public function getVerseNumber(): int
    {
        return (int) explode(':', $this->verse_key)[1];
    }

    /**
     * Get duration in seconds.
     */
    public function getDurationInSeconds(): float
    {
        return $this->duration / 1000;
    }

    /**
     * Get start time in seconds.
     */
    public function getStartTimeInSeconds(): float
    {
        return $this->timestamp_from / 1000;
    }

    /**
     * Get end time in seconds.
     */
    public function getEndTimeInSeconds(): float
    {
        return $this->timestamp_to / 1000;
    }
}
