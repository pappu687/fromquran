<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserVerseResource;
use Illuminate\Http\Request;

class VerseResourceController extends Controller
{
    /**
     * Get approved resources for a verse
     */
    public function index($verseId)
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
