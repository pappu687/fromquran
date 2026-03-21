<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Verse extends Model
{
    use HasFactory;

    protected $fillable = [
        'chapter_id',
        'verse_number',
        'verse_index',
        'verse_key',
        'text_uthmani',
        'text_indopak',
        'text_imlaei_simple',
        'juz_number',
        'hizb_number',
        'rub_el_hizb_number',
        'sajdah_type',
        'sajdah_number',
        'page_number',
        'image_url',
        'image_width',
        'verse_root_id',
        'verse_lemma_id',
        'verse_stem_id',
        'text_imlaei',
        'text_uthmani_simple',
        'text_uthmani_tajweed',
        'code_v1',
        'code_v2',
        'v2_page',
        'text_qpc_hafs',
        'words_count',
        'text_indopak_nastaleeq',
        'pause_words_count',
        'mushaf_pages_mapping',
        'text_qpc_nastaleeq',
        'ruku_number',
        'surah_ruku_number',
        'manzil_number',
        'text_qpc_nastaleeq_hafs',
        'mushaf_juzs_mapping',
    ];

    protected $casts = [
        'verse_number' => 'integer',
        'verse_index' => 'integer',
        'juz_number' => 'integer',
        'hizb_number' => 'integer',
        'rub_el_hizb_number' => 'integer',
        'sajdah_number' => 'integer',
        'page_number' => 'integer',
        'image_width' => 'integer',
        'v2_page' => 'integer',
        'words_count' => 'integer',
        'pause_words_count' => 'integer',
        'mushaf_pages_mapping' => 'array',
        'ruku_number' => 'integer',
        'surah_ruku_number' => 'integer',
        'manzil_number' => 'integer',
        'mushaf_juzs_mapping' => 'array',
    ];

    /**
     * Get the chapter that owns the verse.
     */
    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    /**
     * Get the words for the verse.
     */
    public function words(): HasMany
    {
        return $this->hasMany(Word::class)->orderBy('position');
    }

    /**
     * Get the translations for the verse.
     */
    public function translations(): HasMany
    {
        return $this->hasMany(Translation::class);
    }

    /**
     * Get the tafsirs for the verse.
     */
    public function tafsirs(): HasMany
    {
        return $this->hasMany(Tafsir::class);
    }

    /**
     * Get the audio files for the verse.
     */
    public function audioFiles(): HasMany
    {
        return $this->hasMany(AudioFile::class);
    }

    /**
     * Get the verse root.
     */
    public function verseRoot(): BelongsTo
    {
        return $this->belongsTo(VerseRoot::class);
    }

    /**
     * Get the verse lemma.
     */
    public function verseLemma(): BelongsTo
    {
        return $this->belongsTo(VerseLemma::class);
    }

    /**
     * Get the verse stem.
     */
    public function verseStem(): BelongsTo
    {
        return $this->belongsTo(VerseStem::class);
    }

    /**
     * Get the collections that contain this verse.
     */
    public function collections(): BelongsToMany
    {
        return $this->belongsToMany(Collection::class, 'collection_verse')
            ->withPivot('display_order')
            ->withTimestamps();
    }

    /**
     * Get the similar verses for this verse.
     */
    public function similarVerses(): HasMany
    {
        return $this->hasMany(SimilarAyah::class, 'verse_key', 'verse_key');
    }

    /**
     * Get verses where this verse is marked as similar.
     */
    public function relatedVerses(): HasMany
    {
        return $this->hasMany(SimilarAyah::class, 'matched_ayah_key', 'verse_key');
    }

    /**
     * Get the annotations for the verse.
     */
    public function annotations(): HasMany
    {
        return $this->hasMany(VerseAnnotation::class);
    }

    /**
     * Scope a query to only include verses from specific Juz.
     */
    public function scopeInJuz($query, $juzNumber)
    {
        return $query->where('juz_number', $juzNumber);
    }

    /**
     * Scope a query to only include verses from specific Hizb.
     */
    public function scopeInHizb($query, $hizbNumber)
    {
        return $query->where('hizb_number', $hizbNumber);
    }

    /**
     * Scope a query to only include verses from specific page.
     */
    public function scopeOnPage($query, $pageNumber)
    {
        return $query->where('page_number', $pageNumber);
    }

    /**
     * Scope a query to only include sajda verses.
     */
    public function scopeSajda($query, $type = null)
    {
        if ($type) {
            return $query->where('sajdah_type', $type);
        }
        return $query->whereNotNull('sajdah_type');
    }

    /**
     * Get translation in specific language.
     */
    public function getTranslation($languageCode)
    {
        return $this->translations()
            ->whereHas('resourceContent.language', function ($q) use ($languageCode) {
                $q->where('iso_code', $languageCode);
            })
            ->where('resource_contents.resource_type', 'translation')
            ->join('resource_contents', 'translations.resource_content_id', '=', 'resource_contents.id')
            ->orderBy('resource_contents.priority')
            ->first();
    }

    /**
     * Get tafsir in specific language.
     */
    public function getTafsir($languageCode, $tafsirId = null)
    {
        $query = $this->tafsirs()
            ->whereHas('resourceContent.language', function ($q) use ($languageCode) {
                $q->where('iso_code', $languageCode);
            });

        if ($tafsirId) {
            $query->where('resource_contents.resource_id', $tafsirId);
        }

        return $query->join('resource_contents', 'tafsirs.resource_content_id', '=', 'resource_contents.id')
            ->orderBy('resource_contents.priority')
            ->first();
    }

    /**
     * Check if verse is sajda.
     */
    public function isSajda(): bool
    {
        return !is_null($this->sajdah_type);
    }

    /**
     * Get formatted verse key.
     */
    public function getFormattedKey(): string
    {
        return "({$this->chapter->chapter_number}:{$this->verse_number})";
    }
}
