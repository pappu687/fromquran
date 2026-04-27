<?php

namespace App\Services;

use App\Models\Verse;
use Illuminate\Http\Client\Response;
use RuntimeException;

class QuranVerseAudioService
{
    private const AUDIO_BASE_URL = 'https://audio.qurancdn.com';

    public function __construct(private readonly QuranFoundationClient $client) {}

    public function getNavigation(string $verseKey): array
    {
        $verse = Verse::query()
            ->with('chapter:id,chapter_number')
            ->where('verse_key', $verseKey)
            ->first();

        if (! $verse) {
            abort(404, 'Verse was not found.');
        }

        $previous = Verse::query()
            ->with('chapter:id,chapter_number')
            ->where('chapter_id', $verse->chapter_id)
            ->where('verse_number', $verse->verse_number - 1)
            ->first();

        $next = Verse::query()
            ->with('chapter:id,chapter_number')
            ->where('chapter_id', $verse->chapter_id)
            ->where('verse_number', $verse->verse_number + 1)
            ->first();

        return [
            'current' => $this->serializeVerse($verse),
            'previous' => $previous ? $this->serializeVerse($previous) : null,
            'next' => $next ? $this->serializeVerse($next) : null,
        ];
    }

    public function getVerseAudio(string $verseKey, int $recitationId): array
    {
        $verse = Verse::query()
            ->where('verse_key', $verseKey)
            ->first();

        if (! $verse) {
            abort(404, 'Verse was not found.');
        }

        $response = $this->client->get("/recitations/{$recitationId}/by_ayah/{$verseKey}");
        $payload = $response->json();

        if (! $response->successful()) {
            $this->throwUpstreamFailure($response, $payload);
        }

        $relativeUrl = data_get($payload, 'audio_files.0.url');

        if (! is_string($relativeUrl) || $relativeUrl === '') {
            throw new RuntimeException('Quran Foundation audio response did not include an audio URL.');
        }

        return [
            'verse_key' => $verseKey,
            'recitation_id' => $recitationId,
            'audio_url' => $this->normalizeAudioUrl($relativeUrl),
            'raw' => $payload,
        ];
    }

    private function serializeVerse(Verse $verse): array
    {
        return [
            'verse_key' => $verse->verse_key,
            'chapter_id' => (int) ($verse->chapter?->chapter_number ?? $verse->chapter_id),
            'verse_number' => (int) $verse->verse_number,
        ];
    }

    private function normalizeAudioUrl(string $url): string
    {
        if (str_starts_with($url, 'https://') || str_starts_with($url, 'http://')) {
            return $url;
        }

        if (str_starts_with($url, '//')) {
            return 'https:'.$url;
        }

        return self::AUDIO_BASE_URL.'/'.ltrim($url, '/');
    }

    private function throwUpstreamFailure(Response $response, mixed $payload): never
    {
        $message = is_array($payload)
            ? data_get($payload, 'message', 'Quran Foundation audio request failed.')
            : 'Quran Foundation audio request failed.';

        abort($response->status(), $message);
    }
}
