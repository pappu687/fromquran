<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Models\UserVerseResource;
use App\Models\UserChapterResource;
use App\Models\ResourceType;
use App\Services\ResourceScraper\SearchAdapterFactory;

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
            'chapters' => $chapters
        ]);
    }

    public function search(Request $request)
    {
        $request->validate([
            'term' => 'required|string',
            'type' => 'required'
        ]);

        $term = $request->term;
        $results = [];

        try {
            $resourceType = ResourceType::findOrFail($request->type);
            $adapter = SearchAdapterFactory::make($resourceType->slug);

            if ($adapter) {
                $results = $adapter->search($term);
            } else {
                Log::info("No search adapter found for resource type slug: {$resourceType->slug}");
            }
        } catch (\Exception $e) {
            Log::error('Search failed: ' . $e->getMessage());
        }

        return response()->json(['results' => $results]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'chapter_id' => 'required',
            'resource_type_id' => 'required',
            'resources' => 'required|array',
            'resources.*.url' => 'required|url',
            'resources.*.title' => 'required|string',
            'resources.*.thumbnail_url' => 'nullable|url',
        ]);

        $userId = Auth::id() ?? 1; // Fallback for dev if needed

        $chapterId = $request->chapter_id;
        $verseId = $request->verse_id;
        $resourceTypeId = $request->resource_type_id;

        foreach ($request->resources as $res) {
            if ($verseId && $verseId !== 'all') {
                UserVerseResource::create([
                    'user_id' => $userId,
                    'verse_id' => $verseId,
                    'resource_type_id' => $resourceTypeId,
                    'resource_url' => $res['url'],
                    'resource_title' => $res['title'],
                    'thumbnail_url' => $res['thumbnail_url'] ?? null,
                    'status' => 'approved', // Admin adds default to approved
                ]);
            } else {
                UserChapterResource::create([
                    'user_id' => $userId,
                    'chapter_id' => $chapterId,
                    'resource_type_id' => $resourceTypeId,
                    'resource_url' => $res['url'],
                    'resource_title' => $res['title'],
                    'thumbnail_url' => $res['thumbnail_url'] ?? null,
                    'status' => 'approved',
                ]);
            }
        }

        return redirect()->back()->with('success', 'Resources added successfully.');
    }
}
