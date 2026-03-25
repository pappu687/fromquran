<?php

namespace App\Console\Commands;

use App\Services\Solr\ResourceIndexer;
use Illuminate\Console\Command;

class IndexResourcesToSolr extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'solr:index-resources
                            {--verse-id=* : Reindex only resources/translations for these verse IDs}
                            {--chapter-id=* : Reindex only resources/translations for these chapter IDs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Index user resources and translations into Solr in a unified format';

    public function __construct(private readonly ResourceIndexer $resourceIndexer)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $verseIds = array_values(array_unique(array_map('intval', $this->option('verse-id'))));
        $chapterIds = array_values(array_unique(array_map('intval', $this->option('chapter-id'))));

        if ($verseIds !== []) {
            foreach ($verseIds as $verseId) {
                $this->info("Reindexing Solr resources for verse {$verseId}...");
                $this->resourceIndexer->reindexVerse($verseId);
            }
        }

        if ($chapterIds !== []) {
            foreach ($chapterIds as $chapterId) {
                $this->info("Reindexing Solr resources for chapter {$chapterId}...");
                $this->resourceIndexer->reindexChapter($chapterId);
            }
        }

        if ($verseIds === [] && $chapterIds === []) {
            $this->info("Indexing resources into Solr core '".config('solr.endpoint.localhost.core')."'");
            $this->resourceIndexer->reindexAll();
        }

        $this->newLine();
        $this->info('Resources indexed into Solr successfully.');

        return self::SUCCESS;
    }
}
