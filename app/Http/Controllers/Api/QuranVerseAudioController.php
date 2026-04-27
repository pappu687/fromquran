<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\QuranVerseAudioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QuranVerseAudioController extends Controller
{
    public function __construct(private readonly QuranVerseAudioService $service) {}

    public function navigation(string $chapterId, string $verseNumber): JsonResponse
    {
        $verseKey = "{$chapterId}:{$verseNumber}";

        return response()->json($this->service->getNavigation($verseKey));
    }

    public function verseAudio(Request $request, string $chapterId, string $verseNumber): JsonResponse
    {
        $validated = Validator::make($request->query(), [
            'recitation_id' => ['required', 'integer', 'min:1'],
        ])->validate();

        $verseKey = "{$chapterId}:{$verseNumber}";

        return response()->json($this->service->getVerseAudio(
            $verseKey,
            (int) $validated['recitation_id'],
        ));
    }

    private function validateVerseKey(string $verseKey): void
    {
        Validator::make(['verseKey' => $verseKey], [
            'verseKey' => ['required', 'regex:/^\d+:\d+$/'],
        ])->validate();
    }
}
