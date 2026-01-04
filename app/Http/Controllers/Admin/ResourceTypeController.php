<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ResourceType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ResourceTypeController extends Controller
{
    /**
     * Display the resource types management page (Inertia).
     */
    public function index(Request $request): InertiaResponse
    {
        $query = ResourceType::query()->withCount('userVerseResources');

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortColumn = $request->query('sort_column', 'display_order');
        $sortDirection = $request->query('sort_direction', 'asc');

        if (in_array($sortColumn, ['id', 'name', 'slug', 'display_order', 'created_at', 'user_verse_resources_count'])) {
            $query->orderBy($sortColumn, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('display_order', 'asc');
        }

        // Paginate
        $perPage = $request->query('per_page', 10);
        $resourceTypes = $query->paginate($perPage)->withQueryString();

        return Inertia::render('admin/resource-types', [
            'resourceTypes' => $resourceTypes,
            'filters' => [
                'search' => $request->search ?? '',
                'sort_column' => $sortColumn,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Store a newly created resource type in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug' => 'required|string|max:255|unique:resource_types,slug',
            'name' => 'required|string|max:255',
            'display_order' => 'nullable|integer|min:0',
        ]);

        $resourceType = ResourceType::create([
            'slug' => $validated['slug'],
            'name' => $validated['name'],
            'display_order' => $validated['display_order'] ?? 0,
        ]);

        return response()->json($resourceType, 201);
    }

    /**
     * Display the specified resource type.
     */
    public function show($id): JsonResponse
    {
        $resourceType = ResourceType::withCount('userVerseResources')->findOrFail($id);

        return response()->json($resourceType);
    }

    /**
     * Update the specified resource type in storage.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $resourceType = ResourceType::findOrFail($id);

        $validated = $request->validate([
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('resource_types')->ignore($resourceType->id),
            ],
            'name' => 'sometimes|required|string|max:255',
            'display_order' => 'nullable|integer|min:0',
        ]);

        $resourceType->update($validated);

        return response()->json($resourceType);
    }

    /**
     * Remove the specified resource type from storage.
     */
    public function destroy($id): JsonResponse
    {
        $resourceType = ResourceType::findOrFail($id);

        // Check if there are associated resources
        if ($resourceType->userVerseResources()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete resource type with associated resources. Please reassign or delete the resources first.',
            ], 403);
        }

        $resourceType->delete();

        return response()->json(['message' => 'Resource type deleted successfully']);
    }

    /**
     * Get all resource types for dropdown/select.
     */
    public function list(): JsonResponse
    {
        $resourceTypes = ResourceType::ordered()->get(['id', 'slug', 'name']);

        return response()->json($resourceTypes);
    }
}
