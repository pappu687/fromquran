<?php

namespace App\Services\ResourceScraper\Adapters;

use App\Services\ResourceScraper\SearchAdapterInterface;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class YouTubeSearchAdapter implements SearchAdapterInterface
{
    public function search(string $term, int $limit = 15): array
    {
        $results = [];
        
        try {
            $url = 'https://www.youtube.com/results?search_query=' . urlencode($term);
            
            $client = new Client();
            $response = $client->request('GET', $url, [
                'headers' => [
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept-Language' => 'en-US,en;q=0.9',
                ]
            ]);

            $html = (string) $response->getBody();

            if (preg_match('/var ytInitialData = (\{.*?\});<\/script>/', $html, $matches)) {
                $data = json_decode($matches[1], true);
                
                $contents = $data['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'] ?? [];
                
                if (!empty($contents) && isset($contents[0]['itemSectionRenderer']['contents'])) {
                    $videoItems = $contents[0]['itemSectionRenderer']['contents'];
                    
                    foreach ($videoItems as $item) {
                        if (isset($item['videoRenderer'])) {
                            $v = $item['videoRenderer'];
                            $videoId = $v['videoId'] ?? null;
                            $title = $v['title']['runs'][0]['text'] ?? '';
                            $description = $v['detailedMetadataSnippets'][0]['snippetText']['runs'][0]['text'] ?? '';
                            
                            $thumbnails = $v['thumbnail']['thumbnails'] ?? [];
                            $thumbnailUrl = count($thumbnails) > 0 ? end($thumbnails)['url'] : null;

                            if ($videoId) {
                                $results[] = [
                                    'id' => uniqid(),
                                    'title' => $title,
                                    'description' => $description,
                                    'url' => 'https://www.youtube.com/watch?v=' . $videoId,
                                    'thumbnail_url' => $thumbnailUrl
                                ];
                            }
                        }

                        if (count($results) >= $limit) break;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('YouTubeSearchAdapter search failed: ' . $e->getMessage());
        }

        return $results;
    }
}
