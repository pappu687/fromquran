<?php

namespace App\Jobs;

use App\Models\Chapter;
use App\Models\ResourceType;
use App\Models\UserChapterResource;
use App\Services\ResourceScraper\SearchAdapterFactory;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ScrapeChapterYoutubeVideosJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Chapter $chapter
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        sleep(rand(1, 3));

        $resourceType = ResourceType::findBySlug('youtube_tafseer');

        if (! $resourceType) {
            Log::error('youtube_tafseer resource type not found. Skipping YouTube scrape job.');

            return;
        }

        $adapter = SearchAdapterFactory::make($resourceType->slug);

        if (! $adapter) {
            Log::error('No search adapter found for youtube_tafseer. Skipping YouTube scrape job.');

            return;
        }

        $searchTerm = 'Surah ' . $this->chapter->name_roman . ' Tafsir';

        try {
            $results = $adapter->search($searchTerm, 20);
        } catch (\Throwable $e) {
            Log::error("Failed to fetch YouTube videos for chapter {$this->chapter->id}: " . $e->getMessage());

            return;
        }

        $existingUrls = UserChapterResource::query()
            ->where('chapter_id', $this->chapter->id)
            ->where('resource_type_id', $resourceType->id)
            ->pluck('resource_url')
            ->filter()
            ->all();

        $knownUrls = array_fill_keys($existingUrls, true);
        $resultsCount = count($results);
        $addedCount = 0;

        foreach ($results as $result) {
            $url = $result['url'] ?? null;
            $title = trim((string) ($result['title'] ?? ''));

            if (! $url || isset($knownUrls[$url]) || $title === '') {
                continue;
            }

            UserChapterResource::create([
                'chapter_id' => $this->chapter->id,
                'resource_type_id' => $resourceType->id,
                'resource_url' => $url,
                'user_id' => 2,
                'resource_title' => $title,
                'thumbnail_url' => $result['thumbnail_url'] ?? null,
                'comment' => $result['description'] ?? null,
                'status' => 'pending',
            ]);

            $knownUrls[$url] = true;
            $addedCount++;
        }

        $message = sprintf(
            "[%s] Scraped YouTube for Chapter %d (%s) using term '%s': Found %d results, added %d new URLs.\n",
            now()->format('Y-m-d H:i:s'),
            $this->chapter->chapter_number,
            $this->chapter->name_simple,
            $searchTerm,
            $resultsCount,
            $addedCount
        );

        echo $message;
        Log::info(trim($message));
    }
}
