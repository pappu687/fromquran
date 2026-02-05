<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SimilarAyah extends Model
{
    protected $table = 'similar_ayahs';

    protected $fillable = [
        'verse_key',
        'matched_ayah_key',
        'matched_words_count',
        'coverage',
        'score',
        'match_words_range',
    ];

    protected $casts = [
        'matched_words_count' => 'integer',
        'coverage' => 'integer',
        'score' => 'integer',
        'match_words_range' => 'array',
    ];

    /**
     * Get the verse that has these similar verses.
     */
    public function verse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'verse_key', 'verse_key');
    }

    /**
     * Get the matched similar verse.
     */
    public function matchedVerse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'matched_ayah_key', 'verse_key');
    }
}
