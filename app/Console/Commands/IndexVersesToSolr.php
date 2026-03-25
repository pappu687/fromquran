<?php

namespace App\Console\Commands;

use App\Services\Solr\VerseIndexer;
use Illuminate\Console\Command;

class IndexVersesToSolr extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'solr:index-verses
                            {--verse-id=* : Reindex only these verse IDs}
                            {--chapter-id=* : Reindex all verses in these chapter IDs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Index all verses and their translations into Solr using Solarium';

    public function __construct(private readonly VerseIndexer $verseIndexer)
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
                $this->info("Reindexing verse {$verseId} into Solr...");
                $this->verseIndexer->reindexVerse($verseId);
            }
        }

        if ($chapterIds !== []) {
            foreach ($chapterIds as $chapterId) {
                $this->info("Reindexing chapter {$chapterId} verses into Solr...");
                $this->verseIndexer->reindexChapter($chapterId);
            }
        }

        if ($verseIds === [] && $chapterIds === []) {
            $this->info("Reindexing all verses into Solr core '".config('solr.endpoint.localhost.core')."'");
            $this->verseIndexer->reindexAll();
        }

        $this->info('Verses indexed into Solr successfully.');

        return self::SUCCESS;
    }
}
