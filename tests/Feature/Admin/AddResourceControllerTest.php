<?php

namespace Tests\Feature\Admin;

use App\Models\Chapter;
use App\Models\ResourceType;
use App\Models\User;
use App\Models\UserChapterResource;
use App\Models\UserVerseResource;
use App\Models\Verse;
use App\Services\Solr\ResourceIndexer;
use App\Services\Solr\VerseIndexer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AddResourceControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Admin']);
        $this->admin = User::factory()->create();
        $this->admin->assignRole($role);
    }

    public function test_admin_can_add_verse_resources_and_index_them_immediately(): void
    {
        $chapter = Chapter::factory()->create();
        $verse = Verse::factory()->create(['chapter_id' => $chapter->id]);
        $resourceType = ResourceType::factory()->create();

        $resourceIndexer = Mockery::mock(ResourceIndexer::class);
        $resourceIndexer
            ->shouldReceive('indexVerseResource')
            ->twice()
            ->with(Mockery::type(UserVerseResource::class));
        $this->app->instance(ResourceIndexer::class, $resourceIndexer);

        $verseIndexer = Mockery::mock(VerseIndexer::class);
        $verseIndexer
            ->shouldReceive('reindexVerse')
            ->twice()
            ->with($verse->id);
        $this->app->instance(VerseIndexer::class, $verseIndexer);

        $payload = [
            'chapter_id' => $chapter->id,
            'verse_id' => $verse->id,
            'resource_type_id' => $resourceType->id,
            'resources' => [
                [
                    'url' => 'https://example.com/one',
                    'title' => 'Example One',
                    'description' => 'First scraped description',
                ],
                [
                    'url' => 'https://example.com/two',
                    'title' => 'Example Two',
                    'description' => 'Second scraped description',
                    'thumbnail_url' => 'https://example.com/thumb.jpg',
                ],
            ],
        ];

        $this->actingAs($this->admin)
            ->post('/admin/add-resource/store', $payload)
            ->assertRedirect();

        $this->assertDatabaseCount('user_verse_resources', 2);
        $this->assertDatabaseHas('user_verse_resources', [
            'verse_id' => $verse->id,
            'resource_url' => 'https://example.com/one',
            'comment' => 'First scraped description',
            'status' => 'approved',
        ]);
        $this->assertDatabaseHas('user_verse_resources', [
            'verse_id' => $verse->id,
            'resource_url' => 'https://example.com/two',
            'comment' => 'Second scraped description',
            'status' => 'approved',
        ]);
    }

    public function test_admin_can_add_chapter_resources_and_index_them_immediately(): void
    {
        $chapter = Chapter::factory()->create();
        $resourceType = ResourceType::factory()->create();

        $resourceIndexer = Mockery::mock(ResourceIndexer::class);
        $resourceIndexer
            ->shouldReceive('indexChapterResource')
            ->once()
            ->with(Mockery::type(UserChapterResource::class));
        $this->app->instance(ResourceIndexer::class, $resourceIndexer);

        $verseIndexer = Mockery::mock(VerseIndexer::class);
        $verseIndexer
            ->shouldReceive('reindexChapter')
            ->once()
            ->with($chapter->id);
        $this->app->instance(VerseIndexer::class, $verseIndexer);

        $payload = [
            'chapter_id' => $chapter->id,
            'verse_id' => 'all',
            'resource_type_id' => $resourceType->id,
            'resources' => [
                [
                    'url' => 'https://example.com/chapter-resource',
                    'title' => 'Chapter Resource',
                    'description' => 'Chapter scraped description',
                ],
            ],
        ];

        $this->actingAs($this->admin)
            ->post('/admin/add-resource/store', $payload)
            ->assertRedirect();

        $this->assertDatabaseCount('user_chapter_resources', 1);
        $this->assertDatabaseHas('user_chapter_resources', [
            'chapter_id' => $chapter->id,
            'resource_url' => 'https://example.com/chapter-resource',
            'comment' => 'Chapter scraped description',
            'status' => 'approved',
        ]);
    }
}
