<?php

namespace App\Services\ResourceScraper\Adapters;

use App\Services\ResourceScraper\SearchAdapterInterface;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class SunnahSearchAdapter implements SearchAdapterInterface
{
    public function search(string $term, int $limit = 15): array
    {
        $results = [];
        
        try {
            $url = 'https://sunnah.com/search?q=' . urlencode($term);
            
            $client = new Client();
            $response = $client->request('GET', $url, [
                'headers' => [
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept-Language' => 'en-US,en;q=0.9',
                ]
            ]);

            $html = (string) $response->getBody();

            // Structure:
            // <a style="display: block;" href="/bukhari:1947">
            // <div class="hadith_reference_sticky">Sahih al-Bukhari 1947</div>
            // <div class=text_details><p>We used to travel...</div>
            
            preg_match_all('/<a style="display: block;" href="([^"]+)".*?<div class="hadith_reference_sticky">([^<]+)<\/div>.*?<div class=text_details>(.*?)<\/div>/is', $html, $matches, PREG_SET_ORDER);

            foreach ($matches as $match) {
                // Strip tags from the description to clean up the <p> and <em> tags
                $rawLink = trim($match[1]);
                $title = trim(strip_tags($match[2]));
                $description = trim(strip_tags($match[3]));

                $fullUrl = 'https://sunnah.com' . $rawLink;

                $results[] = [
                    'id' => uniqid(),
                    'title' => $title,
                    'description' => $description,
                    'url' => $fullUrl,
                    'thumbnail_url' => null, // Hadiths typically don't have thumbnails
                ];

                if (count($results) >= $limit) break;
            }
        } catch (\Exception $e) {
            Log::error('SunnahSearchAdapter search failed: ' . $e->getMessage());
        }

        return $results;
    }
}
