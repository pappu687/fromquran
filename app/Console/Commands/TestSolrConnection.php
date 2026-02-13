<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Solarium\Client;
use Solarium\Exception\HttpException;

class TestSolrConnection extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'solr:test-connection';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Solr connectivity and show the effective Solr configuration';

    public function __construct(protected Client $client)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $config = config('solr.endpoint.localhost');

        $this->info('Solr configuration (from config/solr.php and .env):');
        $this->line('  host : ' . ($config['host'] ?? ''));
        $this->line('  port : ' . ($config['port'] ?? ''));
        $this->line('  path : ' . ($config['path'] ?? ''));
        $this->line('  core : ' . ($config['core'] ?? ''));
        $this->newLine();

        try {
            $this->info('Pinging Solr...');
            $ping = $this->client->createPing();
            $result = $this->client->ping($ping);

            $this->info('✅ Solr ping successful.');
            $this->line('Status code: ' . $result->getStatus());

            return self::SUCCESS;
        } catch (HttpException $e) {
            $this->error('Solr HTTP error: ' . $e->getMessage() . ' (status ' . $e->getCode() . ')');
            $this->newLine();
            $this->line('Response body (truncated):');
            $this->line(substr((string) $e->getBody(), 0, 1000));

            return self::FAILURE;
        } catch (\Throwable $e) {
            $this->error('Failed to connect to Solr: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}

