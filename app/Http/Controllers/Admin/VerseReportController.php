<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VerseReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VerseReportController extends Controller
{
    public function index(Request $request): Response
    {
        $query = VerseReport::with([
            'user:id,name,email',
            'verse:id,verse_key,verse_number,chapter_id',
            'chapter:id,chapter_number,name_simple,name_arabic',
        ])->latest();

        if ($request->filled('status') && $request->string('status')->value() !== 'all') {
            $query->where('status', $request->string('status')->value());
        }

        if ($request->filled('type') && $request->string('type')->value() !== 'all') {
            $query->where('type', $request->string('type')->value());
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->trim()->value();

            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('description', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('verse', function ($verseQuery) use ($search) {
                        $verseQuery->where('verse_key', 'like', "%{$search}%");
                    })
                    ->orWhereHas('chapter', function ($chapterQuery) use ($search) {
                        $chapterQuery
                            ->where('name_simple', 'like', "%{$search}%")
                            ->orWhere('name_arabic', 'like', "%{$search}%");
                    });
            });
        }

        $reports = $query->paginate(20)->withQueryString();

        $stats = [
            'total' => VerseReport::count(),
            'pending' => VerseReport::where('status', 'pending')->count(),
            'resolved' => VerseReport::where('status', 'resolved')->count(),
            'dismissed' => VerseReport::where('status', 'dismissed')->count(),
        ];

        $typeOptions = VerseReport::query()
            ->select('type')
            ->distinct()
            ->orderBy('type')
            ->pluck('type')
            ->values();

        return Inertia::render('admin/verse-reports', [
            'reports' => $reports,
            'stats' => $stats,
            'typeOptions' => $typeOptions,
            'filters' => [
                'status' => $request->input('status', 'pending'),
                'type' => $request->input('type', 'all'),
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    public function resolve(VerseReport $report): RedirectResponse
    {
        $report->update(['status' => 'resolved']);

        return back()->with('success', 'Verse report marked as resolved.');
    }

    public function dismiss(VerseReport $report): RedirectResponse
    {
        $report->update(['status' => 'dismissed']);

        return back()->with('success', 'Verse report dismissed.');
    }
}
