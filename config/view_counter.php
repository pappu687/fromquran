<?php

return [
    'enabled' => env('VIEW_COUNTER_ENABLED', true),

    'cache_store' => env('VIEW_COUNTER_CACHE_STORE', env('CACHE_STORE')),

    'dedupe_ttl_hours' => (int) env('VIEW_COUNTER_DEDUPE_TTL_HOURS', 12),

    'bot_filter_enabled' => env('VIEW_COUNTER_BOT_FILTER_ENABLED', true),

    'trust_cloudflare_headers' => env('VIEW_COUNTER_TRUST_CLOUDFLARE_HEADERS', true),

    'cloudflare_bot_score_block_threshold' => (int) env('VIEW_COUNTER_CF_BOT_SCORE_BLOCK_THRESHOLD', 30),

    'cloudflare_bot_score_suspicious_threshold' => (int) env('VIEW_COUNTER_CF_BOT_SCORE_SUSPICIOUS_THRESHOLD', 45),

    'use_turnstile_for_suspicious_requests' => env('VIEW_COUNTER_USE_TURNSTILE_FOR_SUSPICIOUS_REQUESTS', false),

    'min_visible_ms' => (int) env('VIEW_COUNTER_MIN_VISIBLE_MS', 2000),

    'visitor_cookie_name' => env('VIEW_COUNTER_VISITOR_COOKIE_NAME', 'fq_visitor'),

    'visitor_cookie_ttl_minutes' => (int) env('VIEW_COUNTER_VISITOR_COOKIE_TTL_MINUTES', 60 * 24 * 365),

    'throttle_per_minute' => (int) env('VIEW_COUNTER_THROTTLE_PER_MINUTE', 60),

    'event_logging_enabled' => env('VIEW_COUNTER_EVENT_LOGGING_ENABLED', true),

    'event_retention_days' => (int) env('VIEW_COUNTER_EVENT_RETENTION_DAYS', 30),

    'suspicious_user_agents' => [
        'bot',
        'crawler',
        'spider',
        'curl',
        'wget',
        'python-requests',
        'python-urllib',
        'go-http-client',
        'httpclient',
        'headless',
        'phantomjs',
        'scrapy',
        'node-fetch',
        'axios',
        'postmanruntime',
    ],
];
