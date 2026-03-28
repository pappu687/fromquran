<?php

namespace App\Jobs;

use App\Models\Collection;
use App\Models\CollectionViewEvent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\DatabaseManager;
use Illuminate\Foundation\Queue\Queueable;

class PersistCollectionView implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $eventId,
    ) {
    }

    public function handle(DatabaseManager $database): void
    {
        $database->transaction(function () {
            $event = CollectionViewEvent::query()
                ->whereKey($this->eventId)
                ->lockForUpdate()
                ->first();

            if (! $event || $event->counted_at !== null || $event->is_bot) {
                return;
            }

            Collection::query()
                ->whereKey($event->collection_id)
                ->increment('views_count');

            $event->forceFill([
                'counted_at' => now(),
            ])->save();
        });
    }
}
