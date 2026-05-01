<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Verse;
use App\Services\Arango\QuranGraphQueryService;
use Illuminate\Http\Request;

class QuranGraphV2Controller extends Controller
{
    public function __construct(protected QuranGraphQueryService $graphService) {}

    public function verse(Request $request, $verseId)
    {
        $verse = Verse::with('chapter')->findOrFail($verseId);
        $depth = min((int) $request->query('depth', 1), 2);
        $types = $request->query('types');

        $typeArray = null;
        if ($types) {
            $typeArray = explode(',', $types);
        }

        $verseKey = "{$verse->chapter->chapter_number}:{$verse->verse_number}";

        try {
            $graph = $this->graphService->getVerseGraph($verseKey, $depth, $typeArray);
        } catch (\RuntimeException $e) {
            return response()->json([
                'error' => 'Graph service unavailable',
                'message' => $e->getMessage(),
            ], 503);
        }

        return response()->json($graph);
    }

    public function chapter(Request $request, $chapterId)
    {
        $chapter = Chapter::findOrFail($chapterId);
        $depth = min((int) $request->query('depth', 1), 2);
        $types = $request->query('types');

        $typeArray = null;
        if ($types) {
            $typeArray = explode(',', $types);
        }

        try {
            $graph = $this->graphService->getChapterGraph($chapter->chapter_number, $depth, $typeArray);
        } catch (\RuntimeException $e) {
            return response()->json([
                'error' => 'Graph service unavailable',
                'message' => $e->getMessage(),
            ], 503);
        }

        return response()->json($graph);
    }
}
