<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Verse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class QuranVerseAudioControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('cache.default', 'array');
        Config::set('quran-foundation.environment', 'prelive');
        Config::set('quran-foundation.client_id', 'test-client-id');
        Config::set('quran-foundation.client_secret', 'test-client-secret');
        Config::set('quran-foundation.auth_base_url', 'https://prelive-oauth2.quran.foundation');
        Config::set('quran-foundation.api_base_url', 'https://apis-prelive.quran.foundation/content/api/v4');
        Config::set('quran-foundation.cache_store', 'array');
        Config::set('quran-foundation.timeout_seconds', 5);

        Cache::store('array')->flush();
    }

    public function test_navigation_returns_previous_and_next_for_middle_verse(): void
    {
        $this->seedChapterVerses(2, 3);

        $this->getJson('/api/quran/verses/2:2/navigation')
            ->assertOk()
            ->assertJsonPath('current.verse_key', '2:2')
            ->assertJsonPath('current.chapter_id', 2)
            ->assertJsonPath('previous.verse_key', '2:1')
            ->assertJsonPath('next.verse_key', '2:3');
    }

    public function test_navigation_returns_previous_null_for_first_verse(): void
    {
        $this->seedChapterVerses(2, 3);

        $this->getJson('/api/quran/verses/2:1/navigation')
            ->assertOk()
            ->assertJsonPath('previous', null)
            ->assertJsonPath('next.verse_key', '2:2');
    }

    public function test_navigation_returns_next_null_for_last_verse(): void
    {
        $this->seedChapterVerses(2, 3);

        $this->getJson('/api/quran/verses/2:3/navigation')
            ->assertOk()
            ->assertJsonPath('previous.verse_key', '2:2')
            ->assertJsonPath('next', null);
    }

    public function test_invalid_verse_key_returns_validation_error(): void
    {
        $this->getJson('/api/quran/verses/not-a-key/navigation')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('verseKey');
    }

    public function test_audio_endpoint_normalizes_relative_audio_url(): void
    {
        $this->seedChapterVerses(2, 255);

        Http::fake([
            'https://prelive-oauth2.quran.foundation/oauth2/token' => Http::response([
                'access_token' => 'audio-token',
                'expires_in' => 3600,
            ]),
            'https://apis-prelive.quran.foundation/content/api/v4/recitations/7/by_ayah/2:255*' => Http::response([
                'audio_files' => [
                    [
                        'verse_key' => '2:255',
                        'url' => 'Alafasy/mp3/002255.mp3',
                    ],
                ],
            ]),
        ]);

        $this->getJson('/api/quran/audio/verse/2:255?recitation_id=7')
            ->assertOk()
            ->assertJsonPath('verse_key', '2:255')
            ->assertJsonPath('recitation_id', 7)
            ->assertJsonPath('audio_url', 'https://audio.qurancdn.com/Alafasy/mp3/002255.mp3');
    }

    private function seedChapterVerses(int $chapterNumber, int $count): Chapter
    {
        $chapter = Chapter::factory()->create([
            'chapter_number' => $chapterNumber,
            'verses_count' => $count,
            'pages' => '1',
        ]);

        for ($verseNumber = 1; $verseNumber <= $count; $verseNumber++) {
            Verse::factory()->create([
                'chapter_id' => $chapter->id,
                'verse_number' => $verseNumber,
                'verse_key' => "{$chapterNumber}:{$verseNumber}",
                'verse_index' => (($chapterNumber - 1) * 300) + $verseNumber,
            ]);
        }

        return $chapter;
    }
}
