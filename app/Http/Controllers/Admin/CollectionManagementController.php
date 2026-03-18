<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CollectionManagementController extends Controller
{
    /**
     * Display a listing of collections for moderation.
     */
    public function index(Request $request)
    {
        $query = Collection::withTrashed()
            ->with(['user:id,name,email'])
            ->withCount('verses')
            ->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('visibility') && $request->visibility !== 'all') {
            $query->where('is_public', $request->visibility === 'public');
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $collections = $query->paginate(20)->withQueryString();

        $stats = [
            'total' => Collection::count(),
            'pending' => Collection::where('status', 'pending')->count(),
            'approved' => Collection::where('status', 'approved')->count(),
            'rejected' => Collection::where('status', 'rejected')->count(),
        ];

        return Inertia::render('admin/collections', [
            'collections' => $collections,
            'stats' => $stats,
            'filters' => [
                'status' => $request->status ?? 'all',
                'visibility' => $request->visibility ?? 'all',
                'search' => $request->search ?? '',
            ],
        ]);
    }

    /**
     * Approve a collection.
     */
    public function approve(Collection $collection)
    {
        $collection->update(['status' => 'approved']);

        return back()->with('success', 'Collection approved successfully.');
    }

    /**
     * Reject a collection.
     */
    public function reject(Collection $collection)
    {
        $collection->update(['status' => 'rejected']);

        return back()->with('success', 'Collection rejected successfully.');
    }

    /**
     * Delete a collection.
     */
    public function destroy(Collection $collection)
    {
        $collection->delete();

        return back()->with('success', 'Collection deleted successfully.');
    }
}
