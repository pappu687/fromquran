<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Juz extends Model
{
    use HasFactory;

    protected $fillable = [
        'juz_number',
        'verse_mapping',
        'first_verse_id',
        'last_verse_id',
        'verses_count',
    ];

    protected $casts = [
        'juz_number' => 'integer',
        'verse_mapping' => 'array',
        'verses_count' => 'integer',
    ];

    /**
     * Get the first verse of the juz.
     */
    public function firstVerse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'first_verse_id');
    }

    /**
     * Get the last verse of the juz.
     */
    public function lastVerse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'last_verse_id');
    }

    /**
     * Get the verses in the juz.
     */
    public function verses(): HasMany
    {
        return Verse::whereBetween('verse_index', [
            $this->firstVerse->verse_index,
            $this->lastVerse->verse_index
        ]);
    }

    /**
     * Get the chapters in the juz.
     */
    public function chapters(): HasMany
    {
        $verseRange = $this->verses();
        $chapterIds = $verseRange->pluck('chapter_id')->unique();

        return Chapter::whereIn('id', $chapterIds);
    }

    /**
     * Get juz display name.
     */
    public function getDisplayName(): string
    {
        return "Juz {$this->juz_number}";
    }

    /**
     * Get juz description with verse range.
     */
    public function getDescription(): string
    {
        $startChapter = $this->firstVerse->chapter->chapter_number;
        $startVerse = $this->firstVerse->verse_number;
        $endChapter = $this->lastVerse->chapter->chapter_number;
        $endVerse = $this->lastVerse->verse_number;

        if ($startChapter === $endChapter) {
            return "Juz {$this->juz_number}: {$startChapter}:{$startVerse} - {$endChapter}:{$endVerse}";
        }

        return "Juz {$this->juz_number}: {$startChapter}:{$startVerse} - {$endChapter}:{$endVerse}";
    }
}