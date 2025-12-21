<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AudioRecitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'arabic_name',
        'relative_path',
        'format',
        'section_id',
        'description',
        'files_count',
        'resource_content_id',
        'recitation_style_id',
        'reciter_id',
        'approved',
        'home',
        'priority',
        'segments_count',
        'files_size',
        'qirat_type_id',
        'segment_locked',
    ];

    protected $casts = [
        'files_count' => 'integer',
        'approved' => 'boolean',
        'home' => 'integer',
        'priority' => 'integer',
        'segments_count' => 'integer',
        'files_size' => 'float',
        'segment_locked' => 'boolean',
    ];

    /**
     * Get the section that owns the recitation.
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(AudioSection::class);
    }

    /**
     * Get the resource content that owns the recitation.
     */
    public function resourceContent(): BelongsTo
    {
        return $this->belongsTo(ResourceContent::class);
    }

    /**
     * Get the recitation style that owns the recitation.
     */
    public function recitationStyle(): BelongsTo
    {
        return $this->belongsTo(RecitationStyle::class);
    }

    /**
     * Get the reciter that owns the recitation.
     */
    public function reciter(): BelongsTo
    {
        return $this->belongsTo(Reciter::class);
    }

    /**
     * Get the qirat type that owns the recitation.
     */
    public function qiratType(): BelongsTo
    {
        return $this->belongsTo(QiratType::class);
    }

    /**
     * Get the audio files for the recitation.
     */
    public function audioFiles(): HasMany
    {
        return $this->hasMany(AudioFile::class, 'recitation_id');
    }

    /**
     * Get the audio segments for the recitation.
     */
    public function audioSegments(): HasMany
    {
        return $this->hasMany(AudioSegment::class);
    }

    /**
     * Scope a query to only include approved recitations.
     */
    public function scopeApproved($query)
    {
        return $query->where('approved', true);
    }

    /**
     * Scope a query to only include home recitations.
     */
    public function scopeHome($query)
    {
        return $query->where('home', '>', 0)->orderByDesc('home');
    }

    /**
     * Scope a query to order by priority.
     */
    public function scopeOrderByPriority($query)
    {
        return $query->orderBy('priority', 'asc');
    }

    /**
     * Get audio file for specific verse.
     */
    public function getAudioFileForVerse($verseId)
    {
        return $this->audioFiles()->where('verse_id', $verseId)->first();
    }

    /**
     * Get audio URL for specific verse.
     */
    public function getAudioUrlForVerse($verseId): ?string
    {
        $audioFile = $this->getAudioFileForVerse($verseId);
        return $audioFile?->url;
    }

    /**
     * Get recitation display name.
     */
    public function getDisplayName(): string
    {
        return $this->reciter ? "{$this->name} - {$this->reciter->name}" : $this->name;
    }

    /**
     * Get recitation description.
     */
    public function getDescription(): string
    {
        return $this->description ?? '';
    }

    /**
     * Check if recitation is available.
     */
    public function isAvailable(): bool
    {
        return $this->approved && $this->files_count > 0;
    }

    /**
     * Update files count based on audio files.
     */
    public function updateFilesCount(): void
    {
        $this->files_count = $this->audioFiles()->count();
        $this->save();
    }

    /**
     * Calculate total duration.
     */
    public function getTotalDuration(): int
    {
        return $this->audioFiles()->sum('duration');
    }
}