<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerseReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'chapter_id',
        'verse_id',
        'type',
        'description',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    public function verse(): BelongsTo
    {
        return $this->belongsTo(Verse::class);
    }
}
