<?php

namespace App\Console\Commands;

use App\Jobs\ScrapeChapterHadithsJob;
use App\Models\Chapter;
use Illuminate\Console\Command;

class ScrapeAllChapterHadithsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scrape:chapter-hadiths {chapter_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatches jobs to scrape related hadiths from sunnah.com for all 114 chapters (or a specific chapter if provided)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $chapterId = $this->argument('chapter_id');

        if ($chapterId) {
            $this->info("Starting to dispatch hadith scraping job for chapter {$chapterId}...");
            // Allow querying by chapter_id or chapter_number
            $chapters = Chapter::where('id', $chapterId)->orWhere('chapter_number', $chapterId)->get();
            
            if ($chapters->isEmpty()) {
                $this->error("Chapter {$chapterId} not found in the database.");
                return;
            }
        } else {
            $this->info('Starting to dispatch hadith scraping jobs for all 114 chapters...');
            $chapters = Chapter::orderBy('chapter_number')->get();
        }

        foreach ($chapters as $index => $chapter) {
            // We additionally delay dispatch so the queue isn't flooded instantly
            ScrapeChapterHadithsJob::dispatch($chapter)
                ->delay(now()->addSeconds($index * 2));
                
            $this->components->task(
                sprintf("Queued Chapter %d: %s", $chapter->chapter_number, $chapter->name_simple)
            );
        }

        $this->info('All jobs dispatched. Ensure queue worker is running!');
    }
}
