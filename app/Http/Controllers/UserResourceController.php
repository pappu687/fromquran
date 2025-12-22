<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserVerseResourceRequest;
use App\Models\UserVerseResource;
use Illuminate\Http\Request;

class UserResourceController extends Controller
{
    /**
     * Store a newly created resource submission.
     */
    public function store(StoreUserVerseResourceRequest $request)
    {
        $resource = UserVerseResource::create([
            'user_id' => $request->user()->id,
            'verse_id' => $request->verse_id,
            'resource_type' => $request->resource_type,
            'resource_url' => $request->resource_url,
            'comment' => $request->comment,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Resource submitted successfully and is pending approval.',
            'resource' => $resource,
        ], 201);
    }

    /**
     * Get all resources submitted by the authenticated user.
     */
    public function index(Request $request)
    {
        $resources = UserVerseResource::where('user_id', $request->user()->id)
            ->with('verse:id,verse_key,chapter_id')
            ->latest()
            ->paginate(20);

        return response()->json($resources);
    }

    /**
     * Get pending resources for admin review.
     * This will be used by admin panel later.
     */
    public function pending(Request $request)
    {
        $resources = UserVerseResource::pending()
            ->with(['user:id,name,email', 'verse:id,verse_key,chapter_id'])
            ->latest()
            ->paginate(50);

        return response()->json($resources);
    }
}
