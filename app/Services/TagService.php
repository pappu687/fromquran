<?php

namespace App\Services;

use App\Models\Tag;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class TagService
{
    /**
     * Resolve mixed tag payloads into a normalized collection.
     */
    public function normalizePayload(array $tags): Collection
    {
        return collect($tags)
            ->map(function ($tag) {
                if (is_string($tag)) {
                    $tag = ['name' => $tag];
                }

                $name = preg_replace('/\s+/', ' ', trim((string) ($tag['name'] ?? '')));
                $type = Str::lower(trim((string) ($tag['type'] ?? 'general')));
                $slugSource = trim((string) ($tag['slug'] ?? ''));
                $slug = Str::slug($slugSource !== '' ? $slugSource : $name);

                return [
                    'name' => $name,
                    'slug' => $slug,
                    'type' => $type !== '' ? $type : 'general',
                ];
            })
            ->filter(fn (array $tag) => $tag['name'] !== '' && $tag['slug'] !== '')
            ->unique(fn (array $tag) => "{$tag['type']}::{$tag['slug']}")
            ->values();
    }

    /**
     * Create or reuse tags and sync them to the taggable model.
     */
    public function syncTags(Model $taggable, array $tags): void
    {
        $normalizedTags = $this->normalizePayload($tags);

        if ($normalizedTags->isEmpty()) {
            $taggable->tags()->sync([]);
            return;
        }

        $tagIds = $normalizedTags
            ->values()
            ->map(function (array $tag, int $index) {
                return [
                    'id' => Tag::firstOrCreate(
                        [
                            'slug' => $tag['slug'],
                            'type' => $tag['type'],
                        ],
                        [
                            'name' => $tag['name'],
                            'status' => Tag::STATUS_ACTIVE,
                        ],
                    )->id,
                    'display_order' => $index,
                ];
            });

        $taggable->tags()->sync(
            $tagIds->mapWithKeys(fn (array $tag) => [
                $tag['id'] => ['display_order' => $tag['display_order']],
            ])->all(),
        );
    }
}
