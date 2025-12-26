<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\Verse;
use App\Models\Translation;
use App\Models\ResourceContent;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class QuranDatabaseService
{
    private int $cacheTtl;

    public function __construct()
    {
        $this->cacheTtl = config('quran.cache_ttl', 3600); // 1 hour default
    }

    /**
     * Get all chapters (surahs) from database
     */
    public function getChapters(): array
    {
        return Cache::remember('quran.db.chapters', $this->cacheTtl, function () {
            return Chapter::orderBy('chapter_number')
                ->get()
                ->map(function ($chapter) {
                    return [
                        'id' => $chapter->id,
                        'number' => $chapter->chapter_number,
                        'name' => $chapter->name_arabic,
                        'englishName' => $chapter->name_simple,
                        'englishNameTranslation' => $chapter->name_simple,
                        'revelationType' => ucfirst($chapter->revelation_place),
                        'verses' => $chapter->verses_count
                    ];
                })
                ->toArray();
        });
    }

    /**
     * Get verses for a specific chapter from database
     */
    public function getVerses(int $chapterId, int $page = 1, int $limit = 10, string $edition = 'en.sahih'): array
    {
        $cacheKey = "quran.db.verses.{$chapterId}.{$page}.{$limit}.{$edition}";

        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($chapterId, $edition) {
            $chapter = Chapter::where('id', $chapterId)
                ->orWhere('chapter_number', $chapterId)
                ->first();

            if (!$chapter) {
                return [];
            }

            // Get verses with resource counts using a join
            $verses = Verse::where('verses.chapter_id', $chapter->id)
                ->leftJoin('user_verse_resources', function ($join) {
                    $join->on('verses.id', '=', 'user_verse_resources.verse_id')
                         ->where('user_verse_resources.status', '=', 'approved');
                })
                ->select(
                    'verses.id',
                    'verses.chapter_id',
                    'verses.verse_number',
                    'verses.verse_key',
                    'verses.text_uthmani',
                    'verses.text_imlaei',
                    'verses.juz_number',
                    'verses.hizb_number',
                    'verses.rub_el_hizb_number',
                    'verses.page_number',
                    'verses.sajdah_type',
                    'verses.sajdah_number',
                    DB::raw('COUNT(DISTINCT user_verse_resources.id) as resource_count')
                )
                ->groupBy(
                    'verses.id',
                    'verses.chapter_id',
                    'verses.verse_number',
                    'verses.verse_key',
                    'verses.text_uthmani',
                    'verses.text_imlaei',
                    'verses.juz_number',
                    'verses.hizb_number',
                    'verses.rub_el_hizb_number',
                    'verses.page_number',
                    'verses.sajdah_type',
                    'verses.sajdah_number'
                )
                ->orderBy('verses.verse_number')
                ->get();

            return $verses->map(function ($verse) use ($edition) {
                $translation = null;
                
                // Get translation if requested
                if ($edition !== 'ar') {
                    $translationRecord = Translation::where('verse_id', $verse->id)
                        ->whereHas('resourceContent', function ($query) use ($edition) {
                            // Try to match by resource_id or slug
                            $query->where('resource_id', 'like', "%{$edition}%")
                                  ->orWhere('slug', 'like', "%{$edition}%");
                        })
                        ->first();
                    
                    // Fallback to any English translation
                    if (!$translationRecord) {
                        $translationRecord = Translation::where('verse_id', $verse->id)
                            ->whereHas('resourceContent', function ($query) {
                                $query->where('language_name', 'English');
                            })
                            ->first();
                    }
                    
                    $translation = $translationRecord?->text;
                }

                return [
                    'id' => $verse->id,
                    'verseNumber' => $verse->verse_number,
                    'text' => $verse->text_uthmani,
                    'translation' => $translation,
                    'juzNumber' => $verse->juz_number,
                    'pageNumber' => $verse->page_number,
                    'hizbQuarter' => $verse->rub_el_hizb_number,
                    'sajda' => false, // You can add this to your database if needed
                    'audioUrl' => null, // You can add audio URLs later
                    'hasResources' => $verse->resource_count > 0,
                    'resourceCount' => (int) $verse->resource_count,
                ];
            })->toArray();
        });
    }

    /**
     * Get translations for verses (already included in getVerses)
     */
    public function getTranslations(array $verses, string $edition = 'en.sahih'): array
    {
        // Translations are already included in getVerses method
        return $verses;
    }

    /**
     * Get available editions (languages/translators) from database
     */
    public function getEditions(): array
    {
        return Cache::remember('quran.db.editions', $this->cacheTtl * 24, function () {
            return ResourceContent::where('resource_type', 'translation')
                ->where('approved', true)
                ->orderBy('priority')
                ->get()
                ->map(function ($resource) {
                    return [
                        'identifier' => $resource->resource_id ?? $resource->slug,
                        'language' => $resource->language->iso_code ?? 'en',
                        'name' => $resource->name,
                        'englishName' => $resource->name,
                        'format' => 'text',
                        'type' => 'translation',
                        'direction' => $resource->language->direction ?? 'ltr'
                    ];
                })
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
     * Search Quran text in database
     */
    public function search(string $query, string $edition = 'en.sahih'): array
    {
        $cacheKey = "quran.db.search." . md5($query . $edition);

        return Cache::remember($cacheKey, $this->cacheTtl / 2, function () use ($query, $edition) {
            // Search in Arabic text
            $verseResults = Verse::where('text_uthmani', 'like', "%{$query}%")
                ->with('chapter')
                ->limit(50)
                ->get();

            // Also search in translations if not Arabic
            if ($edition !== 'ar') {
                $translationResults = Translation::where('text', 'like', "%{$query}%")
                    ->whereHas('resourceContent', function ($q) use ($edition) {
                        $q->where('resource_id', 'like', "%{$edition}%")
                          ->orWhere('slug', 'like', "%{$edition}%");
                    })
                    ->with(['verse.chapter'])
                    ->limit(50)
                    ->get();

                // Merge results
                $verseResults = $verseResults->merge(
                    $translationResults->pluck('verse')
                )->unique('id');
            }

            return $verseResults->map(function ($verse) use ($query, $edition) {
                $translation = null;
                if ($edition !== 'ar') {
                    $translationRecord = Translation::where('verse_id', $verse->id)
                        ->whereHas('resourceContent', function ($q) use ($edition) {
                            $q->where('resource_id', 'like', "%{$edition}%")
                              ->orWhere('slug', 'like', "%{$edition}%");
                        })
                        ->first();
                    
                    $translation = $translationRecord?->text;
                }

                return [
                    'id' => $verse->id,
                    'chapterId' => $verse->chapter->id,
                    'chapterName' => $verse->chapter->name_simple,
                    'verseNumber' => $verse->verse_number,
                    'text' => $verse->text_uthmani,
                    'translation' => $translation,
                    'highlight' => $query
                ];
            })->toArray();
        });
    }

    /**
     * Get Juz information from database
     */
    public function getJuzs(): array
    {
        return Cache::remember('quran.db.juzs', $this->cacheTtl * 24, function () {
            $juzs = [];
            
            for ($i = 1; $i <= 30; $i++) {
                $verseCount = Verse::where('juz_number', $i)->count();
                
                $juzs[] = [
                    'id' => $i,
                    'name' => "Juz {$i}",
                    'number' => $i,
                    'verseCount' => $verseCount
                ];
            }
            
            return $juzs;
        });
    }

    /**
     * Clear Quran cache
     */
    public function clearCache(): void
    {
        $patterns = [
            'quran.db.chapters',
            'quran.db.editions',
            'quran.db.juzs',
            'quran.db.verses.*',
            'quran.db.search.*'
        ];

        foreach ($patterns as $pattern) {
            if (str_contains($pattern, '*')) {
                // Clear pattern-based keys
                $prefix = str_replace('*', '', $pattern);
                Cache::flush(); // In production, use a more targeted approach
            } else {
                Cache::forget($pattern);
            }
        }
    }
}
