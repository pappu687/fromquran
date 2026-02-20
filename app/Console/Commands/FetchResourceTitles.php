<?php

namespace App\Console\Commands;

use App\Models\UserVerseResource;
use App\Services\TitleCrawlObserver;
use Illuminate\Console\Command;
use Spatie\Crawler\Crawler;
use Spatie\Crawler\CrawlProfiles\CrawlInternalUrls;

class FetchResourceTitles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'resources:fetch-titles 
                            {--limit= : Limit the number of records to process}
                            {--chunk=100 : Number of records to chunk}
                            {--delay= : Delay in milliseconds between requests}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch titles for resource URLs and update the resource_title field';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $limit = $this->option('limit');
        $chunkSize = (int) $this->option('chunk');
        $delay = $this->option('delay');

        $query = UserVerseResource::query()
            ->where(function ($q) {
                $q->whereNull('resource_title')
                  ->orWhere('resource_title', '');
            });

        if ($limit) {
            $query->limit((int) $limit);
            $total = (int) $limit;
        } else {
            $total = $query->count();
        }

        if ($total === 0) {
            $this->info('No resources found without a title.');
            return Command::SUCCESS;
        }

        $this->info("Processing {$total} resources...");
        $progressBar = $this->output->createProgressBar($total);
        $progressBar->start();

        $query->chunk($chunkSize, function ($resources) use ($progressBar, $delay) {
            foreach ($resources as $resource) {
                if (empty($resource->resource_url)) {
                    $progressBar->advance();
                    continue;
                }

                try {
                    // We use spatie/crawler to fetch the title.
                    // Since we are fetching individual URLs, we create a crawler instance for each.
                    // This ensures we only crawl the specific page and not the whole site.
                    Crawler::create()
                        ->setCrawlObserver(new TitleCrawlObserver($resource))
                        ->setMaximumDepth(0) // Only crawl the initial URL
                        ->setTotalCrawlLimit(1) // Just one page
                        ->startCrawling($resource->resource_url);

                    if ($delay) {
                        usleep((int) $delay * 1000);
                    }
                } catch (\Exception $e) {
                    $this->error("\nFailed to fetch title for {$resource->resource_url}: " . $e->getMessage());
                }

                $progressBar->advance();
            }
        });

        $progressBar->finish();
        $this->newLine();
        $this->info('Finished processing resource titles.');

        return Command::SUCCESS;
    }
}
