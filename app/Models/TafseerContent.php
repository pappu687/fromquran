<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TafseerContent extends Model
{
    use HasFactory;

    protected $table = 'tafsir';

    protected $fillable = [
        'tafsir_id',
        'ayah_key',
        'group_ayah_key',
        'from_ayah',
        'to_ayah',
        'ayah_keys',
        'text',
    ];

    protected $casts = [
        'ayah_keys' => 'array',
    ];

    public $timestamps = false;

    /**
     * Get the tafseer book that owns this content.
     */
    public function tafseerBook(): BelongsTo
    {
        return $this->belongsTo(TafseerBook::class, 'tafsir_id');
    }

    /**
     * Scope a query to filter by ayah key.
     */
    public function scopeForAyah($query, string $ayahKey)
    {
        return $query->where('ayah_key', $ayahKey);
    }

    /**
     * Scope a query to filter by ayah range.
     */
    public function scopeForAyahInRange($query, string $ayahKey)
    {
        return $query->where(function ($q) use ($ayahKey) {
            $q->where('ayah_key', $ayahKey)
                ->orWhere(function ($subQuery) use ($ayahKey) {
                    $subQuery->whereNotNull('from_ayah')
                        ->whereNotNull('to_ayah')
                        ->where('from_ayah', '<=', $ayahKey)
                        ->where('to_ayah', '>=', $ayahKey);
                });
        });
    }

    /**
     * Check if tafsir covers multiple verses.
     */
    public function coversMultipleVerses(): bool
    {
        return !empty($this->from_ayah) && !empty($this->to_ayah);
    }

    /**
     * Get verse range for grouped tafsirs.
     */
    public function getVerseRange(): string
    {
        if ($this->coversMultipleVerses()) {
            return "{$this->from_ayah} - {$this->to_ayah}";
        }

        return $this->ayah_key ?? '';
    }

    /**
     * Get chapter and verse numbers from ayah_key.
     */
    public function getChapterVerseNumbers(): array
    {
        if (empty($this->ayah_key)) {
            return [null, null];
        }

        $parts = explode(':', $this->ayah_key);
        return [
            (int) ($parts[0] ?? null),
            (int) ($parts[1] ?? null),
        ];
    }
}
