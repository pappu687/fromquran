<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserChapterResourceRequest;
use App\Models\UserChapterResource;
use Illuminate\Http\Request;

class UserChapterResourceController extends Controller
{
    /**
     * Store a newly created chapter resource submission.
     */
    public function store(StoreUserChapterResourceRequest $request)
    {
        $resource = UserChapterResource::create([
            'user_id' => $request->user()->id,
            'chapter_id' => $request->chapter_id,
            'resource_type_id' => $request->resource_type_id,
            'resource_url' => $request->resource_url,
            'comment' => $request->comment,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Resource submitted successfully and is pending approval.',
            'resource' => $resource,
        ], 201);
    }
}
