<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserChapterResource;
use App\Models\Chapter;
use App\Models\ResourceType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserChapterResourceControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Chapter $chapter;
    protected ResourceType $resourceType;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->chapter = Chapter::factory()->create();
        $this->resourceType = ResourceType::factory()->create();
    }

    /** @test */
    public function authenticated_user_can_submit_chapter_resource()
    {
        $data = [
            'chapter_id' => $this->chapter->id,
            'resource_type_id' => $this->resourceType->id,
            'resource_url' => 'https://example.com/chapter-resource',
            'comment' => 'Great chapter resource',
        ];

        $this->actingAs($this->user)
            ->postJson('/user-chapter-resources', $data)
            ->assertStatus(201)
            ->assertJsonFragment(['status' => 'pending']);

        $this->assertDatabaseHas('user_chapter_resources', [
            'user_id' => $this->user->id,
            'chapter_id' => $this->chapter->id,
            'resource_url' => 'https://example.com/chapter-resource',
            'status' => 'pending',
        ]);
    }
}
