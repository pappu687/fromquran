<?php

namespace App\Http\Controllers;

use App\Models\ChapterAudioFile;
use App\Services\QuranDatabaseService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class QuranController extends Controller
{
    protected QuranDatabaseService $quranService;

    public function __construct(QuranDatabaseService $quranService)
    {
        $this->quranService = $quranService;
    }

    /**
     * Get all chapters
     */
    public function chapters(): JsonResponse
    {
        try {
            $chapters = $this->quranService->getChapters();
            return response()->json($chapters);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch chapters',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get info for a specific chapter
     */
    public function chapterInfo(int $chapterId): JsonResponse
    {
        try {
            $info = $this->quranService->getChapterInfo($chapterId);
            
            if (!$info) {
                return response()->json([
                    'error' => 'Chapter info not found'
                ], 404);
            }

            return response()->json($info);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch chapter info',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get verses for a specific chapter
     */
    public function verses(Request $request, int $chapterId): JsonResponse
    {
        $page = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', config('quran.default_page_size', 10));
        $edition = $request->get('edition', config('quran.default_edition', 'en.sahih'));

        // Only treat as range when explicit query params are present
        $from = $request->has('from') ? (int) $request->query('from') : null;
        $to = $request->has('to') ? (int) $request->query('to') : null;

        try {
            $verses = $this->quranService->getVerses($chapterId, $page, $limit, $edition);

            if (empty($verses)) {
                return response()->json([
                    'error' => 'Chapter not found or has no verses'
                ], 404);
            }

            // Optional verse range filtering (e.g. from=10&to=15)
            if ($from !== null && $to !== null) {
                $lastVerse = end($verses);
                $maxVerseCount = $lastVerse['verseNumber'];

                if ($from < 1 || $from > $maxVerseCount || $to < $from || $to > $maxVerseCount) {
                    return response()->json([
                        'error' => "Invalid verse range. Surah {$chapterId} has {$maxVerseCount} verses."
                    ], 422);
                }

                $verses = array_values(array_filter($verses, function ($verse) use ($from, $to) {
                    return $verse['verseNumber'] >= $from && $verse['verseNumber'] <= $to;
                }));
                // When using an explicit range, treat all verses as a single page
                $page = 1;
                $limit = count($verses) ?: $limit;
            } else {
                // Add translations if edition is not the original Arabic
                if ($edition !== 'ar') {
                    $verses = $this->quranService->getTranslations($verses, $edition);
                }
            }

            $totalVerses = count($verses);
            $offset = ($page - 1) * $limit;
            $pagedVerses = array_slice($verses, $offset, $limit);

            return response()->json([
                'data' => $pagedVerses,
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $totalVerses,
                'has_more' => $offset + $limit < $totalVerses,
                'edition' => $edition
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch verses',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available editions (languages/translators)
     */
    public function editions(): JsonResponse
    {
        try {
            $editions = $this->quranService->getEditions();
            return response()->json($editions);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch editions',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search Quran text
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('query', '');
        $edition = $request->get('edition', config('quran.default_edition', 'en.sahih'));
        $limit = (int) $request->get('limit', config('quran.search_limit', 50));

        if (empty($query)) {
            return response()->json([
                'error' => 'Search query is required'
            ], 400);
        }

        try {
            $results = $this->quranService->search($query, $edition);
            $limitedResults = array_slice($results, 0, $limit);

            return response()->json([
                'data' => $limitedResults,
                'query' => $query,
                'edition' => $edition,
                'total_results' => count($results)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Search failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Juz information
     */
    public function juzs(): JsonResponse
    {
        try {
            $juzs = $this->quranService->getJuzs();
            return response()->json($juzs);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch Juz information',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get verses from a specific Juz
     */
    public function juzVerses(Request $request, int $juzId): JsonResponse
    {
        $edition = $request->get('edition', config('quran.default_edition', 'en.sahih'));

        try {
            // This is a simplified implementation - in a real app, you'd
            // need to map Juz to specific chapter and verse ranges
            $juzs = $this->quranService->getJuzs();
            $juz = collect($juzs)->firstWhere('id', $juzId);

            if (!$juz) {
                return response()->json([
                    'error' => 'Juz not found'
                ], 404);
            }

            // For now, return the juz info. In a full implementation,
            // you'd fetch the actual verses for this Juz
            return response()->json([
                'juz' => $juz,
                'message' => 'Full Juz verse implementation needed'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch Juz verses',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get audio file with verse timings for a specific reciter and chapter
     */
    public function audio(int $reciterId, int $chapterId): JsonResponse
    {
        try {
            $audioFile = ChapterAudioFile::with(['verseTimings', 'reciter'])
                ->where('chapter_id', $chapterId)
                ->where('reciter_id', $reciterId)
                ->where('is_enabled', true)
                ->first();

            if (!$audioFile) {
                return response()->json([
                    'error' => 'Audio file not found for this reciter and chapter'
                ], 404);
            }

            return response()->json([
                'audio_files' => [
                    [
                        'id' => $audioFile->id,
                        'chapter_id' => $audioFile->chapter_id,
                        'file_size' => $audioFile->file_size,
                        'format' => $audioFile->format,
                        'audio_url' => $audioFile->audio_url,
                        'duration' => $audioFile->duration,
                        'reciter_id' => $audioFile->reciter_id,
                        'reciter_name' => $audioFile->reciter?->name,
                        'verse_timings' => $audioFile->verseTimings->map(function ($timing) {
                            return [
                                'verse_key' => $timing->verse_key,
                                'timestamp_from' => $timing->timestamp_from,
                                'timestamp_to' => $timing->timestamp_to,
                                'duration' => $timing->duration,
                                'segments' => $timing->segments,
                            ];
                        })->toArray(),
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch audio',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available reciters
     */
    public function reciters(): JsonResponse
    {
        try {
            $reciters = \App\Models\Reciter::enabled()
                ->orderByPriority()
                ->get(['id', 'name', 'arabic_name', 'description']);

            return response()->json($reciters);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch reciters',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
