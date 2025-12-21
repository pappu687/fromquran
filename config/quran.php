<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Quran API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the Quran API service
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Cache Duration
    |--------------------------------------------------------------------------
    |
    | How long to cache Quran data in seconds (default: 1 hour)
    |
    */
    'cache_ttl' => env('QURAN_CACHE_TTL', 3600),

    /*
    |--------------------------------------------------------------------------
    | Default Edition
    |--------------------------------------------------------------------------
    |
    | Default translation edition to use
    |
    */
    'default_edition' => env('QURAN_DEFAULT_EDITION', 'en.sahih'),

    /*
    |--------------------------------------------------------------------------
    | Default Page Size
    |--------------------------------------------------------------------------
    |
    | Default number of verses per page
    |
    */
    'default_page_size' => env('QURAN_DEFAULT_PAGE_SIZE', 10),

    /*
    |--------------------------------------------------------------------------
    | Search Results Limit
    |--------------------------------------------------------------------------
    |
    | Maximum number of search results to return
    |
    */
    'search_limit' => env('QURAN_SEARCH_LIMIT', 50),

    /*
    |--------------------------------------------------------------------------
    | Supported Languages
    |--------------------------------------------------------------------------
    |
    | List of supported language codes for translations
    |
    */
    'supported_languages' => [
        'ar' => 'Arabic',
        'en' => 'English',
        'ur' => 'Urdu',
        'id' => 'Indonesian',
        'ms' => 'Malay',
        'tr' => 'Turkish',
        'fr' => 'French',
        'de' => 'German',
        'es' => 'Spanish',
        'ru' => 'Russian',
        'hi' => 'Hindi',
        'bn' => 'Bengali',
        'zh' => 'Chinese',
        'fa' => 'Persian',
        'ha' => 'Hausa',
        'sw' => 'Swahili',
        'ta' => 'Tamil',
        'tg' => 'Tagalog'
    ],

    /*
    |--------------------------------------------------------------------------
    | Popular Editions
    |--------------------------------------------------------------------------
    |
    | Popular Quran editions for quick selection
    |
    */
    'popular_editions' => [
        'en.sahih' => [
            'name' => 'Saheeh International',
            'language' => 'en'
        ],
        'en.pickthall' => [
            'name' => 'Pickthall',
            'language' => 'en'
        ],
        'en.yusufali' => [
            'name' => 'Yusuf Ali',
            'language' => 'en'
        ],
        'ar' => [
            'name' => 'القرآن الكريم',
            'language' => 'ar'
        ],
        'ur.junagarhi' => [
            'name' => 'Junagarhi',
            'language' => 'ur'
        ],
        'id.indonesian' => [
            'name' => 'Bahasa Indonesia',
            'language' => 'id'
        ],
        'ms.basmeih' => [
            'name' => 'Bahasa Malaysia',
            'language' => 'ms'
        ],
        'tr.diyanet' => [
            'name' => 'Diyanet Vakfi',
            'language' => 'tr'
        ]
    ]
];