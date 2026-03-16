<?php

return [
    'enabled' => (bool) env('TURNSTILE_ENABLED', false),

    'site_key' => env('TURNSTILE_SITE_KEY'),

    'secret_key' => env('TURNSTILE_SECRET_KEY'),

    'verify_url' => env('TURNSTILE_VERIFY_URL', 'https://challenges.cloudflare.com/turnstile/v0/siteverify'),
];
