<?php

namespace App\Console\Commands;

use App\Jobs\ScrapeChapterYoutubeVideosJob;
use App\Models\Chapter;
use Illuminate\Console\Command;

class ScrapeAllChapterYoutubeVideosCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scrape:chapter-youtube {chapter_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatches jobs to scrape YouTube tafseer videos for all 114 chapters (or a specific chapter if provided)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $chapterId = $this->argument('chapter_id');

        if ($chapterId) {
            $this->info("Starting to dispatch YouTube scraping job for chapter {$chapterId}...");

            $chapters = Chapter::query()
                ->where('id', $chapterId)
                ->orWhere('chapter_number', $chapterId)
                ->orderBy('chapter_number')
                ->get();

            if ($chapters->isEmpty()) {
                $this->error("Chapter {$chapterId} not found in the database.");

                return self::FAILURE;
            }
        } else {
            $this->info('Starting to dispatch YouTube scraping jobs for all 114 chapters...');
            $chapters = Chapter::query()->orderBy('chapter_number')->get();
        }

        foreach ($chapters as $index => $chapter) {
            ScrapeChapterYoutubeVideosJob::dispatch($chapter)
                ->delay(now()->addSeconds($index * 2));

            $this->components->task(
                sprintf('Queued Chapter %d: %s', $chapter->chapter_number, $chapter->name_simple)
            );
        }

        $this->info('All jobs dispatched. Ensure queue worker is running!');

        return self::SUCCESS;
    }
}
