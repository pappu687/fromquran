<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Language extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'iso_code',
        'native_name',
        'direction',
        'es_analyzer_default',
        'es_indexes',
        'translations_count',
    ];

    protected $casts = [
        'translations_count' => 'integer',
    ];

    /**
     * Get the resource contents for the language.
     */
    public function resourceContents(): HasMany
    {
        return $this->hasMany(ResourceContent::class);
    }

    /**
     * Get the translations for the language.
     */
    public function translations(): HasMany
    {
        return $this->hasMany(Translation::class);
    }

    /**
     * Get the tafsirs for the language.
     */
    public function tafsirs(): HasMany
    {
        return $this->hasMany(Tafsir::class);
    }

    /**
     * Get the chapter infos for the language.
     */
    public function chapterInfos(): HasMany
    {
        return $this->hasMany(ChapterInfo::class);
    }

    /**
     * Get the translated names for the language.
     */
    public function translatedNames(): HasMany
    {
        return $this->hasMany(TranslatedName::class);
    }

    /**
     * Scope a query to only include RTL languages.
     */
    public function scopeRtl($query)
    {
        return $query->where('direction', 'rtl');
    }

    /**
     * Scope a query to only include LTR languages.
     */
    public function scopeLtr($query)
    {
        return $query->where('direction', 'ltr');
    }

    /**
     * Check if language is RTL.
     */
    public function isRtl(): bool
    {
        return $this->direction === 'rtl';
    }

    /**
     * Get translations count by type.
     */
    public function getTranslationsCountByType($resourceType): int
    {
        return $this->resourceContents()
            ->where('resource_type', $resourceType)
            ->where('approved', true)
            ->count();
    }

    /**
     * Get popular languages for translations.
     */
    public static function getPopularForTranslations()
    {
        return static::withCount(['resourceContents' => function ($query) {
                $query->where('approved', true)
                      ->where('resource_type', 'translation');
            }])
            ->orderBy('resource_contents_count', 'desc')
            ->limit(10)
            ->get();
    }
}