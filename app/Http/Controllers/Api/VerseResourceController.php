<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserVerseResource;
use App\Models\Verse;
use Illuminate\Http\Request;
use Solarium\Client;

use App\Services\QuranDatabaseService;

class VerseResourceController extends Controller
{
    public function __construct(
        protected Client $client,
        protected QuranDatabaseService $quranService
    ) {}

    /**
     * Get approved resources for multiple verses
     */
    public function index(Request $request)
    {
        $verseIds = $request->query('verse_ids');
        if (!$verseIds) {
            return response()->json([
                'data' => [],
            ]);
        }

        $verseIdArray = explode(',', $verseIds);

        $query = $this->client->createSelect();
        $query->setQuery('document_type_s:user_verse_resource AND verse_id_i:(' . implode(' ', $verseIdArray) . ')');
        $query->addSort('created_at_dt', $query::SORT_DESC);
        $query->setRows(100);

        try {
            $resultset = $this->client->select($query);
            $resources = collect($resultset)->map(function ($doc) {
                $comment = $doc->description_t;
                $comment = $this->applyVerseHighlight($comment, $doc->chapter_number_i ?? null, $doc->verse_number_i ?? null);

                return [
                    'id' => (int) str_replace('uvr_', '', $doc->id),
                    'verse_id' => $doc->verse_id_i,
                    'resource_title' => $doc->title_t,
                    'comment' => $comment,
                    'resource_url' => $doc->resource_url_s,
                    'thumbnail_url' => $doc->thumbnail_url_s,
                    'resource_type' => [
                        'name' => $doc->resource_type_name_s,
                    ],
                    'user' => [
                        'name' => $doc->user_name_s,
                    ],
                    'created_at' => $doc->created_at_dt,
                ];
            });

            return response()->json([
                'data' => $resources,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get approved resources for a single verse
     */
    public function show(Request $request, $verseId)
    {
        $limit = (int) $request->query('limit', 5);
        $verse = Verse::find($verseId);
        $chapterId = $verse ? $verse->chapter_id : null;

        // Fetch verse context (text and translation)
        $verseContext = null;
        if ($verse) {
            $edition = $request->get('edition', config('quran.default_edition', 'en.sahih'));
            $verses = $this->quranService->getVerses($verse->chapter_id, 1, 300, $edition);
            $verseData = collect($verses)->firstWhere('verseNumber', $verse->verse_number);

            if ($verseData) {
                $verseContext = [
                    'text' => $verseData['text'],
                    'translation' => $verseData['translation'],
                    'verse_key' => $verse->verse_key,
                ];
            }
        }

        $query = $this->client->createSelect();

        // Query for verse resources, translations for this verse, and chapter resources for the verse's chapter
        $q = "(document_type_s:user_verse_resource AND verse_id_i:{$verseId}) OR (document_type_s:translation AND verse_id_i:{$verseId})";
        if ($chapterId) {
            $q .= " OR (document_type_s:user_chapter_resource AND chapter_id_i:{$chapterId})";
        }

        $query->setQuery($q);
        $query->addSort('document_type_s', $query::SORT_ASC); // Group types together potentially
        $query->addSort('created_at_dt', $query::SORT_DESC);

        $resultset = $this->client->select($query);
        $total = $resultset->getNumFound();

        if ($limit > 0) {
            $query->setRows($limit);
            $resultset = $this->client->select($query);
        }

        $resources = collect($resultset)->map(function ($doc) {
            $comment = $doc->description_t;
            $comment = $this->applyVerseHighlight($comment, $doc->chapter_number_i ?? null, $doc->verse_number_i ?? null);

            $isTruncated = \Illuminate\Support\Str::wordCount($comment) > 50;
            $truncatedComment = \Illuminate\Support\Str::words($comment, 50, '...');

            return [
                'id' => $doc->id, // Keep Solr ID or try to parse if needed
                'real_id' => str_replace(['uvr_', 'ucr_', 'trans_'], '', $doc->id),
                'verse_id' => $doc->verse_id_i,
                'chapter_id' => $doc->chapter_id_i,
                'resource_title' => $doc->title_t,
                'comment' => $truncatedComment,
                'full_comment' => $comment,
                'is_truncated' => $isTruncated,
                'resource_url' => $doc->resource_url_s,
                'thumbnail_url' => $doc->thumbnail_url_s,
                'resource_type' => [
                    'name' => $doc->resource_type_name_s,
                ],
                'user' => [
                    'name' => $doc->user_name_s,
                ],
                'created_at' => $doc->created_at_dt,
                'document_type' => $doc->document_type_s,
            ];
        });

        // Count resources by type from all results (not just limited)
        $allResultsQuery = $this->client->createSelect();
        $allResultsQuery->setQuery($q);
        $allResultsQuery->setRows($total); // Get all for counting
        $allResults = $this->client->select($allResultsQuery);

        $resourceTypeCounts = [];
        foreach ($allResults as $doc) {
            $typeName = $doc->resource_type_name_s ?? 'Unknown';
            if (!isset($resourceTypeCounts[$typeName])) {
                $resourceTypeCounts[$typeName] = 0;
            }
            $resourceTypeCounts[$typeName]++;
        }

        // Fetch similar verses from MySQL
        $similarVerses = [];
        $similarVersesCount = 0;
        if ($verse) {
            $similarVerses = \App\Models\SimilarAyah::with([
                'matchedVerse:id,verse_key,verse_number,chapter_id,text_uthmani',
                'matchedVerse.chapter:id,chapter_number,name_simple,name_roman',
                'matchedVerse.translations' => function ($query) {
                    $query->whereHas('language', function ($q) {
                        $q->where('iso_code', 'en');
                    })->orderBy('priority', 'desc');
                },
            ])
                ->where('verse_key', $verse->verse_key)
                ->orderBy('score', 'desc')
                ->get()
                ->map(function ($similar) {
                    $translation = $similar->matchedVerse?->translations?->first();

                    return [
                        'id' => $similar->id,
                        'verse_key' => $similar->matched_ayah_key,
                        'verse_number' => $similar->matchedVerse?->verse_number,
                        'chapter_id' => $similar->matchedVerse?->chapter_id,
                        'chapter_number' => $similar->matchedVerse?->chapter?->chapter_number,
                        'chapter_name' => $similar->matchedVerse?->chapter?->name_simple,
                        'chapter_name_roman' => $similar->matchedVerse?->chapter?->name_roman,
                        'text_uthmani' => $similar->matchedVerse?->text_uthmani,
                        'translation' => $translation?->text,
                        'translation_resource' => $translation?->resource_name,
                        'matched_words_count' => $similar->matched_words_count,
                        'coverage' => $similar->coverage,
                        'score' => $similar->score,
                        'match_words_range' => $similar->match_words_range,
                    ];
                });
            $similarVersesCount = $similarVerses->count();
        }

        // Fetch topics from MySQL
        $topics = [];
        $topicsCount = 0;
        if ($verse) {
            $topics = \App\Models\Topic::forVerse($verse->verse_key)
                ->select('topic_id', 'name', 'arabic_name')
                ->orderBy('topic_id')
                ->get();
            $topicsCount = $topics->count();
        }

        return response()->json([
            'data' => $resources,
            'verse_context' => $verseContext,
            'meta' => [
                'total' => $total,
                'limit' => $limit,
                'hasMore' => $limit > 0 && $total > $limit,
                'counts' => [
                    'resource_types' => $resourceTypeCounts,
                    'similar_verses' => $similarVersesCount,
                    'topics' => $topicsCount,
                ],
            ],
            'similar_verses' => [
                'data' => $similarVerses,
                'count' => $similarVersesCount,
            ],
            'topics' => [
                'data' => $topics,
                'count' => $topicsCount,
            ],
        ]);
    }

    private function applyVerseHighlight($text, $chapter, $verse)
    {
        if (!$chapter || !$verse) {
            return $text;
        }

        $pattern = '/\b' . $chapter . ':' . $verse . '\b/';
        $replacement = '<span style="background-color: #f97316; color: white; padding: 0 4px; border-radius: 4px; font-weight: bold;">$0</span>';

        return preg_replace($pattern, $replacement, $text);
    }

    /**
     * Get specific resource details
     */
    public function getResource($id)
    {
        // Try to fetch from Solr first if $id looks like a Solr ID
        if (str_contains($id, '_')) {
            $query = $this->client->createSelect();
            $query->setQuery('id:' . $id);
            $resultset = $this->client->select($query);
            $doc = $resultset->getDocuments()[0] ?? null;

            if ($doc) {
                $comment = nl2br($doc->description_t);
                $comment = $this->applyVerseHighlight($comment, $doc->chapter_number_i ?? null, $doc->verse_number_i ?? null);

                return response()->json([
                    'data' => [
                        'id' => $doc->id,
                        'title' => $doc->title_t,
                        'url' => $doc->resource_url_s,
                        'comment' => '<p>' . $comment . '</p>',
                    ],
                ]);
            }
        }

        // Fallback to DB if not found in Solr or not a Solr ID
        $resource = UserVerseResource::with(['user:id,name', 'verse.chapter'])->findOrFail($id);

        $comment = nl2br($resource->comment);
        if ($resource->verse && $resource->verse->chapter) {
            $comment = $this->applyVerseHighlight($comment, $resource->verse->chapter->chapter_number, $resource->verse->verse_number);
        }

        return response()->json([
            'data' => [
                'id' => $resource->id,
                'title' => $resource->resource_title,
                'url' => $resource->resource_url,
                'comment' => '<p>' . $comment . '</p>',
            ],
        ]);
    }

    /**
     * Get similar verses for a given verse
     */
    public function similarVerses($verseId)
    {
        $verse = Verse::findOrFail($verseId);

        $similarVerses = \App\Models\SimilarAyah::with([
            'matchedVerse:id,verse_key,verse_number,chapter_id,text_uthmani',
            'matchedVerse.chapter:id,chapter_number,name_simple,name_roman',
            'matchedVerse.translations' => function ($query) {
                $query->whereHas('language', function ($q) {
                    $q->where('iso_code', 'en');
                })->orderBy('priority', 'desc');
            },
        ])
            ->where('verse_key', $verse->verse_key)
            ->orderBy('score', 'desc')
            ->get()
            ->map(function ($similar) {
                $translation = $similar->matchedVerse?->translations?->first();

                return [
                    'id' => $similar->id,
                    'verse_key' => $similar->matched_ayah_key,
                    'verse_number' => $similar->matchedVerse?->verse_number,
                    'chapter_id' => $similar->matchedVerse?->chapter_id,
                    'chapter_number' => $similar->matchedVerse?->chapter?->chapter_number,
                    'chapter_name' => $similar->matchedVerse?->chapter?->name_simple,
                    'chapter_name_roman' => $similar->matchedVerse?->chapter?->name_roman,
                    'text_uthmani' => $similar->matchedVerse?->text_uthmani,
                    'translation' => $translation?->text,
                    'translation_resource' => $translation?->resource_name,
                    'matched_words_count' => $similar->matched_words_count,
                    'coverage' => $similar->coverage,
                    'score' => $similar->score,
                    'match_words_range' => $similar->match_words_range,
                ];
            });

        return response()->json([
            'data' => $similarVerses,
        ]);
    }
}
