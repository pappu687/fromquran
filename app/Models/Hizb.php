<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Hizb extends Model
{
    use HasFactory;

    protected $fillable = [
        'hizb_number',
        'verse_mapping',
        'first_verse_id',
        'last_verse_id',
        'verses_count',
    ];

    protected $casts = [
        'hizb_number' => 'integer',
        'verse_mapping' => 'array',
        'verses_count' => 'integer',
    ];

    /**
     * Get the first verse of the hizb.
     */
    public function firstVerse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'first_verse_id');
    }

    /**
     * Get the last verse of the hizb.
     */
    public function lastVerse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'last_verse_id');
    }

    /**
     * Get hizb display name.
     */
    public function getDisplayName(): string
    {
        return "Hizb {$this->hizb_number}";
    }

    /**
     * Get rub el hizb number for this hizb.
     */
    public function getRubElHizbRange(): array
    {
        $rubHizbStart = ($this->hizb_number - 1) * 4 + 1;
        $rubHizbEnd = $this->hizb_number * 4;

        return [$rubHizbStart, $rubHizbEnd];
    }

    /**
     * Get hizb description with verse range.
     */
    public function getDescription(): string
    {
        $startChapter = $this->firstVerse->chapter->chapter_number;
        $startVerse = $this->firstVerse->verse_number;
        $endChapter = $this->lastVerse->chapter->chapter_number;
        $endVerse = $this->lastVerse->verse_number;

        return "Hizb {$this->hizb_number}: {$startChapter}:{$startVerse} - {$endChapter}:{$endVerse}";
    }
}