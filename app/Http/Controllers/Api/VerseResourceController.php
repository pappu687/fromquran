<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserVerseResource;
use App\Models\Verse;
use Illuminate\Http\Request;

class VerseResourceController extends Controller
{
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

        $resources = UserVerseResource::with('user:id,name')
            ->whereIn('verse_id', $verseIdArray)
            ->where('status', 'approved')
            ->select('id', 'verse_id', 'resource_type_id', 'resource_url', 'resource_title', 'comment', 'user_id', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $resources,
        ]);
    }

    /**
     * Get approved resources for a single verse (legacy endpoint)
     *
     * Supports an optional ?limit= parameter to return only a subset of
     * resources while also including total count and hasMore flag.
     */
    public function show(Request $request, $verseId)
    {
        $limit = (int) $request->query('limit', 5);

        $baseQuery = UserVerseResource::with('user:id,name')
            ->where('verse_id', $verseId)
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc');

        $total = (clone $baseQuery)->count();

        if ($limit > 0) {
            $baseQuery->limit($limit);
        }

        $resources = $baseQuery
            ->get()
            ->map(function ($resource) {
                $resource->is_truncated = \Illuminate\Support\Str::wordCount($resource->comment) > 50;
                $resource->comment = \Illuminate\Support\Str::words($resource->comment, 50, '...');
                return $resource;
            });

        return response()->json([
            'data' => $resources,
            'meta' => [
                'total' => $total,
                'limit' => $limit,
                'hasMore' => $limit > 0 && $total > $limit,
            ],
        ]);
    }

    /**
     * Get specific resource details
     */
    public function getResource($id)
    {
        $resource = UserVerseResource::with('user:id,name')->findOrFail($id);

        // Format comment with nl2br and wrap in p tags
        $resource->comment = '<p>' . nl2br($resource->comment) . '</p>';

        return response()->json([
            'data' => $resource,
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
