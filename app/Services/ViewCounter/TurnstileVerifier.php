<?php

namespace App\Services\ViewCounter;

use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Request;

class TurnstileVerifier
{
    public function __construct(
        protected HttpFactory $http,
    ) {
    }

    public function passes(Request $request): bool
    {
        $token = (string) $request->input('turnstile_token', $request->input('cf-turnstile-response', ''));

        if ($token === '' || ! config('turnstile.secret_key')) {
            return false;
        }

        $response = $this->http->asForm()->post(config('turnstile.verify_url'), [
            'secret' => config('turnstile.secret_key'),
            'response' => $token,
            'remoteip' => $request->ip(),
        ]);

        return (bool) $response->json('success', false);
    }
}
