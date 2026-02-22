<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class IndexAllToSolr extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'solr:index-all';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run all Solr indexers sequentially';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting all Solr indexers...');

        $commands = [
            'solr:index-verses',
            'solr:index-tafsir',
            'solr:index-resources',
        ];

        foreach ($commands as $command) {
            $this->newLine();
            $this->info("Running {$command}...");
            $this->call($command);
        }

        $this->newLine();
        $this->info('All Solr indexers completed successfully.');

        return self::SUCCESS;
    }
}
