<?php

namespace App\Console\Commands;

use App\Services\Arango\QuranGraphIndexer;
use Illuminate\Console\Command;

class ArangoIndexAll extends Command
{
    protected $signature = 'arango:index-all';

    protected $description = 'Index all Quran data into ArangoDB';

    public function handle(QuranGraphIndexer $indexer): int
    {
        $this->info('Starting full ArangoDB index...');
        $this->warn('This may take 10-30+ minutes on first run.');

        $indexer->setProgressCallback(function (string $message) {
            $this->info("  → {$message}");
        });

        try {
            $indexer->indexAll();
            $this->info('Full index complete.');
        } catch (\Exception $e) {
            $this->error('Indexing failed: '.$e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
