<?php

namespace App\Services\ResourceScraper;

interface SearchAdapterInterface
{
    /**
     * Perform a search for the requested term and return an array of results.
     * 
     * @param string $term
     * @param int $limit
     * @return array Array of arrays containing keys: id, title, description, url, thumbnail_url
     */
    public function search(string $term, int $limit = 20): array;
}
