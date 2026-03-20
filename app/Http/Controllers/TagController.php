<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TagController extends Controller
{
    /**
     * List active tags for discovery and picker suggestions.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'nullable|string|max:100',
            'search' => 'nullable|string|max:255',
        ]);

        $query = Tag::query()
            ->active()
            ->orderBy('type')
            ->orderBy('name');

        if (! empty($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (! empty($validated['search'])) {
            $search = trim($validated['search']);
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        return response()->json($query->get());
    }
}
