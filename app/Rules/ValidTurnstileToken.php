<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;

class ValidTurnstileToken implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! config('turnstile.enabled')) {
            return;
        }

        if (! $value || ! config('turnstile.secret_key')) {
            $fail('Verification Failed, please try again.');
            return;
        }

        $response = Http::asForm()->post(config('turnstile.verify_url'), [
            'secret' => config('turnstile.secret_key'),
            'response' => $value,
            'remoteip' => request()->ip(),
        ]);

        if (! $response->ok() || $response->json('success') !== true) {
            $fail('Verification Failed, please try again.');
        }
    }
}
