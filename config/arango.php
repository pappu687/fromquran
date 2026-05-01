<?php

return [
    'endpoint' => env('ARANGO_ENDPOINT', 'http://localhost:8529'),
    'database' => env('ARANGO_DATABASE', 'fromquran'),
    'username' => env('ARANGO_USERNAME', 'root'),
    'password' => env('ARANGO_PASSWORD', 'test'),

    'collections' => [
        'documents' => [
            'chapters',
            'verses',
            'topics',
            'resources',
            'resource_types',
            'tafsirs',
            'translations',
            'roots',
            'lemmas',
            'stems',
        ],
        'edges' => [
            'chapter_has_verse',
            'verse_next',
            'verse_similar_to',
            'verse_has_topic',
            'topic_parent_of',
            'topic_related_to',
            'verse_has_resource',
            'chapter_has_resource',
            'verse_has_tafsir',
            'verse_has_translation',
            'verse_has_root',
            'verse_has_lemma',
            'verse_has_stem',
        ],
    ],
];
