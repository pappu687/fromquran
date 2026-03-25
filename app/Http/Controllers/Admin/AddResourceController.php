<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ResourceType;
use App\Models\UserChapterResource;
use App\Models\UserVerseResource;
use App\Services\ResourceScraper\SearchAdapterFactory;
use App\Services\Solr\ResourceIndexer;
use App\Services\Solr\VerseIndexer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AddResourceController extends Controller
{
    public function index()
    {
        $resourceTypes = \App\Models\ResourceType::orderBy('name')->get();

        $chapters = \App\Models\Chapter::orderBy('chapter_number')
            ->get()
            ->map(function ($chapter) {
                return [
                    'id' => $chapter->id,
                    'number' => $chapter->chapter_number,
                    'name_arabic' => $chapter->name_arabic,
                    'name_roman' => $chapter->name_roman,
                    'verses_count' => $chapter->verses_count,
                ];
            });

        return Inertia::render('admin/add-resource', [
            'resourceTypes' => $resourceTypes,
            'chapters' => $chapters,
        ]);
    }

    public function search(Request $request)
    {
        $request->validate([
            'term' => 'required|string',
            'type' => 'required',
        ]);

        $term = $request->term;
        $results = [];

        try {
            $resourceType = ResourceType::findOrFail($request->type);
            $adapter = SearchAdapterFactory::make($resourceType->slug);

            if ($adapter) {
                $results = $adapter->search($term);

                // Highlight search term in results
                $pattern = '/'.preg_quote($term, '/').'/i';
                $replacement = '<span style="background-color: #f97316; color: white; padding: 0 4px; border-radius: 4px; font-weight: bold;">$0</span>';

                foreach ($results as &$res) {
                    if (isset($res['title'])) {
                        $res['title'] = preg_replace($pattern, $replacement, $res['title']);
                    }
                    if (isset($res['description'])) {
                        $res['description'] = preg_replace($pattern, $replacement, $res['description']);
                    }
                }
            } else {
                Log::info("No search adapter found for resource type slug: {$resourceType->slug}");
            }
        } catch (\Exception $e) {
            Log::error('Search failed: '.$e->getMessage());
        }

        return response()->json(['results' => $results]);
    }

    public function store(Request $request, ResourceIndexer $resourceIndexer, VerseIndexer $verseIndexer)
    {
        $request->validate([
            'chapter_id' => 'required',
            'resource_type_id' => 'required',
            'resources' => 'required|array',
            'resources.*.url' => 'required|url',
            'resources.*.title' => 'required|string',
            'resources.*.description' => 'nullable|string',
            'resources.*.thumbnail_url' => 'nullable|url',
        ]);

        $userId = Auth::id() ?? 1; // Fallback for dev if needed

        $chapterId = $request->chapter_id;
        $verseId = $request->verse_id;
        $resourceTypeId = $request->resource_type_id;

        foreach ($request->resources as $res) {
            if ($verseId && $verseId !== 'all') {
                $resource = UserVerseResource::create([
                    'user_id' => $userId,
                    'verse_id' => $verseId,
                    'resource_type_id' => $resourceTypeId,
                    'resource_url' => $res['url'],
                    'resource_title' => $res['title'],
                    'comment' => $res['description'] ?? null,
                    'thumbnail_url' => $res['thumbnail_url'] ?? null,
                    'status' => 'approved', // Admin adds default to approved
                ]);

                $resourceIndexer->indexVerseResource($resource);
                $verseIndexer->reindexVerse((int) $verseId);
            } else {
                $resource = UserChapterResource::create([
                    'user_id' => $userId,
                    'chapter_id' => $chapterId,
                    'resource_type_id' => $resourceTypeId,
                    'resource_url' => $res['url'],
                    'resource_title' => $res['title'],
                    'comment' => $res['description'] ?? null,
                    'thumbnail_url' => $res['thumbnail_url'] ?? null,
                    'status' => 'approved',
                ]);

                $resourceIndexer->indexChapterResource($resource);
                $verseIndexer->reindexChapter((int) $chapterId);
            }
        }

        return redirect()->back()->with('success', 'Resources added successfully.');
    }
}
