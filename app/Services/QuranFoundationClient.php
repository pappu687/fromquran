<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class QuranFoundationClient
{
    private const TOKEN_CACHE_PREFIX = 'quran_foundation.token';

    private const TOKEN_LOCK_PREFIX = 'quran_foundation.token_lock';

    public function get(string $path, array $query = []): Response
    {
        return $this->requestWithTokenRetry($path, $query);
    }

    public function forgetToken(): void
    {
        $this->cache()->forget($this->tokenCacheKey());
    }

    public function getAccessToken(): string
    {
        $cachedToken = $this->validCachedToken();

        if ($cachedToken !== null) {
            return $cachedToken;
        }

        $lock = $this->cache()->lock($this->tokenLockKey(), 10);

        return $lock->block(5, function (): string {
            $cachedToken = $this->validCachedToken();

            if ($cachedToken !== null) {
                return $cachedToken;
            }

            return $this->fetchAndCacheToken();
        });
    }

    private function requestWithTokenRetry(string $path, array $query = []): Response
    {
        $response = $this->sendGetRequest($path, $query, $this->getAccessToken());

        if ($response->status() !== 401) {
            return $response;
        }

        $this->forgetToken();

        return $this->sendGetRequest($path, $query, $this->getAccessToken());
    }

    private function sendGetRequest(string $path, array $query, string $accessToken): Response
    {
        return Http::acceptJson()
            ->timeout($this->timeoutSeconds())
            ->withHeaders([
                'x-auth-token' => $accessToken,
                'x-client-id' => $this->clientId(),
            ])
            ->get($this->apiUrl($path), $query);
    }

    private function fetchAndCacheToken(): string
    {
        $response = Http::asForm()
            ->timeout($this->timeoutSeconds())
            ->withBasicAuth($this->clientId(), $this->clientSecret())
            ->post($this->authUrl('/oauth2/token'), [
                'grant_type' => 'client_credentials',
                'scope' => (string) config('quran-foundation.token_scope'),
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Quran Foundation token request failed with status '.$response->status());
        }

        $payload = $response->json();
        $accessToken = data_get($payload, 'access_token');
        $expiresIn = (int) data_get($payload, 'expires_in', config('quran-foundation.token_ttl_seconds'));

        if (! is_string($accessToken) || $accessToken === '') {
            throw new RuntimeException('Quran Foundation token response did not include an access token.');
        }

        $expiresAt = now()->addSeconds(min($expiresIn, (int) config('quran-foundation.token_ttl_seconds')))->timestamp;

        $this->cache()->put($this->tokenCacheKey(), [
            'access_token' => $accessToken,
            'expires_at' => $expiresAt,
        ], $expiresAt - now()->timestamp);

        return $accessToken;
    }

    private function validCachedToken(): ?string
    {
        $cached = $this->cache()->get($this->tokenCacheKey());

        if (! is_array($cached)) {
            return null;
        }

        $accessToken = $cached['access_token'] ?? null;
        $expiresAt = (int) ($cached['expires_at'] ?? 0);
        $refreshAt = $expiresAt - (int) config('quran-foundation.token_refresh_buffer_seconds');

        if (! is_string($accessToken) || $accessToken === '' || $refreshAt <= now()->timestamp) {
            return null;
        }

        return $accessToken;
    }

    private function apiUrl(string $path): string
    {
        return rtrim((string) config('quran-foundation.api_base_url'), '/').'/'.ltrim($path, '/');
    }

    private function authUrl(string $path): string
    {
        return rtrim((string) config('quran-foundation.auth_base_url'), '/').'/'.ltrim($path, '/');
    }

    private function tokenCacheKey(): string
    {
        return self::TOKEN_CACHE_PREFIX.'.'.config('quran-foundation.environment').'.'.sha1($this->clientId());
    }

    private function cache(): mixed
    {
        return Cache::store((string) config('quran-foundation.cache_store'));
    }

    private function tokenLockKey(): string
    {
        return self::TOKEN_LOCK_PREFIX.'.'.config('quran-foundation.environment').'.'.sha1($this->clientId());
    }

    private function clientId(): string
    {
        $clientId = config('quran-foundation.client_id');

        if (! is_string($clientId) || $clientId === '') {
            throw new RuntimeException('QF_CLIENT_ID is not configured.');
        }

        return $clientId;
    }

    private function clientSecret(): string
    {
        $clientSecret = config('quran-foundation.client_secret');

        if (! is_string($clientSecret) || $clientSecret === '') {
            throw new RuntimeException('QF_CLIENT_SECRET is not configured.');
        }

        return $clientSecret;
    }

    private function timeoutSeconds(): int
    {
        return (int) config('quran-foundation.timeout_seconds');
    }
}
