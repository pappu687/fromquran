<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuranBookmark extends Model
{
    protected $fillable = [
        'user_id',
        'chapter_id',
        'verse_number',
        'verse_id',
        'verse_data',
        'notes',
        'edition',
    ];

    protected $casts = [
        'verse_data' => 'array',
    ];

    /**
     * Get the user that owns the bookmark.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get bookmarks for a specific user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get bookmarks for a specific chapter.
     */
    public function scopeForChapter($query, int $chapterId)
    {
        return $query->where('chapter_id', $chapterId);
    }

    /**
     * Scope to get bookmarks for a specific edition.
     */
    public function scopeForEdition($query, string $edition)
    {
        return $query->where('edition', $edition);
    }

    /**
     * Get a unique identifier for the verse.
     */
    public function getUniqueVerseKey(): string
    {
        return "{$this->chapter_id}:{$this->verse_number}";
    }

    /**
     * Check if this is the same verse as another bookmark.
     */
    public function isSameVerse(QuranBookmark $other): bool
    {
        return $this->chapter_id === $other->chapter_id &&
               $this->verse_number === $other->verse_number &&
               $this->edition === $other->edition;
    }
}
