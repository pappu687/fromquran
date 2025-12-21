<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Author extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'url',
        'resource_contents_count',
    ];

    protected $casts = [
        'resource_contents_count' => 'integer',
    ];

    /**
     * Get the resource contents for the author.
     */
    public function resourceContents(): HasMany
    {
        return $this->hasMany(ResourceContent::class);
    }

    /**
     * Get approved resource contents for the author.
     */
    public function approvedResourceContents(): HasMany
    {
        return $this->hasMany(ResourceContent::class)->where('approved', true);
    }

    /**
     * Get resource contents by type.
     */
    public function resourceContentsByType($resourceType): HasMany
    {
        return $this->hasMany(ResourceContent::class)
            ->where('resource_type', $resourceType)
            ->where('approved', true);
    }

    /**
     * Get author's translations.
     */
    public function translations(): HasMany
    {
        return $this->resourceContentsByType('translation');
    }

    /**
     * Get author's tafsirs.
     */
    public function tafsirs(): HasMany
    {
        return $this->resourceContentsByType('tafsir');
    }

    /**
     * Get author's transliterations.
     */
    public function transliterations(): HasMany
    {
        return $this->resourceContentsByType('transliteration');
    }

    /**
     * Update resource contents count.
     */
    public function updateResourceContentsCount(): void
    {
        $this->resource_contents_count = $this->resourceContents()->count();
        $this->save();
    }

    /**
     * Get author bio or description.
     */
    public function getBio(): string
    {
        // This could be implemented to get bio from translations or other sources
        return '';
    }

    /**
     * Get author profile picture.
     */
    public function getProfilePicture(): ?string
    {
        // This could be implemented to get author image
        return null;
    }

    /**
     * Check if author has works in specific language.
     */
    public function hasWorksInLanguage($languageCode): bool
    {
        return $this->resourceContents()
            ->whereHas('language', function ($q) use ($languageCode) {
                $q->where('iso_code', $languageCode);
            })
            ->where('approved', true)
            ->exists();
    }

    /**
     * Get languages the author has works in.
     */
    public function getWorkLanguages()
    {
        return $this->resourceContents()
            ->where('approved', true)
            ->with('language')
            ->get()
            ->pluck('language')
            ->unique('iso_code')
            ->values();
    }
}