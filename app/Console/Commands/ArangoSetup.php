<?php

namespace App\Console\Commands;

use App\Services\Arango\QuranGraphSchemaManager;
use Illuminate\Console\Command;

class ArangoSetup extends Command
{
    protected $signature = 'arango:setup {--drop : Drop existing collections before recreating}';

    protected $description = 'Setup ArangoDB collections for Quran graph';

    public function handle(QuranGraphSchemaManager $schemaManager): int
    {
        if ($this->option('drop')) {
            if (! $this->confirm('This will drop all ArangoDB collections. Are you sure?')) {
                return self::FAILURE;
            }

            $this->info('Dropping existing collections...');
            $schemaManager->dropAll();
        }

        $this->info('Setting up ArangoDB collections...');
        $schemaManager->setup();
        $this->info('ArangoDB setup complete.');

        return self::SUCCESS;
    }
}
