<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Chapter extends Model
{
    use HasFactory;

    protected $fillable = [
        'bismillah_pre',
        'revelation_order',
        'revelation_place',
        'name_complex',
        'name_arabic',
        'name_roman',
        'name_simple',
        'pages',
        'verses_count',
        'chapter_number',
        'rukus_count',
        'hizbs_count',
        'rub_el_hizbs_count',
    ];

    protected $casts = [
        'bismillah_pre' => 'boolean',
        'revelation_order' => 'integer',
        'verses_count' => 'integer',
        'chapter_number' => 'integer',
        'rukus_count' => 'integer',
        'hizbs_count' => 'integer',
        'rub_el_hizbs_count' => 'integer',
        'pages' => 'array',
    ];

    /**
     * Get the verses for the chapter.
     */
    public function verses(): HasMany
    {
        return $this->hasMany(Verse::class);
    }

    /**
     * Get the first verse of the chapter.
     */
    public function firstVerse(): HasOne
    {
        return $this->hasOne(Verse::class)->orderBy('verse_number');
    }

    /**
     * Get the last verse of the chapter.
     */
    public function lastVerse(): HasOne
    {
        return $this->hasOne(Verse::class)->orderByDesc('verse_number');
    }

    /**
     * Get the chapter info translations.
     */
    public function chapterInfos(): HasMany
    {
        return $this->hasMany(ChapterInfo::class);
    }

    /**
     * Get the translated names.
     */
    public function translatedNames(): HasMany
    {
        return $this->hasMany(TranslatedName::class);
    }

    /**
     * Scope a query to only include Meccan chapters.
     */
    public function scopeMeccan($query)
    {
        return $query->where('revelation_place', 'meccan');
    }

    /**
     * Scope a query to only include Medinan chapters.
     */
    public function scopeMedinan($query)
    {
        return $query->where('revelation_place', 'medinan');
    }

    /**
     * Get chapter name in specific language.
     */
    public function getTranslatedName($languageCode)
    {
        $translatedName = $this->translatedNames()
            ->whereHas('language', function ($q) use ($languageCode) {
                $q->where('iso_code', $languageCode);
            })
            ->first();

        return $translatedName ? $translatedName->name : $this->name_simple;
    }

    /**
     * Get the formatted chapter name with number.
     */
    public function getFormattedName(): string
    {
        return "{$this->chapter_number}. {$this->name_simple}";
    }
}