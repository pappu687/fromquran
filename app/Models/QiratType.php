<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QiratType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'recitations_count',
    ];

    protected $casts = [
        'recitations_count' => 'integer',
    ];

    /**
     * Get the audio recitations for this Qirat type.
     */
    public function audioRecitations(): HasMany
    {
        return $this->hasMany(AudioRecitation::class);
    }
}