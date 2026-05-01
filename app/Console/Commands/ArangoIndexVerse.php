<?php

namespace App\Console\Commands;

use App\Services\Arango\QuranGraphIndexer;
use Illuminate\Console\Command;

class ArangoIndexVerse extends Command
{
    protected $signature = 'arango:index-verse {verseId}';

    protected $description = 'Index a specific verse into ArangoDB';

    public function handle(QuranGraphIndexer $indexer): int
    {
        $verseId = (int) $this->argument('verseId');

        $this->info("Indexing verse {$verseId}...");

        try {
            $indexer->indexVerse($verseId);
            $this->info('Verse index complete.');
        } catch (\Exception $e) {
            $this->error('Indexing failed: '.$e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
