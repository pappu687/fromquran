<?php

namespace App\Console\Commands;

use App\Services\Arango\QuranGraphIndexer;
use Illuminate\Console\Command;

class ArangoIndexChapter extends Command
{
    protected $signature = 'arango:index-chapter {chapterId}';

    protected $description = 'Index a specific chapter into ArangoDB';

    public function handle(QuranGraphIndexer $indexer): int
    {
        $chapterId = (int) $this->argument('chapterId');

        $this->info("Indexing chapter {$chapterId}...");

        try {
            $indexer->indexChapter($chapterId);
            $this->info('Chapter index complete.');
        } catch (\Exception $e) {
            $this->error('Indexing failed: '.$e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
