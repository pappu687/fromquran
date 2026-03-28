<?php

namespace App\Jobs;

use App\Models\Chapter;
use App\Models\UserChapterResource;
use App\Services\ResourceScraper\Adapters\SunnahSearchAdapter;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ScrapeChapterHadithsJob implements ShouldQueue
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
        // 1. Random gap between 1-3 seconds as requested
        sleep(rand(1, 3));

        $resourceTypeId = 5; // Hadith resource type

        // 2. Check if a row already exists in user_chapter_resources
        $exists = UserChapterResource::where('chapter_id', $this->chapter->id)
            ->where('resource_type_id', $resourceTypeId)
            ->exists();

        if ($exists) {
            Log::info("Hadiths already exist for chapter {$this->chapter->id} ({$this->chapter->name_simple}). Skipping.");
            return;
        }

        // 3. Search sunnah.com using adapter
        $searchTerm = "Surah " . $this->chapter->name_roman;
        $adapter = new SunnahSearchAdapter();

        try {
            $results = $adapter->search($searchTerm, 100); // Increased limit to 100
        } catch (\Exception $e) {
            Log::error("Failed to fetch hadiths for chapter {$this->chapter->id}: " . $e->getMessage());
            return;
        }

        $resultsCount = count($results);
        $addedCount = 0;

        // 4. Filter entries to ensure the description actually mentions the Surah
        foreach ($results as $result) {
            $title = $result['title'] ?? '';
            $description = $result['description'] ?? '';
            $normalizedDesc = strtolower($description);
            $normalizedTitle = strtolower($title);

            // Allow matching "Surah Hud", "Surah Al-Hud", or simplifications
            $expectedMatches = [
                strtolower("Surah " . $this->chapter->name_roman),
                strtolower("Surah " . $this->chapter->name_simple),
                strtolower("Surah Al-" . $this->chapter->name_roman),
                strtolower("Surah Al-" . $this->chapter->name_simple),
            ];

            $isMatched = false;
            foreach ($expectedMatches as $matchStr) {
                if (str_contains($normalizedDesc, $matchStr) || str_contains($normalizedTitle, $matchStr)) {
                    $isMatched = true;
                    break;
                }
            }

            if ($isMatched) {
                // 5. Add to user_chapter_resources
                UserChapterResource::create([
                    'chapter_id' => $this->chapter->id,
                    'resource_type_id' => $resourceTypeId,
                    'resource_url' => $result['url'],
                    'user_id' => 2,
                    'resource_title' => $result['title'],
                    'thumbnail_url' => $result['thumbnail_url'] ?? null,
                    'comment' => $result['description'] ?? null,
                    'status' => 'pending',
                ]);
                $addedCount++;
            }
        }

        $message = sprintf(
            "[%s] Scraped Chapter %d (%s) using term '%s': Found %d results, matched %d.\n",
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
