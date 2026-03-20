<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Collection extends Model
{
    use SoftDeletes, \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'color',
        'is_public',
        'status',
        'slug',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($collection) {
            if (empty($collection->slug)) {
                $collection->slug = static::generateUniqueSlug($collection->name);
            }
        });

        static::updating(function ($collection) {
            if ($collection->isDirty('name') && empty($collection->slug)) {
                $collection->slug = static::generateUniqueSlug($collection->name);
            }
        });
    }

    /**
     * Get the user that owns the collection.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the verses in the collection.
     */
    public function verses(): BelongsToMany
    {
        return $this->belongsToMany(Verse::class, 'collection_verse')
            ->withPivot('display_order')
            ->withTimestamps()
            ->orderBy('collection_verse.display_order');
    }

    /**
     * Get the tags assigned to the collection.
     */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable')
            ->withPivot('display_order')
            ->withTimestamps()
            ->orderBy('taggables.display_order')
            ->orderBy('tags.name');
    }

    /**
     * Scope to get collections for a specific user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get public collections.
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope to get approved collections.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get private collections.
     */
    public function scopePrivate($query)
    {
        return $query->where('is_public', false);
    }

    /**
     * Generate a unique slug for the collection.
     */
    protected static function generateUniqueSlug(string $name): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while (static::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Add a verse to the collection.
     */
    public function addVerse(int $verseId, int $order = null): bool
    {
        if ($this->verses()->where('verses.id', $verseId)->exists()) {
            return false; // Verse already in collection
        }

        $displayOrder = $order ?? $this->verses()->max('display_order') + 1;

        $this->verses()->attach($verseId, ['display_order' => $displayOrder]);

        return true;
    }

    /**
     * Remove a verse from the collection.
     */
    public function removeVerse(int $verseId): bool
    {
        return $this->verses()->detach($verseId) > 0;
    }

    /**
     * Reorder verses in the collection.
     * Expects an array of ['verse_id' => int, 'display_order' => int]
     */
    public function reorderVerses(array $verseOrders): void
    {
        foreach ($verseOrders as $item) {
            $this->verses()->updateExistingPivot($item['verse_id'], [
                'display_order' => $item['display_order']
            ]);
        }
    }

    /**
     * Get the count of verses in the collection.
     */
    public function getVersesCountAttribute(): int
    {
        return $this->verses()->count();
    }

    /**
     * Check if a verse is in the collection.
     */
    public function hasVerse(int $verseId): bool
    {
        return $this->verses()->where('verses.id', $verseId)->exists();
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
