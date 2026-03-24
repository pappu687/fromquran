<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\Verse;
use App\Services\QuranDatabaseService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuranReaderPageController extends Controller
{
    public function chapter(Request $request, int $chapterNumber, QuranDatabaseService $quranService): Response
    {
        $chapter = Chapter::where('chapter_number', $chapterNumber)->firstOrFail();

        $edition = config('quran.default_edition', 'en.sahih');
        $pageSize = config('quran.default_page_size', 10);
        $startVerse = max(1, (int) $request->query('start-verse', 1));
        $startPage = (int) max(1, ceil($startVerse / $pageSize));
        $offset = ($startPage - 1) * $pageSize;

        // Fetch initial verses for SSR
        $versesData = $quranService->getVerses($chapter->id, 1, $pageSize, $edition);

        $initialVerses = [
            'data' => array_slice($versesData, $offset, $pageSize),
            'total' => count($versesData),
            'has_more' => count($versesData) > ($offset + $pageSize),
        ];

        // Preload chapters for the sidebar to avoid client-side refetches.
        $chapters = $quranService->getChapters();

        return Inertia::render('quran/reader', [
            'chapterNumber' => $chapterNumber,
            'initialVerses' => $initialVerses,
            'chapters' => $chapters,
            'chapter' => [
                'id' => $chapter->id,
                'number' => $chapter->chapter_number,
                'name' => $chapter->name_arabic,
                'englishName' => $chapter->name_simple,
                'romanName' => $chapter->name_roman,
                'englishNameTranslation' => $chapter->name_simple,
                'revelationType' => ucfirst($chapter->revelation_place),
                'verses' => $chapter->verses_count,
            ],
        ]);
    }

    public function range(int $chapterNumber, string $range, QuranDatabaseService $quranService): Response
    {
        $chapter = Chapter::where('chapter_number', $chapterNumber)->firstOrFail();

        $parts = explode('-', $range);
        $from = isset($parts[0]) && $parts[0] !== '' ? (int) $parts[0] : null;
        $to = isset($parts[1]) && $parts[1] !== '' ? (int) $parts[1] : $from;

        $edition = config('quran.default_edition', 'en.sahih');
 
        // Fetch verses for the range
        $versesData = $quranService->getVerses($chapter->id, 1, 1000, $edition);
 
        $filteredVerses = array_values(array_filter($versesData, function ($verse) use ($from, $to) {
            return $verse['verseNumber'] >= $from && $verse['verseNumber'] <= $to;
        }));
 
        $initialVerses = [
            'data' => $filteredVerses,
            'total' => count($filteredVerses),
            'has_more' => false,
        ];
 
        // Preload chapters for the sidebar to avoid client-side refetch flicker
        $chapters = $quranService->getChapters();
 
        return Inertia::render('quran/reader', [
            'chapterNumber' => $chapterNumber,
            'fromVerse' => $from,
            'toVerse' => $to,
            'initialVerses' => $initialVerses,
            'chapters' => $chapters,
            'chapter' => [
                'id' => $chapter->id,
                'number' => $chapter->chapter_number,
                'name' => $chapter->name_arabic,
                'englishName' => $chapter->name_simple,
                'romanName' => $chapter->name_roman,
                'englishNameTranslation' => $chapter->name_simple,
                'revelationType' => ucfirst($chapter->revelation_place),
                'verses' => $chapter->verses_count,
            ],
        ]);
    }

    public function related(int $chapterNumber, int $verseNumber): Response
    {
        $chapter = Chapter::where('chapter_number', $chapterNumber)->firstOrFail();

        $verse = Verse::where('chapter_id', $chapter->id)
            ->where('verse_number', $verseNumber)
            ->firstOrFail();

        // Find previous and next verses based on global verse_index
        $previous = Verse::where('verse_index', '<', $verse->verse_index)
            ->orderByDesc('verse_index')
            ->first();

        $next = Verse::where('verse_index', '>', $verse->verse_index)
            ->orderBy('verse_index')
            ->first();

        return Inertia::render('quran/related', [
            'chapterNumber' => $chapterNumber,
            'verseNumber' => $verseNumber,
            'verseId' => $verse->id,
            'previousVerse' => $previous ? [
                'chapterNumber' => $previous->chapter->chapter_number,
                'verseNumber' => $previous->verse_number,
            ] : null,
            'nextVerse' => $next ? [
                'chapterNumber' => $next->chapter->chapter_number,
                'verseNumber' => $next->verse_number,
            ] : null,
        ]);
    }

    public function relatedChapter(int $chapterNumber): Response
    {
        $chapter = Chapter::where('chapter_number', $chapterNumber)->firstOrFail();

        $previousChapter = Chapter::where('chapter_number', '<', $chapterNumber)
            ->orderByDesc('chapter_number')
            ->first();

        $nextChapter = Chapter::where('chapter_number', '>', $chapterNumber)
            ->orderBy('chapter_number')
            ->first();

        return Inertia::render('quran/related-chapter', [
            'chapterNumber' => $chapterNumber,
            'previousChapter' => $previousChapter ? [
                'chapterNumber' => $previousChapter->chapter_number,
            ] : null,
            'nextChapter' => $nextChapter ? [
                'chapterNumber' => $nextChapter->chapter_number,
            ] : null,
        ]);
    }
}
