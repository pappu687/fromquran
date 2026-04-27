<?php

namespace Tests\Feature;

use App\Services\QuranFoundationClient;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuranFoundationClientTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Config::set('cache.default', 'array');
        Config::set('quran-foundation.environment', 'prelive');
        Config::set('quran-foundation.client_id', 'test-client-id');
        Config::set('quran-foundation.client_secret', 'test-client-secret');
        Config::set('quran-foundation.auth_base_url', 'https://prelive-oauth2.quran.foundation');
        Config::set('quran-foundation.api_base_url', 'https://apis-prelive.quran.foundation/content/api/v4');
        Config::set('quran-foundation.cache_store', 'array');
        Config::set('quran-foundation.timeout_seconds', 5);

        Cache::store('array')->flush();
    }

    public function test_token_is_cached(): void
    {
        Http::fake([
            'https://prelive-oauth2.quran.foundation/oauth2/token' => Http::response([
                'access_token' => 'cached-token',
                'expires_in' => 3600,
            ]),
            'https://apis-prelive.quran.foundation/content/api/v4/resources/recitations*' => Http::response([
                'recitations' => [],
            ]),
        ]);

        $client = app(QuranFoundationClient::class);

        $client->get('/resources/recitations');
        $client->get('/resources/recitations');

        Http::assertSentCount(3);
        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'https://prelive-oauth2.quran.foundation/oauth2/token';
        });
    }

    public function test_token_request_uses_client_credentials_form_payload(): void
    {
        Http::fake([
            'https://prelive-oauth2.quran.foundation/oauth2/token' => Http::response([
                'access_token' => 'form-token',
                'expires_in' => 3600,
            ]),
        ]);

        $token = app(QuranFoundationClient::class)->getAccessToken();

        $this->assertSame('form-token', $token);

        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'https://prelive-oauth2.quran.foundation/oauth2/token'
                && $request->method() === 'POST'
                && $request->hasHeader('Authorization', 'Basic '.base64_encode('test-client-id:test-client-secret'))
                && str_contains($request->header('Content-Type')[0] ?? '', 'application/x-www-form-urlencoded')
                && $request['grant_type'] === 'client_credentials'
                && $request['scope'] === 'content';
        });
    }

    public function test_token_refreshes_before_expiry(): void
    {
        $tokenRequestCount = 0;

        Http::fake(function (Request $request) use (&$tokenRequestCount) {
            if ($request->url() === 'https://prelive-oauth2.quran.foundation/oauth2/token') {
                $tokenRequestCount++;

                return Http::response([
                    'access_token' => 'token-'.$tokenRequestCount,
                    'expires_in' => 31,
                ]);
            }

            return Http::response(['recitations' => []]);
        });

        $client = app(QuranFoundationClient::class);

        $client->get('/resources/recitations');
        $this->travel(2)->seconds();
        $client->get('/resources/recitations');

        $this->assertSame(2, $tokenRequestCount);
    }

    public function test_401_clears_token_and_retries_once(): void
    {
        $tokenRequestCount = 0;
        $apiRequestCount = 0;

        Http::fake(function (Request $request) use (&$tokenRequestCount, &$apiRequestCount) {
            if ($request->url() === 'https://prelive-oauth2.quran.foundation/oauth2/token') {
                $tokenRequestCount++;

                return Http::response([
                    'access_token' => 'token-'.$tokenRequestCount,
                    'expires_in' => 3600,
                ]);
            }

            $apiRequestCount++;

            if ($apiRequestCount === 1) {
                return Http::response([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            return Http::response(['recitations' => []]);
        });

        $response = app(QuranFoundationClient::class)->get('/resources/recitations');

        $this->assertTrue($response->successful());
        $this->assertSame(2, $tokenRequestCount);
        $this->assertSame(2, $apiRequestCount);
    }

    public function test_react_facing_routes_do_not_expose_tokens_or_secrets(): void
    {
        Http::fake([
            'https://prelive-oauth2.quran.foundation/oauth2/token' => Http::response([
                'access_token' => 'sensitive-access-token',
                'expires_in' => 3600,
            ]),
            'https://apis-prelive.quran.foundation/content/api/v4/resources/translations*' => Http::response([
                'translations' => [
                    ['id' => 20, 'name' => 'English'],
                ],
            ]),
        ]);

        $response = $this->getJson('/api/qf/resources/translations');

        $response->assertOk()
            ->assertJsonPath('translations.0.id', 20);

        $content = $response->getContent();

        $this->assertStringNotContainsString('sensitive-access-token', $content);
        $this->assertStringNotContainsString('test-client-secret', $content);
    }
}
