<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VerseReport;
use App\Mail\VerseReportAdminEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class VerseReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'chapter_id' => ['required', 'integer'],
            'verse_id' => ['required', 'integer'],
            'type' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:1000'],
        ]);

        $report = VerseReport::create([
            'user_id' => Auth::id(),
            'chapter_id' => $validated['chapter_id'],
            'verse_id' => $validated['verse_id'],
            'type' => $validated['type'],
            'description' => $validated['description'],
            'status' => 'pending',
        ]);

        // Send Email to Admin
        $adminEmail = config('mail.from.address');
        if ($adminEmail) {
            Mail::to($adminEmail)->send(new VerseReportAdminEmail($report));
        }

        return response()->json([
            'message' => 'Report submitted successfully. Thank you for your feedback!',
            'data' => $report,
        ], 201);
    }
}
