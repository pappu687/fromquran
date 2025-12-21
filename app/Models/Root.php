<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Root extends Model
{
    use HasFactory;

    protected $fillable = [
        'value',
        'text_clean',
        'text_uthmani',
        'english_trilateral',
        'arabic_trilateral',
        'en_translations',
        'ur_translations',
        'dictionary_image_path',
        'words_count',
        'uniq_words_count',
    ];

    protected $casts = [
        'en_translations' => 'array',
        'ur_translations' => 'array',
        'words_count' => 'integer',
        'uniq_words_count' => 'integer',
    ];

    /**
     * Get the words for the root.
     */
    public function words(): HasMany
    {
        return $this->hasMany(Word::class);
    }

    /**
     * Get the dictionary word root.
     */
    public function dictionaryWordRoots(): HasMany
    {
        return $this->hasMany(DictionaryWordRoot::class);
    }

    /**
     * Get the dictionary examples for the root.
     */
    public function dictionaryExamples(): HasMany
    {
        return $this->hasMany(DictionaryRootExample::class);
    }

    /**
     * Scope a query to search by root value.
     */
    public function scopeSearchByRoot($query, $rootValue)
    {
        return $query->where('value', 'LIKE', "%{$rootValue}%")
                   ->orWhere('arabic_trilateral', 'LIKE', "%{$rootValue}%")
                   ->orWhere('english_trilateral', 'LIKE', "%{$rootValue}%");
    }

    /**
     * Get root display value.
     */
    public function getDisplayValue(): string
    {
        return $this->value ?? $this->arabic_trilateral ?? $this->english_trilateral ?? '';
    }

    /**
     * Get English translations as string.
     */
    public function getEnglishTranslationsString(): string
    {
        return is_array($this->en_translations) ? implode(', ', $this->en_translations) : '';
    }

    /**
     * Get Urdu translations as string.
     */
    public function getUrduTranslationsString(): string
    {
        return is_array($this->ur_translations) ? implode(', ', $this->ur_translations) : '';
    }

    /**
     * Get dictionary image URL.
     */
    public function getDictionaryImageUrl(): ?string
    {
        return $this->dictionary_image_path;
    }

    /**
     * Check if root has dictionary image.
     */
    public function hasDictionaryImage(): bool
    {
        return !empty($this->dictionary_image_path);
    }

    /**
     * Check if root is trilateral.
     */
    public function isTrilateral(): bool
    {
        $value = $this->value ?? '';
        return strlen($value) === 3;
    }

    /**
     * Check if root has words.
     */
    public function hasWords(): bool
    {
        return $this->words_count > 0;
    }

    /**
     * Get popular roots (with most words).
     */
    public static function getPopular($limit = 10)
    {
        return static::orderBy('words_count', 'desc')
                   ->where('words_count', '>', 0)
                   ->limit($limit)
                   ->get();
    }

    /**
     * Update words count.
     */
    public function updateWordsCount(): void
    {
        $this->words_count = $this->words()->count();
        $this->uniq_words_count = $this->words()->distinct('text_uthmani')->count();
        $this->save();
    }
}