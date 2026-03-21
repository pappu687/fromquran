<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class VerseAnnotation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'verse_id',
        'start_offset',
        'end_offset',
        'selected_text',
        'note',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'verse_id' => 'integer',
        'start_offset' => 'integer',
        'end_offset' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verse(): BelongsTo
    {
        return $this->belongsTo(Verse::class);
    }
}
