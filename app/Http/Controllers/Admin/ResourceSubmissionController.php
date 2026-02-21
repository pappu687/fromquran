<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserVerseResource;
use App\Models\ResourceType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResourceSubmissionController extends Controller
{
    /**
     * Display the admin resource submissions page
     */
    public function index(Request $request)
    {
        $query = UserVerseResource::with([
            'user:id,name,email',
            'verse:id,verse_key,chapter_id',
            'resourceType:id,slug,name'
        ])->latest();

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhere('resource_url', 'like', "%{$search}%")
                ->orWhere('resource_title', 'like', "%{$search}%")
                ->orWhereHas('resourceType', function ($typeQuery) use ($search) {
                    $typeQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            });
        }

        // Filter by resource type
        if ($request->has('resource_type_id') && $request->resource_type_id !== 'all') {
            $query->where('resource_type_id', $request->resource_type_id);
        }

        $submissions = $query->paginate(20)->withQueryString();

        // Get resource type labels for the filter
        $resourceTypeLabels = ResourceType::orderBy('name')->pluck('name', 'id')->toArray();

        // Get statistics
        $stats = [
            'total' => UserVerseResource::count(),
            'pending' => UserVerseResource::pending()->count(),
            'approved' => UserVerseResource::approved()->count(),
            'rejected' => UserVerseResource::rejected()->count(),
        ];

        return Inertia::render('admin/resource-submissions', [
            'submissions' => $submissions,
            'stats' => $stats,
            'resourceTypeLabels' => $resourceTypeLabels,
            'filters' => [
                'status' => $request->status ?? 'pending',
                'search' => $request->search ?? '',
                'resource_type_id' => $request->resource_type_id ?? 'all',
            ],
        ]);
    }

    /**
     * Approve a resource submission
     */
    public function approve(UserVerseResource $submission)
    {
        $submission->update(['status' => 'approved']);

        return back()->with('success', 'Resource approved successfully.');
    }

    /**
     * Reject a resource submission
     */
    public function reject(UserVerseResource $submission)
    {
        $submission->update(['status' => 'rejected']);

        return back()->with('success', 'Resource rejected successfully.');
    }

    /**
     * Bulk approve submissions
     */
    public function bulkApprove(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:user_verse_resources,id',
        ]);

        UserVerseResource::whereIn('id', $request->ids)->update(['status' => 'approved']);

        return back()->with('success', count($request->ids) . ' resource(s) approved successfully.');
    }

    /**
     * Bulk reject submissions
     */
    public function bulkReject(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:user_verse_resources,id',
        ]);

        UserVerseResource::whereIn('id', $request->ids)->update(['status' => 'rejected']);

        return back()->with('success', count($request->ids) . ' resource(s) rejected successfully.');
    }

    /**
     * Delete a submission
     */
    public function destroy(UserVerseResource $submission)
    {
        $submission->delete();

        return back()->with('success', 'Resource submission deleted successfully.');
    }
}
