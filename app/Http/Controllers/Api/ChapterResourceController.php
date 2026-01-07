<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserChapterResource;
use Illuminate\Http\Request;

class ChapterResourceController extends Controller
{
    /**
     * Get approved resources for a single chapter
     */
    public function show($chapterId)
    {
        $resources = UserChapterResource::with(['user:id,name', 'resourceType:id,name'])
            ->where('chapter_id', $chapterId)
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $resources,
        ]);
    }
}
