<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\QuranFoundationClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Throwable;

class QuranFoundationController extends Controller
{
    public function __construct(private readonly QuranFoundationClient $client) {}

    public function recitations(Request $request): JsonResponse
    {
        return $this->proxy($request, '/resources/recitations');
    }

    public function recitationInfo(Request $request, string $id): JsonResponse
    {
        $this->validateNumericId($id, 'id');

        return $this->proxy($request, "/resources/recitations/{$id}/info");
    }

    public function translations(Request $request): JsonResponse
    {
        return $this->proxy($request, '/resources/translations');
    }

    public function translationInfo(Request $request, string $id): JsonResponse
    {
        $this->validateNumericId($id, 'id');

        return $this->proxy($request, "/resources/translations/{$id}/info");
    }

    public function tafsirs(Request $request): JsonResponse
    {
        return $this->proxy($request, '/resources/tafsirs');
    }

    public function tafsirInfo(Request $request, string $id): JsonResponse
    {
        $this->validateNumericId($id, 'id');

        return $this->proxy($request, "/resources/tafsirs/{$id}/info");
    }

    public function languages(Request $request): JsonResponse
    {
        return $this->proxy($request, '/resources/languages');
    }

    public function chapterInfos(Request $request): JsonResponse
    {
        return $this->proxy($request, '/resources/chapter_infos');
    }

    public function chapterReciters(Request $request): JsonResponse
    {
        return $this->proxy($request, '/resources/chapter_reciters');
    }

    public function recitationStyles(Request $request): JsonResponse
    {
        return $this->proxy($request, '/resources/recitation_styles');
    }

    public function verseMedia(Request $request): JsonResponse
    {
        return $this->proxy($request, '/resources/verse_media');
    }

    public function chapterRecitations(Request $request, string $chapterId): JsonResponse
    {
        $this->validateNumericId($chapterId, 'chapterId');

        return $this->proxy($request, "/chapter_recitations/{$chapterId}");
    }

    public function chapterRecitation(Request $request, string $chapterId, string $recitationId): JsonResponse
    {
        $this->validateChapterId($chapterId);
        $this->validateNumericId($recitationId, 'recitationId');

        return $this->proxy($request, "/chapter_recitations/{$recitationId}/{$chapterId}");
    }

    public function verseRecitationsByChapter(Request $request, string $chapterId, string $recitationId): JsonResponse
    {
        $this->validateChapterId($chapterId);
        $this->validateNumericId($recitationId, 'recitationId');

        return $this->proxy($request, "/recitations/{$recitationId}/by_chapter/{$chapterId}");
    }

    public function verseRecitationsByAyah(Request $request, string $chapterId, string $verseNumber, string $recitationId): JsonResponse
    {
        $this->validateChapterId($chapterId);
        $this->validateNumericId($verseNumber, 'verseNumber');
        $this->validateNumericId($recitationId, 'recitationId');

        $verseKey = "{$chapterId}:{$verseNumber}";

        return $this->proxy($request, "/recitations/{$recitationId}/by_ayah/{$verseKey}");
    }

    public function verify(): JsonResponse
    {
        try {
            $chapters = $this->client->get('/chapters');
            $chaptersPayload = $chapters->json();

            if (! $chapters->successful() || ! is_array(data_get($chaptersPayload, 'chapters'))) {
                return $this->jsonError('Quran Foundation chapters verification failed.', $chapters->status());
            }

            $recitations = $this->client->get('/resources/recitations');
            $translations = $this->client->get('/resources/translations');
            $chapterAudio = $this->client->get(sprintf(
                '/chapter_recitations/%s/%s',
                config('quran-foundation.verify_chapter_reciter_id'),
                config('quran-foundation.verify_chapter_id'),
            ));

            return response()->json([
                'success' => $recitations->successful() && $translations->successful() && $chapterAudio->successful(),
                'environment' => config('quran-foundation.environment'),
                'checks' => [
                    'chapters' => [
                        'status' => $chapters->status(),
                        'has_chapters_array' => is_array(data_get($chaptersPayload, 'chapters')),
                    ],
                    'resources_recitations' => [
                        'status' => $recitations->status(),
                        'successful' => $recitations->successful(),
                    ],
                    'resources_translations' => [
                        'status' => $translations->status(),
                        'successful' => $translations->successful(),
                    ],
                    'audio_chapter_recitation' => [
                        'status' => $chapterAudio->status(),
                        'successful' => $chapterAudio->successful(),
                    ],
                ],
            ], $chapterAudio->successful() && $translations->successful() && $recitations->successful() ? 200 : 502);
        } catch (Throwable $exception) {
            return $this->jsonError($exception->getMessage(), 500);
        }
    }

    private function proxy(Request $request, string $path): JsonResponse
    {
        try {
            $response = $this->client->get($path, $request->query());
        } catch (Throwable $exception) {
            return $this->jsonError($exception->getMessage(), 500);
        }

        $payload = $response->json();

        if ($response->successful()) {
            return response()->json($payload, $response->status());
        }

        return $this->jsonError(
            data_get($payload, 'message', 'Quran Foundation request failed.'),
            $response->status(),
        );
    }

    private function validateNumericId(string $value, string $field): void
    {
        Validator::make([$field => $value], [
            $field => ['required', 'integer', 'min:1'],
        ])->validate();
    }

    private function validateChapterId(string $chapterId): void
    {
        Validator::make(['chapterId' => $chapterId], [
            'chapterId' => ['required', 'integer', 'min:1', 'max:114'],
        ])->validate();
    }

    private function validateVerseKey(string $verseKey): void
    {
        Validator::make(['verseKey' => $verseKey], [
            'verseKey' => ['required', 'regex:/^(?:[1-9]|[1-9][0-9]|1[01][0-9]|114):[1-9][0-9]*$/'],
        ])->validate();
    }

    private function jsonError(string $message, int $status): JsonResponse
    {
        $status = $status >= 400 && $status < 600 ? $status : 502;

        return response()->json([
            'success' => false,
            'message' => $message,
            'type' => $status >= 500 ? 'quran_foundation_error' : 'quran_foundation_request_error',
            'upstream_status' => $status,
        ], $status);
    }
}
