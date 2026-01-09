<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\User;
use App\Models\Verse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /** @test */
    public function unauthenticated_user_cannot_access_collections()
    {
        $this->getJson('/api/collections')->assertStatus(401);
    }

    /** @test */
    public function user_can_create_collection()
    {
        $data = [
            'name' => 'My Favorites',
            'description' => 'A collection of favorite verses',
            'is_public' => true,
        ];

        $this->actingAs($this->user)
            ->postJson('/api/collections', $data)
            ->assertStatus(201)
            ->assertJsonFragment(['name' => 'My Favorites']);

        $this->assertDatabaseHas('collections', [
            'user_id' => $this->user->id,
            'name' => 'My Favorites',
            'is_public' => true,
        ]);
    }

    /** @test */
    public function user_can_update_collection()
    {
        $collection = Collection::factory()->create(['user_id' => $this->user->id]);

        $data = ['name' => 'Updated Name'];

        $this->actingAs($this->user)
            ->putJson("/api/collections/{$collection->slug}", $data)
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Updated Name']);

        $this->assertDatabaseHas('collections', [
            'id' => $collection->id,
            'name' => 'Updated Name',
        ]);
    }

    /** @test */
    public function user_can_delete_collection()
    {
        $collection = Collection::factory()->create(['user_id' => $this->user->id]);

        $this->actingAs($this->user)
            ->deleteJson("/api/collections/{$collection->slug}")
            ->assertStatus(200);

        $this->assertSoftDeleted('collections', ['id' => $collection->id]);
    }

    /** @test */
    public function user_can_add_verse_to_collection()
    {
        $collection = Collection::factory()->create(['user_id' => $this->user->id]);
        $verse = Verse::factory()->create();

        $this->actingAs($this->user)
            ->postJson("/api/collections/{$collection->slug}/verses", ['verse_id' => $verse->id])
            ->assertStatus(200);

        $this->assertTrue($collection->verses()->where('verses.id', $verse->id)->exists());
    }

    /** @test */
    public function user_can_remove_verse_from_collection()
    {
        $collection = Collection::factory()->create(['user_id' => $this->user->id]);
        $verse = Verse::factory()->create();
        $collection->verses()->attach($verse);

        $this->actingAs($this->user)
            ->deleteJson("/api/collections/{$collection->slug}/verses", ['verse_id' => $verse->id])
            ->assertStatus(200);

        $this->assertFalse($collection->verses()->where('verses.id', $verse->id)->exists());
    }

    /** @test */
    public function user_cannot_modify_others_collection()
    {
        $otherUser = User::factory()->create();
        $collection = Collection::factory()->create(['user_id' => $otherUser->id]);

        $this->actingAs($this->user)
            ->putJson("/api/collections/{$collection->slug}", ['name' => 'Hacked'])
            ->assertStatus(403);
    }
}
