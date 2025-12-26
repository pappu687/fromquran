<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserVerseResource;
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
            ->select('id', 'verse_id', 'resource_type', 'resource_url', 'comment', 'user_id', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $resources,
        ]);
    }

    /**
     * Get approved resources for a single verse (legacy endpoint)
     */
    public function show($verseId)
    {
        $resources = UserVerseResource::with('user:id,name')
            ->where('verse_id', $verseId)
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $resources,
        ]);
    }
}
