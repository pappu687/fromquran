<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class CloudflarePurgeCache extends Command
{
    protected $signature = 'cloudflare:purge
                            {--everything : Purge entire zone cache}
                            {--url=* : One or more full URLs to purge}
                            {--tag=* : One or more cache tags to purge}';

    protected $description = 'Purge Cloudflare cache';

    public function handle(): int
    {
        $zoneId = config('services.cloudflare.zone_id');
        $token  = config('services.cloudflare.token');

        if (!$zoneId || !$token) {
            $this->error('Missing Cloudflare zone_id or token.');
            return self::FAILURE;
        }

        $payload = null;

        if ($this->option('everything')) {
            $payload = ['purge_everything' => true];
        } elseif ($urls = $this->option('url')) {
            $payload = ['files' => array_values($urls)];
        } elseif ($tags = $this->option('tag')) {
            $payload = ['tags' => array_values($tags)];
        } else {
            $this->error('Provide --everything, --url=..., or --tag=...');
            return self::FAILURE;
        }

        $response = Http::withToken($token)
            ->acceptJson()
            ->post("https://api.cloudflare.com/client/v4/zones/{$zoneId}/purge_cache", $payload);

        if ($response->successful() && data_get($response->json(), 'success') === true) {
            $this->info('Cloudflare cache purged successfully.');
            return self::SUCCESS;
        }

        $this->error('Cloudflare purge failed.');
        $this->line($response->body());

        return self::FAILURE;
    }
}
