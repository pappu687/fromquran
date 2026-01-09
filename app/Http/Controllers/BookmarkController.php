<?php

namespace App\Http\Controllers;

use App\Models\QuranBookmark;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BookmarkController extends Controller
{
    /**
     * Get all bookmarks for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $chapterId = $request->get('chapter_id');
        $edition = $request->get('edition', 'en.sahih');

        $query = QuranBookmark::forUser($user->id)
            ->forEdition($edition)
            ->orderBy('created_at', 'desc');

        if ($chapterId) {
            $query->forChapter($chapterId);
        }

        $bookmarks = $query->get();

        return response()->json([
            'data' => $bookmarks,
            'count' => $bookmarks->count()
        ]);
    }

    /**
     * Add a new bookmark.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'chapter_id' => 'required|integer|min:1|max:114',
            'verse_number' => 'required|integer|min:1',
            'verse_id' => 'required|string',
            'verse_data' => 'nullable|array',
            'notes' => 'nullable|string|max:1000',
            'edition' => 'nullable|string|max:20'
        ]);

        $user = Auth::user();
        $edition = $validated['edition'] ?? 'en.sahih';

        // Check if bookmark already exists
        $existingBookmark = QuranBookmark::where('user_id', $user->id)
            ->where('verse_id', $validated['verse_id'])
            ->where('edition', $edition)
            ->first();

        if ($existingBookmark) {
            return response()->json([
                'message' => 'Bookmark already exists',
                'bookmark' => $existingBookmark
            ], 409);
        }

        $bookmark = QuranBookmark::create([
            'user_id' => $user->id,
            'chapter_id' => $validated['chapter_id'],
            'verse_number' => $validated['verse_number'],
            'verse_id' => $validated['verse_id'],
            'verse_data' => $validated['verse_data'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'edition' => $edition,
        ]);

        return response()->json([
            'message' => 'Bookmark added successfully',
            'bookmark' => $bookmark
        ], 201);
    }

    /**
     * Get a specific bookmark.
     */
    public function show(QuranBookmark $bookmark): JsonResponse
    {
        // Ensure the bookmark belongs to the authenticated user
        if ($bookmark->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($bookmark);
    }

    /**
     * Update a bookmark (mainly for notes).
     */
    public function update(Request $request, QuranBookmark $bookmark): JsonResponse
    {
        // Ensure the bookmark belongs to the authenticated user
        if ($bookmark->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000'
        ]);

        $bookmark->update($validated);

        return response()->json([
            'message' => 'Bookmark updated successfully',
            'bookmark' => $bookmark
        ]);
    }

    /**
     * Remove a bookmark.
     */
    public function destroy(QuranBookmark $bookmark): JsonResponse
    {
        // Ensure the bookmark belongs to the authenticated user
        if ($bookmark->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $bookmark->delete();

        return response()->json([
            'message' => 'Bookmark removed successfully'
        ]);
    }

    /**
     * Check if a verse is bookmarked by the user.
     */
    public function check(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'verse_id' => 'required|string',
            'edition' => 'nullable|string|max:20'
        ]);

        $user = Auth::user();
        $edition = $validated['edition'] ?? 'en.sahih';

        $bookmark = QuranBookmark::where('user_id', $user->id)
            ->where('verse_id', $validated['verse_id'])
            ->where('edition', $edition)
            ->first();

        return response()->json([
            'is_bookmarked' => $bookmark !== null,
            'bookmark' => $bookmark
        ]);
    }

    /**
     * Get bookmarks statistics.
     */
    public function stats(): JsonResponse
    {
        $user = Auth::user();

        $totalBookmarks = QuranBookmark::where('user_id', $user->id)->count();
        $bookmarksByChapter = QuranBookmark::where('user_id', $user->id)
            ->selectRaw('chapter_id, COUNT(*) as count')
            ->groupBy('chapter_id')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();

        $recentBookmarks = QuranBookmark::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'total_bookmarks' => $totalBookmarks,
            'bookmarks_by_chapter' => $bookmarksByChapter,
            'recent_bookmarks' => $recentBookmarks
        ]);
    }
}
