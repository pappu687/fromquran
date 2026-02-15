<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TafseerBook extends Model
{
    use HasFactory;

    protected $table = 'tafseer_books';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'display_order',
    ];

    protected $casts = [
        'display_order' => 'integer',
    ];

    /**
     * Get the tafsir contents for this book.
     */
    public function tafseerContents(): HasMany
    {
        return $this->hasMany(TafseerContent::class, 'tafsir_id');
    }

    /**
     * Scope a query to order by display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order');
    }
}
