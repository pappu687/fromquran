<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class QuranApiService
{
    private string $baseUrl;
    private int $cacheTtl;

    public function __construct()
    {
        $this->baseUrl = 'https://api.alquran.cloud/v1';
        $this->cacheTtl = config('quran.cache_ttl', 3600); // 1 hour default
    }

    /**
     * Get all chapters (surahs)
     */
    public function getChapters(): array
    {
        return Cache::remember('quran.chapters', $this->cacheTtl, function () {
            $response = Http::timeout(30)->get("{$this->baseUrl}/surah");

            if (!$response->successful()) {
                throw new \Exception('Failed to fetch chapters from Quran API');
            }

            $data = $response->json();

            return collect($data['data'])->map(function ($chapter) {
                return [
                    'id' => $chapter['number'],
                    'number' => $chapter['number'],
                    'name' => $chapter['name'],
                    'englishName' => $chapter['englishName'],
                    'englishNameTranslation' => $chapter['englishNameTranslation'],
                    'revelationType' => $chapter['revelationType'],
                    'verses' => $chapter['numberOfAyahs']
                ];
            })->toArray();
        });
    }

    /**
     * Get verses for a specific chapter
     */
    public function getVerses(int $chapterId, int $page = 1, int $limit = 10, string $edition = 'en.sahih'): array
    {
        $cacheKey = "quran.verses.{$chapterId}.{$page}.{$limit}.{$edition}";

        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($chapterId, $edition) {
            $response = Http::timeout(30)->get("{$this->baseUrl}/surah/{$chapterId}/{$edition}");

            if (!$response->successful()) {
                throw new \Exception('Failed to fetch verses from Quran API');
            }

            $data = $response->json();
            $verses = $data['data']['ayahs'] ?? [];

            return collect($verses)->map(function ($verse) use ($chapterId) {
                return [
                    'id' => $verse['numberInSurah'] + (($chapterId - 1) * 1000), // Unique ID
                    'verseNumber' => $verse['numberInSurah'],
                    'text' => $verse['text'],
                    'translation' => null, // Will be populated by translation method
                    'juzNumber' => $verse['juz'] ?? 1,
                    'pageNumber' => $verse['page'] ?? 1,
                    'hizbQuarter' => $verse['hizbQuarter'] ?? null,
                    'sajda' => $verse['sajda'] ?? false,
                    'audioUrl' => $verse['audio'] ?? null
                ];
            })->toArray();
        });
    }

    /**
     * Get translations for verses
     */
    public function getTranslations(array $verses, string $edition = 'en.sahih'): array
    {
        if (empty($verses)) {
            return [];
        }

        // For now, we'll fetch translations for each verse
        // In a real app, you might want to batch this or use a different approach
        return collect($verses)->map(function ($verse) use ($edition) {
            try {
                $cacheKey = "quran.translation.{$verse['id']}.{$edition}";
                $translation = Cache::remember($cacheKey, $this->cacheTtl, function () use ($verse, $edition) {
                    $response = Http::timeout(30)
                        ->get("{$this->baseUrl}/ayah/{$verse['id']}/{$edition}");

                    if (!$response->successful()) {
                        return null;
                    }

                    return $response->json('data.text');
                });

                return array_merge($verse, ['translation' => $translation]);
            } catch (\Exception $e) {
                return array_merge($verse, ['translation' => null]);
            }
        })->toArray();
    }

    /**
     * Get available editions (languages/translators)
     */
    public function getEditions(): array
    {
        return Cache::remember('quran.editions', $this->cacheTtl * 24, function () { // Cache longer
            $response = Http::timeout(30)->get("{$this->baseUrl}/edition");

            if (!$response->successful()) {
                return $this->getDefaultEditions();
            }

            $data = $response->json();

            return collect($data['data'])
                ->filter(function ($edition) {
                    // Filter to only include common languages and formats
                    return in_array($edition['language'], ['en', 'ar', 'ur', 'id', 'ms', 'tr', 'fr', 'de', 'es', 'ru', 'hi', 'bn', 'zh']);
                })
                ->map(function ($edition) {
                    return [
                        'identifier' => $edition['identifier'],
                        'language' => $edition['language'],
                        'name' => $edition['name'],
                        'englishName' => $edition['englishName'],
                        'format' => $edition['format'],
                        'type' => $edition['type'],
                        'direction' => $edition['direction'] ?? 'ltr'
                    ];
                })
                ->values()
                ->toArray();
        });
    }

    /**
     * Get specific edition by identifier
     */
    public function getEdition(string $identifier): ?array
    {
        $editions = $this->getEditions();
        return collect($editions)->firstWhere('identifier', $identifier);
    }

    /**
     * Search Quran text
     */
    public function search(string $query, string $edition = 'en.sahih'): array
    {
        $cacheKey = "quran.search." . md5($query . $edition);

        return Cache::remember($cacheKey, $this->cacheTtl / 2, function () use ($query, $edition) {
            $response = Http::timeout(30)->get("{$this->baseUrl}/search/{$query}/{$edition}/all");

            if (!$response->successful()) {
                return [];
            }

            $data = $response->json();

            return collect($data['data'] ?? [])->map(function ($result) {
                return [
                    'id' => $result['number'],
                    'chapterId' => $result['surah']['number'],
                    'chapterName' => $result['surah']['englishName'],
                    'verseNumber' => $result['numberInSurah'],
                    'text' => $result['text'],
                    'translation' => null, // Would need separate API call for full translation
                    'highlight' => $query
                ];
            })->toArray();
        });
    }

    /**
     * Get Juz information
     */
    public function getJuzs(): array
    {
        return Cache::remember('quran.juzs', $this->cacheTtl * 24, function () {
            $response = Http::timeout(30)->get("{$this->baseUrl}/juz");

            if (!$response->successful()) {
                return $this->getDefaultJuzs();
            }

            $data = $response->json();

            return collect($data['data'])->map(function ($juz) {
                return [
                    'id' => $juz['number'],
                    'name' => "Juz {$juz['number']}",
                    'ayahs' => $juz['ayahs'] ?? []
                ];
            })->toArray();
        });
    }

    /**
     * Default editions if API fails
     */
    private function getDefaultEditions(): array
    {
        return [
            [
                'identifier' => 'en.sahih',
                'language' => 'en',
                'name' => 'Saheeh International',
                'englishName' => 'Saheeh International',
                'format' => 'text',
                'type' => 'translation',
                'direction' => 'ltr'
            ],
            [
                'identifier' => 'ar',
                'language' => 'ar',
                'name' => 'القرآن الكريم',
                'englishName' => 'Simple Quran',
                'format' => 'text',
                'type' => 'quran',
                'direction' => 'rtl'
            ]
        ];
    }

    /**
     * Default Juz information if API fails
     */
    private function getDefaultJuzs(): array
    {
        $juzs = [];
        for ($i = 1; $i <= 30; $i++) {
            $juzs[] = [
                'id' => $i,
                'name' => "Juz {$i}",
                'ayahs' => []
            ];
        }
        return $juzs;
    }

    /**
     * Clear Quran cache
     */
    public function clearCache(): void
    {
        Cache::forget('quran.chapters');
        Cache::forget('quran.editions');
        Cache::forget('quran.juzs');

        // Clear all verse-related caches
        $keys = Cache::getRedis()->connection()->keys('quran.*');
        if (!empty($keys)) {
            Cache::getRedis()->connection()->del($keys);
        }
    }
}