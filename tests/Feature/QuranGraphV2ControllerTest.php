<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Verse;
use App\Services\Arango\QuranGraphQueryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class QuranGraphV2ControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $mock = Mockery::mock(QuranGraphQueryService::class);
        $mock->shouldReceive('getVerseGraph')->andReturn([
            'nodes' => [
                ['id' => 'verse_1_1', 'label' => '1:1', 'type' => 'verse', 'payload' => []],
            ],
            'links' => [],
            'meta' => ['center' => 'verse_1_1', 'depth' => 1, 'counts' => ['nodes' => 1, 'links' => 0]],
        ]);
        $mock->shouldReceive('getChapterGraph')->andReturn([
            'nodes' => [
                ['id' => 'chapter_1', 'label' => 'Al-Fatiha (1)', 'type' => 'chapter', 'payload' => []],
            ],
            'links' => [],
            'meta' => ['center' => 'chapter_1', 'depth' => 1, 'counts' => ['nodes' => 1, 'links' => 0]],
        ]);

        $this->app->instance(QuranGraphQueryService::class, $mock);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_returns_graph_for_a_verse()
    {
        $chapter = Chapter::factory()->create(['chapter_number' => 1]);
        $verse = Verse::factory()->create([
            'chapter_id' => $chapter->id,
            'verse_number' => 1,
            'verse_key' => '1:1',
        ]);

        $response = $this->getJson("/api/quran/graph-v2/verses/{$verse->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'nodes',
                'links',
                'meta' => ['center', 'depth', 'counts'],
            ])
            ->assertJsonPath('meta.center', 'verse_1_1');
    }

    /** @test */
    public function it_returns_graph_for_a_chapter()
    {
        $chapter = Chapter::factory()->create(['chapter_number' => 1]);

        $response = $this->getJson("/api/quran/graph-v2/chapters/{$chapter->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'nodes',
                'links',
                'meta' => ['center', 'depth', 'counts'],
            ])
            ->assertJsonPath('meta.center', 'chapter_1');
    }

    /** @test */
    public function it_limits_depth_parameter()
    {
        $chapter = Chapter::factory()->create(['chapter_number' => 1]);
        $verse = Verse::factory()->create([
            'chapter_id' => $chapter->id,
            'verse_number' => 1,
            'verse_key' => '1:1',
        ]);

        $response = $this->getJson("/api/quran/graph-v2/verses/{$verse->id}?depth=5");
        $response->assertOk();
    }

    /** @test */
    public function it_accepts_types_filter()
    {
        $chapter = Chapter::factory()->create(['chapter_number' => 1]);
        $verse = Verse::factory()->create([
            'chapter_id' => $chapter->id,
            'verse_number' => 1,
            'verse_key' => '1:1',
        ]);

        $response = $this->getJson("/api/quran/graph-v2/verses/{$verse->id}?types=verse,topic");
        $response->assertOk();
    }

    /** @test */
    public function it_returns_404_for_missing_verse()
    {
        $this->getJson('/api/quran/graph-v2/verses/999999')->assertNotFound();
    }

    /** @test */
    public function it_returns_404_for_missing_chapter()
    {
        $this->getJson('/api/quran/graph-v2/chapters/999999')->assertNotFound();
    }
}
