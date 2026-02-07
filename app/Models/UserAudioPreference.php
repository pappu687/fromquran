<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAudioPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reciter_id',
        'audio_recitation_id',
        'autoplay',
        'repeat_verse',
        'repeat_chapter',
    ];

    protected $casts = [
        'autoplay' => 'boolean',
        'repeat_verse' => 'boolean',
        'repeat_chapter' => 'boolean',
    ];

    /**
     * Get the user that owns the audio preferences.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the selected reciter.
     */
    public function reciter(): BelongsTo
    {
        return $this->belongsTo(Reciter::class);
    }

    /**
     * Get the selected audio recitation.
     */
    public function audioRecitation(): BelongsTo
    {
        return $this->belongsTo(AudioRecitation::class);
    }

    /**
     * Get or create preferences for a user.
     */
    public static function forUser(int $userId): self
    {
        return static::firstOrCreate(
            ['user_id' => $userId],
            [
                'autoplay' => true,
                'repeat_verse' => false,
                'repeat_chapter' => false,
            ]
        );
    }
}
