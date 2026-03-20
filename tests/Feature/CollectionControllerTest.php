<?php

namespace Tests\Feature;

use App\Models\Collection;
use App\Models\Tag;
use App\Models\User;
use App\Models\Verse;
use Illuminate\Database\Eloquent\Relations\Relation;
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
            'tags' => [
                ['name' => ' Patience ', 'type' => 'theme'],
                ['name' => 'Mercy', 'type' => 'theme'],
            ],
        ];

        $this->actingAs($this->user)
            ->postJson('/api/collections', $data)
            ->assertStatus(201)
            ->assertJsonFragment(['name' => 'My Favorites'])
            ->assertJsonFragment(['slug' => 'patience'])
            ->assertJsonFragment(['slug' => 'mercy']);

        $this->assertDatabaseHas('collections', [
            'user_id' => $this->user->id,
            'name' => 'My Favorites',
            'is_public' => true,
        ]);

        $this->assertDatabaseHas('tags', [
            'name' => 'Patience',
            'slug' => 'patience',
            'type' => 'theme',
        ]);

        $collection = Collection::firstOrFail();
        $patienceTag = Tag::where('slug', 'patience')->firstOrFail();

        $this->assertDatabaseHas('taggables', [
            'tag_id' => $patienceTag->id,
            'taggable_type' => Relation::getMorphedModel('collection') ? 'collection' : 'collection',
            'taggable_id' => $collection->id,
        ]);
    }

    /** @test */
    public function user_can_update_collection()
    {
        $collection = Collection::factory()->create(['user_id' => $this->user->id]);
        $oldTag = Tag::factory()->create([
            'name' => 'Justice',
            'slug' => 'justice',
            'type' => 'theme',
        ]);
        $collection->tags()->attach($oldTag->id, ['display_order' => 0]);

        $data = [
            'name' => 'Updated Name',
            'tags' => [
                ['name' => 'Hope', 'type' => 'theme'],
            ],
        ];

        $this->actingAs($this->user)
            ->putJson("/api/collections/{$collection->slug}", $data)
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Updated Name'])
            ->assertJsonFragment(['slug' => 'hope']);

        $this->assertDatabaseHas('collections', [
            'id' => $collection->id,
            'name' => 'Updated Name',
        ]);

        $this->assertFalse(
            $collection->fresh()->tags()->where('slug', 'justice')->exists(),
        );
        $this->assertTrue(
            $collection->fresh()->tags()->where('slug', 'hope')->exists(),
        );
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

    /** @test */
    public function user_can_filter_collections_by_tags()
    {
        $patience = Tag::factory()->create([
            'name' => 'Patience',
            'slug' => 'patience',
            'type' => 'theme',
        ]);
        $mercy = Tag::factory()->create([
            'name' => 'Mercy',
            'slug' => 'mercy',
            'type' => 'theme',
        ]);

        $matchingCollection = Collection::factory()->create([
            'user_id' => $this->user->id,
        ]);
        $matchingCollection->tags()->attach($patience->id, ['display_order' => 0]);

        $otherCollection = Collection::factory()->create([
            'user_id' => $this->user->id,
        ]);
        $otherCollection->tags()->attach($mercy->id, ['display_order' => 0]);

        $this->actingAs($this->user)
            ->getJson('/api/collections?tags[]=patience')
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['id' => $matchingCollection->id])
            ->assertJsonMissing(['id' => $otherCollection->id]);
    }

    /** @test */
    public function public_collections_can_be_filtered_by_tags()
    {
        $patience = Tag::factory()->create([
            'name' => 'Patience',
            'slug' => 'patience',
            'type' => 'theme',
        ]);
        $mercy = Tag::factory()->create([
            'name' => 'Mercy',
            'slug' => 'mercy',
            'type' => 'theme',
        ]);

        $publicMatchingCollection = Collection::factory()->create([
            'is_public' => true,
            'status' => 'approved',
        ]);
        $publicMatchingCollection->tags()->attach($patience->id, ['display_order' => 0]);

        $publicOtherCollection = Collection::factory()->create([
            'is_public' => true,
            'status' => 'approved',
        ]);
        $publicOtherCollection->tags()->attach($mercy->id, ['display_order' => 0]);

        $this->getJson('/api/collections/public?tags[]=patience')
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(['id' => $publicMatchingCollection->id])
            ->assertJsonMissing(['id' => $publicOtherCollection->id]);
    }
}
