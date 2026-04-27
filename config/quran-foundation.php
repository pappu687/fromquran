<?php

$environment = env('QF_ENV', 'prelive');

return [
    'environment' => $environment,

    'client_id' => env('QF_CLIENT_ID'),
    'client_secret' => env('QF_CLIENT_SECRET'),

    'auth_base_url' => $environment === 'production'
        ? 'https://oauth2.quran.foundation'
        : 'https://prelive-oauth2.quran.foundation',

    'api_base_url' => $environment === 'production'
        ? 'https://apis.quran.foundation/content/api/v4'
        : 'https://apis-prelive.quran.foundation/content/api/v4',

    'token_scope' => 'content',
    'token_ttl_seconds' => 3600,
    'token_refresh_buffer_seconds' => 30,
    'cache_store' => env('QF_CACHE_STORE', 'file'),
    'timeout_seconds' => env('QF_TIMEOUT_SECONDS', 15),
    'verify_chapter_reciter_id' => env('QF_VERIFY_CHAPTER_RECITER_ID', 7),
    'verify_chapter_id' => env('QF_VERIFY_CHAPTER_ID', 1),
];
