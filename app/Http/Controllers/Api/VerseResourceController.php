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
            ->get()
            ->map(function ($resource) {
                $resource->is_truncated = \Illuminate\Support\Str::wordCount($resource->comment) > 50;
                $resource->comment = \Illuminate\Support\Str::words($resource->comment, 50, '...');
                return $resource;
            });

        return response()->json([
            'data' => $resources,
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
}
