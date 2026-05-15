<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Services\QuranDatabaseService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchPageController extends Controller
{
    public function __invoke(Request $request, QuranDatabaseService $quranService): Response
    {
        $query = (string) $request->get('query', '');
        $page = max(1, (int) $request->get('page', 1));
        $perPage = (int) $request->get('limit', 10);
        $edition = $request->get('edition', config('quran.default_edition', 'en.sahih'));

        $results = [];
        $total = 0;

        if (trim($query) !== '') {
            $searchResult = $quranService->search($query, $edition, false, $page, $perPage);
            $total = $searchResult['total_results'];
            $results = $searchResult['data'];
        }

        // Chapters list for QuranReaderLayout (same shape as QuranDatabaseService::getChapters)
        $chapters = Chapter::orderBy('chapter_number')
            ->get()
            ->map(function ($chapter) {
                return [
                    'id' => $chapter->id,
                    'number' => $chapter->chapter_number,
                    'name' => $chapter->name_arabic,
                    'englishName' => $chapter->name_simple,
                    'romanName' => $chapter->name_roman,
                    'englishNameTranslation' => $chapter->name_simple,
                    'revelationType' => ucfirst($chapter->revelation_place),
                    'verses' => $chapter->verses_count,
                ];
            })
            ->toArray();

        return Inertia::render('search', [
            'query' => $query,
            'edition' => $edition,
            'results' => $results,
            'currentPage' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'chapters' => $chapters,
        ]);
    }
}
