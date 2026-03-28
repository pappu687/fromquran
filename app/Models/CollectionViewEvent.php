<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CollectionViewEvent extends Model
{
    use Prunable;

    protected $fillable = [
        'collection_id',
        'event_key',
        'visitor_hash',
        'ip_hash',
        'user_agent_hash',
        'session_id',
        'viewed_at',
        'counted_at',
        'is_bot',
        'metadata',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
        'counted_at' => 'datetime',
        'is_bot' => 'boolean',
        'metadata' => 'array',
    ];

    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }

    public function prunable()
    {
        return static::query()->where(
            'viewed_at',
            '<',
            now()->subDays(config('view_counter.event_retention_days', 30)),
        );
    }
}
