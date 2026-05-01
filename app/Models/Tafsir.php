<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tafsir extends Model
{
    use HasFactory;

    protected $table = 'tafsir';

    protected $primaryKey = 'tafsir_id';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $fillable = [
        'verse_id',
        'language_id',
        'text',
        'language_name',
        'resource_content_id',
        'resource_name',
        'verse_key',
        'chapter_id',
        'verse_number',
        'juz_number',
        'hizb_number',
        'rub_el_hizb_number',
        'page_number',
        'group_verse_key_from',
        'group_verse_key_to',
        'group_verses_count',
        'group_tafsir_id',
        'start_verse_id',
        'end_verse_id',
        'ruku_number',
        'surah_ruku_number',
        'manzil_number',
    ];

    protected $casts = [
        'verse_number' => 'integer',
        'juz_number' => 'integer',
        'hizb_number' => 'integer',
        'rub_el_hizb_number' => 'integer',
        'page_number' => 'integer',
        'group_verses_count' => 'integer',
        'group_tafsir_id' => 'integer',
        'ruku_number' => 'integer',
        'surah_ruku_number' => 'integer',
        'manzil_number' => 'integer',
    ];

    /**
     * Get the verse that owns the tafsir.
     */
    public function verse(): BelongsTo
    {
        return $this->belongsTo(Verse::class);
    }

    /**
     * Get the start verse that owns the tafsir.
     */
    public function startVerse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'start_verse_id');
    }

    /**
     * Get the end verse that owns the tafsir.
     */
    public function endVerse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'end_verse_id');
    }

    /**
     * Get the chapter that owns the tafsir.
     */
    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    /**
     * Get the language that owns the tafsir.
     */
    public function language(): BelongsTo
    {
        return $this->belongsTo(Language::class);
    }

    /**
     * Get the resource content that owns the tafsir.
     */
    public function resourceContent(): BelongsTo
    {
        return $this->belongsTo(ResourceContent::class);
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
     * Scope a query to get grouped tafsirs.
     */
    public function scopeGrouped($query)
    {
        return $query->whereNotNull('group_tafsir_id');
    }

    /**
     * Scope a query to get verse-specific tafsirs.
     */
    public function scopeVerseSpecific($query)
    {
        return $query->whereNull('group_tafsir_id');
    }

    /**
     * Check if tafsir covers multiple verses.
     */
    public function coversMultipleVerses(): bool
    {
        return ! is_null($this->group_tafsir_id);
    }

    /**
     * Get verse range for grouped tafsirs.
     */
    public function getVerseRange(): string
    {
        if ($this->coversMultipleVerses()) {
            return "{$this->group_verse_key_from} - {$this->group_verse_key_to}";
        }

        return $this->verse_key;
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

    /**
     * Get truncated text for preview.
     */
    public function getPreviewText($length = 200): string
    {
        return Str::limit(strip_tags($this->text), $length);
    }

    /**
     * Check if tafsir is from approved resource.
     */
    public function isFromApprovedResource(): bool
    {
        return $this->resourceContent?->approved ?? false;
    }
}
