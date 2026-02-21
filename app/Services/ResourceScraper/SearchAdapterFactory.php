<?php

namespace App\Services\ResourceScraper;

use App\Services\ResourceScraper\Adapters\YouTubeSearchAdapter;
use App\Services\ResourceScraper\Adapters\SunnahSearchAdapter;

class SearchAdapterFactory
{
    /**
     * Return the correct search adapter based on the required resource slug.
     * 
     * @param string $slug
     * @return SearchAdapterInterface|null
     */
    public static function make(string $slug): ?SearchAdapterInterface
    {
        switch ($slug) {
            case 'youtube_tafseer':
                return new YouTubeSearchAdapter();
            case 'hadith':
                return new SunnahSearchAdapter();
            // Other slugs could be added here in the future
            default:
                return null; // Return null if not supported
        }
    }
}
