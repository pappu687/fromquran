<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Token extends Model
{
    use HasFactory;

    protected $fillable = [
        'text_uthmani',
        'text_imlaei_simple',
        'text_indopak',
        'text_imlaei',
        'text_uthmani_tajweed',
        'text',
        'resource_content_id',
        'record_id',
        'record_type',
        'uniq_token_count',
    ];

    protected $casts = [
        'record_id' => 'integer',
        'uniq_token_count' => 'integer',
    ];

    /**
     * Get the words for the token.
     */
    public function words(): HasMany
    {
        return $this->hasMany(Word::class);
    }

    /**
     * Get the resource content that owns the token.
     */
    public function resourceContent()
    {
        return $this->belongsTo(ResourceContent::class);
    }
}