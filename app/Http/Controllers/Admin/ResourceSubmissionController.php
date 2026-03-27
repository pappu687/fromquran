<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\ResourceType;
use App\Models\UserChapterResource;
use App\Models\UserVerseResource;
use Illuminate\Contracts\Pagination\LengthAwarePaginator as LengthAwarePaginatorContract;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class ResourceSubmissionController extends Controller
{
    /**
     * Display the admin resource submissions page.
     */
    public function index(Request $request)
    {
        $scope = $request->string('resource_scope')->value() ?: 'all';
        $verseQuery = $this->buildVerseQuery($request);
        $chapterQuery = $this->buildChapterQuery($request);

        $items = collect();

        if (in_array($scope, ['all', 'verse'], true)) {
            $items = $items->concat(
                $verseQuery->get()->map(fn (UserVerseResource $submission) => [
                    'id' => $submission->id,
                    'scope' => 'verse',
                    'user' => $submission->user,
                    'verse' => $submission->verse,
                    'chapter' => null,
                    'resource_type_id' => $submission->resource_type_id,
                    'resource_url' => $submission->resource_url,
                    'resource_title' => $submission->resource_title,
                    'comment' => $submission->comment,
                    'status' => $submission->status,
                    'created_at' => $submission->created_at?->toISOString(),
                    'resource_type' => $submission->resourceType,
                ]),
            );
        }

        if (in_array($scope, ['all', 'chapter'], true)) {
            $items = $items->concat(
                $chapterQuery->get()->map(fn (UserChapterResource $submission) => [
                    'id' => $submission->id,
                    'scope' => 'chapter',
                    'user' => $submission->user,
                    'verse' => null,
                    'chapter' => $submission->chapter,
                    'resource_type_id' => $submission->resource_type_id,
                    'resource_url' => $submission->resource_url,
                    'resource_title' => $submission->resource_title,
                    'comment' => $submission->comment,
                    'status' => $submission->status,
                    'created_at' => $submission->created_at?->toISOString(),
                    'resource_type' => $submission->resourceType,
                ]),
            );
        }

        $sortedItems = $items
            ->sortByDesc(
                fn (array $submission) => strtotime(
                    (string) ($submission['created_at'] ?? 'now'),
                ),
            )
            ->values();

        $submissions = $this->paginateCollection(
            $sortedItems,
            20,
            $request,
        )->withQueryString();

        $resourceTypeLabels = ResourceType::orderBy('name')
            ->pluck('name', 'id')
            ->toArray();
        $chapterOptions = Chapter::orderBy('chapter_number')
            ->get(['id', 'chapter_number', 'name_roman'])
            ->map(fn (Chapter $chapter) => [
                'id' => $chapter->id,
                'chapter_number' => $chapter->chapter_number,
                'name_roman' => $chapter->name_roman,
            ])
            ->values();

        $stats = $this->buildStats($scope);

        return Inertia::render('admin/resource-submissions', [
            'submissions' => $submissions,
            'stats' => $stats,
            'resourceTypeLabels' => $resourceTypeLabels,
            'chapterOptions' => $chapterOptions,
            'filters' => [
                'status' => $request->status ?? 'all',
                'search' => $request->search ?? '',
                'resource_type_id' => $request->resource_type_id ?? 'all',
                'resource_scope' => $scope,
                'chapter_id' => $request->chapter_id ?? 'all',
            ],
        ]);
    }

    /**
     * Approve a resource submission.
     */
    public function approve(Request $request, string $submission)
    {
        $this->resolveSubmission($request, $submission)->update([
            'status' => 'approved',
        ]);

        return back()->with('success', 'Resource approved successfully.');
    }

    /**
     * Reject a resource submission.
     */
    public function reject(Request $request, string $submission)
    {
        $this->resolveSubmission($request, $submission)->update([
            'status' => 'rejected',
        ]);

        return back()->with('success', 'Resource rejected successfully.');
    }

    /**
     * Bulk approve submissions.
     */
    public function bulkApprove(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*.id' => 'required|integer',
            'ids.*.scope' => 'required|string|in:verse,chapter',
        ]);

        collect($request->input('ids', []))
            ->groupBy('scope')
            ->each(function (Collection $group, string $scope) {
                $ids = $group->pluck('id')->all();

                if ($scope === 'chapter') {
                    UserChapterResource::whereIn('id', $ids)->update([
                        'status' => 'approved',
                    ]);

                    return;
                }

                UserVerseResource::whereIn('id', $ids)->update([
                    'status' => 'approved',
                ]);
            });

        return back()->with(
            'success',
            count($request->input('ids', [])) .
                ' resource(s) approved successfully.',
        );
    }

    /**
     * Bulk reject submissions.
     */
    public function bulkReject(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*.id' => 'required|integer',
            'ids.*.scope' => 'required|string|in:verse,chapter',
        ]);

        collect($request->input('ids', []))
            ->groupBy('scope')
            ->each(function (Collection $group, string $scope) {
                $ids = $group->pluck('id')->all();

                if ($scope === 'chapter') {
                    UserChapterResource::whereIn('id', $ids)->update([
                        'status' => 'rejected',
                    ]);

                    return;
                }

                UserVerseResource::whereIn('id', $ids)->update([
                    'status' => 'rejected',
                ]);
            });

        return back()->with(
            'success',
            count($request->input('ids', [])) .
                ' resource(s) rejected successfully.',
        );
    }

    /**
     * Delete a submission.
     */
    public function destroy(Request $request, string $submission)
    {
        $this->resolveSubmission($request, $submission)->delete();

        return back()->with(
            'success',
            'Resource submission deleted successfully.',
        );
    }

    private function buildVerseQuery(Request $request)
    {
        $query = UserVerseResource::with([
            'user:id,name,email',
            'verse:id,verse_key,chapter_id',
            'resourceType:id,slug,name',
        ])->latest();

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })
                    ->orWhere('resource_url', 'like', "%{$search}%")
                    ->orWhere('resource_title', 'like', "%{$search}%")
                    ->orWhereHas(
                        'resourceType',
                        function ($typeQuery) use ($search) {
                            $typeQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('slug', 'like', "%{$search}%");
                        },
                    );
            });
        }

        if (
            $request->has('resource_type_id') &&
            $request->resource_type_id !== 'all'
        ) {
            $query->where('resource_type_id', $request->resource_type_id);
        }

        return $query;
    }

    private function buildChapterQuery(Request $request)
    {
        $query = UserChapterResource::with([
            'user:id,name,email',
            'chapter:id,chapter_number,name_roman,name_arabic',
            'resourceType:id,slug,name',
        ])->latest();

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })
                    ->orWhere('resource_url', 'like', "%{$search}%")
                    ->orWhere('resource_title', 'like', "%{$search}%")
                    ->orWhereHas(
                        'resourceType',
                        function ($typeQuery) use ($search) {
                            $typeQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('slug', 'like', "%{$search}%");
                        },
                    );
            });
        }

        if (
            $request->has('resource_type_id') &&
            $request->resource_type_id !== 'all'
        ) {
            $query->where('resource_type_id', $request->resource_type_id);
        }

        if ($request->has('chapter_id') && $request->chapter_id !== 'all') {
            $query->where('chapter_id', $request->chapter_id);
        }

        return $query;
    }

    private function buildStats(string $scope): array
    {
        $verseTotal = UserVerseResource::count();
        $chapterTotal = UserChapterResource::count();
        $versePending = UserVerseResource::where('status', 'pending')->count();
        $chapterPending = UserChapterResource::where('status', 'pending')->count();
        $verseApproved = UserVerseResource::where('status', 'approved')->count();
        $chapterApproved = UserChapterResource::where('status', 'approved')->count();
        $verseRejected = UserVerseResource::where('status', 'rejected')->count();
        $chapterRejected = UserChapterResource::where('status', 'rejected')->count();

        if ($scope === 'verse') {
            return [
                'total' => $verseTotal,
                'pending' => $versePending,
                'approved' => $verseApproved,
                'rejected' => $verseRejected,
            ];
        }

        if ($scope === 'chapter') {
            return [
                'total' => $chapterTotal,
                'pending' => $chapterPending,
                'approved' => $chapterApproved,
                'rejected' => $chapterRejected,
            ];
        }

        return [
            'total' => $verseTotal + $chapterTotal,
            'pending' => $versePending + $chapterPending,
            'approved' => $verseApproved + $chapterApproved,
            'rejected' => $verseRejected + $chapterRejected,
        ];
    }

    private function resolveSubmission(Request $request, string $submission)
    {
        $scope = $request->string('scope')->value() ?: 'verse';

        if ($scope === 'chapter') {
            return UserChapterResource::findOrFail($submission);
        }

        return UserVerseResource::findOrFail($submission);
    }

    private function paginateCollection(
        Collection $items,
        int $perPage,
        Request $request,
    ): LengthAwarePaginatorContract {
        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $offset = ($currentPage - 1) * $perPage;

        return new LengthAwarePaginator(
            $items->slice($offset, $perPage)->values(),
            $items->count(),
            $perPage,
            $currentPage,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ],
        );
    }
}
