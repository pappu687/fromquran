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
        $email  = config('services.cloudflare.email');
        $apiKey = config('services.cloudflare.api_key');

        if (!$zoneId) {
            $this->error('Missing Cloudflare zone_id.');
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

        $this->info("Purging Cloudflare cache for Zone: " . substr($zoneId, 0, 4) . "...");

        $request = Http::acceptJson();

        if ($token) {
            $request->withToken(trim($token));
            $this->comment("Using API Token (Bearer Auth)");
        } elseif ($email && $apiKey) {
            $request->withHeaders([
                'X-Auth-Email' => trim($email),
                'X-Auth-Key' => trim($apiKey),
            ]);
            $this->comment("Using Global API Key (X-Auth Auth)");
        } else {
            $this->error('Missing Cloudflare credentials (API Token or Email+Global Key).');
            return self::FAILURE;
        }

        $response = $request->post("https://api.cloudflare.com/client/v4/zones/{$zoneId}/purge_cache", $payload);

        if ($response->successful() && data_get($response->json(), 'success') === true) {
            $this->info('Cloudflare cache purged successfully.');
            return self::SUCCESS;
        }

        $this->error('Cloudflare purge failed.');
        $this->line("Status Code: " . $response->status());
        $this->line("Response: " . $response->body());

        if ($response->status() === 403 || $response->status() === 401) {
            $this->warn("\nPossible causes:");
            $this->line("1. Invalid API Token or Global API Key.");
            $this->line("2. API Token lacks 'Cache Purge' permissions for this zone.");
            $this->line("3. Zone ID is incorrect or not associated with this account.");
            $this->line("4. Your token has IP restrictions that prevent this request.");
        }

        return self::FAILURE;
    }
}
