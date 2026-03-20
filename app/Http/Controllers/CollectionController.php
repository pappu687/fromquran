<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use App\Models\Verse;
use App\Services\TagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class CollectionController extends Controller
{
    public function __construct(
        protected TagService $tagService,
    ) {
    }

    /**
     * Display a listing of the user's collections.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        $collections = $this->applyTagFilters(
            $user->collections()
                ->with('tags')
                ->withCount('verses')
                ->orderBy('created_at', 'desc'),
            $request,
        )->get();

        return response()->json($collections);
    }

    /**
     * Display a listing of all public collections.
     */
    public function publicIndex(Request $request): JsonResponse
    {
        $collections = $this->applyTagFilters(
            Collection::where('is_public', true)
                ->where('status', 'approved')
                ->with('tags')
                ->withCount('verses')
                ->orderBy('created_at', 'desc'),
            $request,
        )->get();

        return response()->json($collections);
    }

    /**
     * Store a newly created collection in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Enforce maximum number of collections per user
        $maxCollections = (int) config('quran.max_collections', 50);
        $currentCount = $user->collections()->count();
        if ($currentCount >= $maxCollections) {
            return response()->json([
                'message' => 'You have reached the maximum number of collections.',
                'max_collections' => $maxCollections,
            ], 422);
        }

        $validated = $this->validateCollectionPayload($request, false);

        $collection = $user->collections()->create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? '#3b82f6',
            'is_public' => $validated['is_public'] ?? false,
            'status' => ($validated['is_public'] ?? false)
                ? 'pending'
                : 'approved',
        ]);

        $this->syncCollectionTags($collection, $validated);

        $collection->load(['tags'])->loadCount('verses');

        return response()->json($collection, 201);
    }

    /**
     * Display the specified collection.
     */
    public function show(string $slug): JsonResponse
    {
        $collection = Collection::where('slug', $slug)
            ->with('tags')
            ->withCount('verses')
            ->firstOrFail();

        $user = Auth::user();
        $ownsCollection = $user && $collection->user_id === $user->id;

        // Check if user owns the collection or if it's an approved public collection
        if (
            !$ownsCollection &&
            (!$collection->is_public || $collection->status !== 'approved')
        ) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $collection->load([
            'tags',
            'verses' => function ($query) {
                $query->with('chapter')->orderBy('collection_verse.display_order');
            }
        ]);

        return response()->json($collection);
    }

    /**
     * Update the specified collection in storage.
     */
    public function update(Request $request, string $slug): JsonResponse
    {
        $collection = Collection::where('slug', $slug)->firstOrFail();

        // Check ownership
        if ($collection->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $this->validateCollectionPayload($request, true);

        $isPublic = $validated['is_public'] ?? $collection->is_public;
        $status = $collection->status;

        if (
            ($isPublic && !$collection->is_public) ||
            ($isPublic && $collection->status === 'rejected')
        ) {
            $status = 'pending';
        }

        $collection->update([
            'name' => $validated['name'] ?? $collection->name,
            'description' => $validated['description'] ?? $collection->description,
            'color' => $validated['color'] ?? $collection->color,
            'is_public' => $isPublic,
            'status' => $status,
        ]);

        if (array_key_exists('tags', $validated)) {
            $this->syncCollectionTags($collection, $validated);
        }

        $collection->load(['tags'])->loadCount('verses');

        return response()->json($collection);
    }

    /**
     * Remove the specified collection from storage.
     */
    public function destroy(string $slug): JsonResponse
    {
        $collection = Collection::where('slug', $slug)->firstOrFail();

        // Check ownership
        if ($collection->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $collection->delete();

        return response()->json(['message' => 'Collection deleted'], 200);
    }

    /**
     * Add a verse to a collection.
     */
    public function addVerse(Request $request, string $slug): JsonResponse
    {
        $collection = Collection::where('slug', $slug)->firstOrFail();

        // Check ownership
        if ($collection->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'verse_id' => 'required|integer|exists:verses,id',
        ]);

        $success = $collection->addVerse($validated['verse_id']);

        if (!$success) {
            return response()->json(['message' => 'Verse already in collection'], 409);
        }

        $collection->loadCount('verses');

        return response()->json([
            'message' => 'Verse added to collection',
            'collection' => $collection
        ], 200);
    }

    /**
     * Remove a verse from a collection.
     */
    public function removeVerse(Request $request, string $slug): JsonResponse
    {
        $collection = Collection::where('slug', $slug)->firstOrFail();

        // Check ownership
        if ($collection->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'verse_id' => 'required|integer|exists:verses,id',
        ]);

        $collection->removeVerse($validated['verse_id']);

        $collection->loadCount('verses');

        return response()->json([
            'message' => 'Verse removed from collection',
            'collection' => $collection
        ], 200);
    }

    /**
     * Reorder verses in a collection.
     */
    public function reorderVerses(Request $request, string $slug): JsonResponse
    {
        $collection = Collection::where('slug', $slug)->firstOrFail();

        // Check ownership
        if ($collection->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'verses' => 'required|array',
            'verses.*.verse_id' => 'required|integer|exists:verses,id',
            'verses.*.display_order' => 'required|integer',
        ]);

        $collection->reorderVerses($validated['verses']);

        return response()->json(['message' => 'Verses reordered'], 200);
    }

    /**
     * Get collections that contain a specific verse.
     */
    public function getCollectionsForVerse(Request $request, int $verseId): JsonResponse
    {
        $verse = Verse::findOrFail($verseId);

        $user = Auth::user();

        // Get user's collections with whether they contain this verse
        $collections = $user->collections()
            ->with('tags')
            ->withCount('verses')
            ->get()
            ->map(function ($collection) use ($verse) {
                $collection->contains_verse = $collection->hasVerse($verse->id);
                return $collection;
            });

        return response()->json($collections);
    }

    /**
     * Toggle a verse in collections.
     */
    public function toggleVerse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'verse_id' => 'required_without:range|integer|exists:verses,id',
            'range' => 'nullable|array',
            'range.chapter_id' => 'required_with:range|integer|exists:chapters,id',
            'range.from' => 'required_with:range|integer|min:1',
            'range.to' => 'required_with:range|integer|min:1',
            'collection_ids' => 'required|array',
            'collection_ids.*' => 'integer|exists:collections,id',
        ]);

        $user = Auth::user();
        $collectionIds = $validated['collection_ids'];

        // Verify user owns all collections
        $collections = $user->collections()->whereIn('id', $collectionIds)->get();
        if ($collections->count() !== count($collectionIds)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $verseIds = [];
        if ($request->has('range')) {
            $range = $validated['range'];
            $verseIds = Verse::where('chapter_id', $range['chapter_id'])
                ->whereBetween('verse_number', [$range['from'], $range['to']])
                ->pluck('id')
                ->toArray();
        } else {
            $verseIds = [$validated['verse_id']];
        }

        if (empty($verseIds)) {
            return response()->json(['message' => 'No verses found in the specified range'], 422);
        }

        // Add verses to each collection
        foreach ($collections as $collection) {
            foreach ($verseIds as $vId) {
                $collection->addVerse($vId);
            }
        }

        $message = count($verseIds) > 1
            ? count($verseIds) . " verses added to collections"
            : "Verse added to collections";

        return response()->json(['message' => $message], 200);
    }

    /**
     * Validate collection create/update payloads.
     *
     * @throws ValidationException
     */
    protected function validateCollectionPayload(Request $request, bool $isUpdate): array
    {
        $validated = $request->validate([
            'name' => $isUpdate ? 'sometimes|required|string|max:255' : 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'color' => 'nullable|string|regex:/^#?[A-Fa-f0-9]{6}$/',
            'is_public' => 'nullable|boolean',
            'tags' => 'sometimes|array',
            'tags.*.name' => 'required_with:tags|string|max:255',
            'tags.*.slug' => 'nullable|string|max:255',
            'tags.*.type' => 'nullable|string|max:100',
        ]);

        if (array_key_exists('tags', $validated)) {
            $normalizedTags = $this->tagService->normalizePayload($validated['tags']);

            if ($normalizedTags->count() !== count($validated['tags'])) {
                throw ValidationException::withMessages([
                    'tags' => 'Tags must be unique after normalization.',
                ]);
            }
        }

        return $validated;
    }

    /**
     * Sync tags onto a collection.
     */
    protected function syncCollectionTags(Collection $collection, array $validated): void
    {
        $this->tagService->syncTags($collection, $validated['tags'] ?? []);
    }

    /**
     * Apply tag filters to collection listing queries.
     */
    protected function applyTagFilters($query, Request $request)
    {
        $validated = $request->validate([
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:255',
            'tag_type' => 'nullable|string|max:100',
        ]);

        $tagType = $validated['tag_type'] ?? null;

        foreach ($validated['tags'] ?? [] as $tagSlug) {
            $query->whereHas('tags', function ($tagQuery) use ($tagSlug, $tagType) {
                $tagQuery->where('slug', $tagSlug);

                if ($tagType) {
                    $tagQuery->where('type', $tagType);
                }
            });
        }

        return $query;
    }
}
