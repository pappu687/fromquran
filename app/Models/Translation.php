<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Translation extends Model
{
    use HasFactory;

    protected $fillable = [
        'language_id',
        'text',
        'resource_content_id',
        'verse_id',
        'language_name',
        'resource_name',
        'priority',
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
        'priority' => 'integer',
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
     * Get the language that owns the translation.
     */
    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    /**
     * Get the resource content that owns the translation.
     */
    public function resourceContent(): BelongsTo
    {
        return $this->belongsTo(ResourceContent::class);
    }

    /**
     * Get the verse that owns the translation.
     */
    public function verse(): BelongsTo
    {
        return $this->belongsTo(Verse::class);
    }

    /**
     * Get the chapter that owns the translation.
     */
    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    /**
     * Scope a query to filter by language.
     */
    public function scopeByLanguage($query, $languageCode)
    {
        return $query->whereHas('language', function ($q) use ($languageCode) {
            $q->where('iso_code', $languageCode);
        });
    }

    /**
     * Scope a query to filter by resource.
     */
    public function scopeByResource($query, $resourceId)
    {
        return $query->whereHas('resourceContent', function ($q) use ($resourceId) {
            $q->where('resource_id', $resourceId);
        });
    }

    /**
     * Scope a query to order by priority.
     */
    public function scopeOrderByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }

    /**
     * Get translation text with footnotes.
     */
    public function getTextWithFootnotes(): string
    {
        return $this->text;
    }

    /**
     * Check if translation is from approved resource.
     */
    public function isFromApprovedResource(): bool
    {
        return $this->resourceContent?->approved ?? false;
    }

    /**
     * Get resource information.
     */
    public function getResourceInfo(): array
    {
        return [
            'name' => $this->resource_name,
            'language' => $this->language_name,
            'resource_id' => $this->resourceContent?->resource_id,
        ];
    }
}