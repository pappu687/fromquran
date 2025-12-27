<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Verse;
use App\Models\Translation;
use App\Models\Chapter;
use App\Models\Language;
use App\Models\ResourceContent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class VerseController extends Controller
{
    /**
     * Display the verses management page (Inertia).
     */
    public function index(Request $request): InertiaResponse
    {
        $query = Verse::query()->with(['chapter', 'translations']);

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('verse_key', 'like', "%{$search}%")
                    ->orWhere('text_uthmani', 'like', "%{$search}%")
                    ->orWhere('text_imlaei_simple', 'like', "%{$search}%")
                    ->orWhereHas('chapter', function ($chapterQuery) use ($search) {
                        $chapterQuery->where('name_simple', 'like', "%{$search}%")
                            ->orWhere('name_arabic', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by chapter
        if ($request->has('chapter_id') && $request->chapter_id !== 'all') {
            $query->where('chapter_id', $request->chapter_id);
        }

        // Filter by juz
        if ($request->has('juz_number') && $request->juz_number !== 'all') {
            $query->where('juz_number', $request->juz_number);
        }

        // Filter by page
        if ($request->has('page_number') && $request->page_number) {
            $query->where('page_number', $request->page_number);
        }

        // Sort
        $sortColumn = $request->query('sort_column', 'verse_index');
        $sortDirection = $request->query('sort_direction', 'asc');

        if (in_array($sortColumn, ['id', 'verse_key', 'verse_number', 'chapter_id', 'juz_number', 'page_number', 'verse_index'])) {
            $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('verse_index', 'asc');
        }

        // Paginate
        $perPage = $request->query('per_page', 15);
        $verses = $query->paginate($perPage)->withQueryString();

        // Get all chapters for filtering
        $chapters = Chapter::select('id', 'chapter_number', 'name_simple', 'name_arabic')
            ->orderBy('chapter_number')
            ->get();

        // Get statistics
        $stats = [
            'total_verses' => Verse::count(),
            'total_translations' => Translation::count(),
            'total_chapters' => Chapter::count(),
            'total_juzs' => Verse::distinct('juz_number')->count('juz_number'),
        ];

        return Inertia::render('admin/verses', [
            'verses' => $verses,
            'chapters' => $chapters,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search ?? '',
                'chapter_id' => $request->chapter_id ?? 'all',
                'juz_number' => $request->juz_number ?? 'all',
                'page_number' => $request->page_number ?? '',
                'sort_column' => $sortColumn,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Display translations for verses.
     */
    public function translations(Request $request): InertiaResponse
    {
        $query = Translation::query()
            ->with(['verse', 'chapter', 'language', 'resourceContent']);

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('text', 'like', "%{$search}%")
                    ->orWhere('verse_key', 'like', "%{$search}%")
                    ->orWhere('resource_name', 'like', "%{$search}%")
                    ->orWhere('language_name', 'like', "%{$search}%");
            });
        }

        // Filter by chapter
        if ($request->has('chapter_id') && $request->chapter_id !== 'all') {
            $query->where('chapter_id', $request->chapter_id);
        }

        // Filter by language
        if ($request->has('language_id') && $request->language_id !== 'all') {
            $query->where('language_id', $request->language_id);
        }

        // Filter by resource
        if ($request->has('resource_id') && $request->resource_id !== 'all') {
            $query->whereHas('resourceContent', function ($q) use ($request) {
                $q->where('resource_id', $request->resource_id);
            });
        }

        // Sort
        $sortColumn = $request->query('sort_column', 'verse_key');
        $sortDirection = $request->query('sort_direction', 'asc');

        if (in_array($sortColumn, ['id', 'verse_key', 'verse_number', 'chapter_id', 'language_name', 'resource_name'])) {
            $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('verse_key', 'asc');
        }

        // Paginate
        $perPage = $request->query('per_page', 15);
        $translations = $query->paginate($perPage)->withQueryString();

        // Get all chapters for filtering
        $chapters = Chapter::select('id', 'chapter_number', 'name_simple', 'name_arabic')
            ->orderBy('chapter_number')
            ->get();

        // Get all languages for filtering
        $languages = Language::select('id', 'name', 'iso_code')
            ->orderBy('name')
            ->get();

        // Get all resources for filtering
        $resources = ResourceContent::select('id', 'resource_id', 'name', 'author_name')
            ->where('resource_type', 'translation')
            ->distinct('resource_id')
            ->orderBy('name')
            ->get();

        // Get statistics
        $stats = [
            'total_translations' => Translation::count(),
            'total_languages' => Language::count(),
            'total_resources' => ResourceContent::where('resource_type', 'translation')->distinct('resource_id')->count('resource_id'),
            'avg_translations_per_verse' => round(Translation::count() / max(Verse::count(), 1), 2),
        ];

        return Inertia::render('admin/translations', [
            'translations' => $translations,
            'chapters' => $chapters,
            'languages' => $languages,
            'resources' => $resources,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search ?? '',
                'chapter_id' => $request->chapter_id ?? 'all',
                'language_id' => $request->language_id ?? 'all',
                'resource_id' => $request->resource_id ?? 'all',
                'sort_column' => $sortColumn,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Display the specified verse.
     */
    public function show($id): JsonResponse
    {
        $verse = Verse::with([
            'chapter',
            'translations.language',
            'translations.resourceContent',
            'words',
            'tafsirs',
        ])->findOrFail($id);

        return response()->json($verse);
    }
}
