<?php

namespace Tests\Feature;

use App\Jobs\PersistCollectionView;
use App\Models\Collection;
use App\Models\CollectionViewEvent;
use App\Services\ViewCounter\VisitorFingerprintResolver;
use App\Models\Tag;
use App\Models\User;
use App\Models\Verse;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class CollectionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'view_counter.cache_store' => 'file',
        ]);

        Cache::store('file')->flush();

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

    /** @test */
    public function first_hit_counts()
    {
        Queue::fake();
        Cache::flush();

        $collection = Collection::factory()->create([
            'is_public' => true,
            'status' => 'approved',
            'views_count' => 10,
        ]);

        $this->withHeader('User-Agent', 'Mozilla/5.0 Test Browser')
            ->withHeader('Accept-Language', 'en-US')
            ->withCookie(config('view_counter.visitor_cookie_name'), 'visitor-a')
            ->postJson("/api/public/collections/{$collection->slug}/view")
            ->assertOk()
            ->assertJson([
                'counted' => true,
                'views_count' => 11,
            ]);

        Queue::assertPushed(PersistCollectionView::class, 1);
        $this->assertDatabaseCount('collection_view_events', 1);
    }

    /** @test */
    public function refresh_or_repeat_hit_does_not_count_within_ttl()
    {
        Queue::fake();
        Cache::flush();

        $collection = Collection::factory()->create([
            'is_public' => true,
            'status' => 'approved',
        ]);

        $headers = [
            'User-Agent' => 'Mozilla/5.0 Test Browser',
            'Accept-Language' => 'en-US',
        ];

        $this->withHeaders($headers)
            ->withCookie(config('view_counter.visitor_cookie_name'), 'visitor-b')
            ->postJson("/api/public/collections/{$collection->slug}/view")
            ->assertOk()
            ->assertJson([
                'counted' => true,
                'views_count' => 1,
            ]);

        $this->withHeaders($headers)
            ->withCookie(config('view_counter.visitor_cookie_name'), 'visitor-b')
            ->postJson("/api/public/collections/{$collection->slug}/view")
            ->assertOk()
            ->assertJson([
                'counted' => false,
                'views_count' => 1,
            ]);

        Queue::assertPushed(PersistCollectionView::class, 1);
    }

    /** @test */
    public function different_collections_count_separately()
    {
        Queue::fake();
        Cache::flush();

        $firstCollection = Collection::factory()->create([
            'is_public' => true,
            'status' => 'approved',
        ]);
        $secondCollection = Collection::factory()->create([
            'is_public' => true,
            'status' => 'approved',
        ]);

        $headers = [
            'User-Agent' => 'Mozilla/5.0 Test Browser',
            'Accept-Language' => 'en-US',
        ];

        $this->withHeaders($headers)
            ->withCookie(config('view_counter.visitor_cookie_name'), 'visitor-c')
            ->postJson("/api/public/collections/{$firstCollection->slug}/view")
            ->assertOk()
            ->assertJson([
                'counted' => true,
                'views_count' => 1,
            ]);

        $this->withHeaders($headers)
            ->withCookie(config('view_counter.visitor_cookie_name'), 'visitor-c')
            ->postJson("/api/public/collections/{$secondCollection->slug}/view")
            ->assertOk()
            ->assertJson([
                'counted' => true,
                'views_count' => 1,
            ]);

        Queue::assertPushed(PersistCollectionView::class, 2);
    }

    /** @test */
    public function bot_user_agent_is_ignored()
    {
        Queue::fake();
        Cache::flush();

        $collection = Collection::factory()->create([
            'is_public' => true,
            'status' => 'approved',
            'views_count' => 4,
        ]);

        $this->withHeader(
            'User-Agent',
            'Googlebot/2.1 (+http://www.google.com/bot.html)',
        )
            ->postJson("/api/public/collections/{$collection->slug}/view")
            ->assertOk()
            ->assertJson([
                'counted' => false,
                'views_count' => 4,
            ]);

        Queue::assertNothingPushed();
        $this->assertDatabaseCount('collection_view_events', 0);
    }

    /** @test */
    public function unpublished_or_private_collection_does_not_count()
    {
        Queue::fake();

        $collection = Collection::factory()->create([
            'is_public' => false,
            'status' => 'approved',
        ]);

        $this->postJson("/api/public/collections/{$collection->slug}/view")
            ->assertNotFound();

        Queue::assertNothingPushed();
    }

    /** @test */
    public function concurrent_duplicate_requests_count_once()
    {
        Queue::fake();
        Cache::flush();

        $collection = Collection::factory()->create([
            'is_public' => true,
            'status' => 'approved',
        ]);

        $fingerprintRequest = Request::create(
            "/api/public/collections/{$collection->slug}/view",
            'POST',
            [],
            [config('view_counter.visitor_cookie_name') => 'visitor-concurrent'],
            [],
            [
                'REMOTE_ADDR' => '127.0.0.1',
                'HTTP_USER_AGENT' => 'Mozilla/5.0 test browser',
            ],
        );
        $fingerprintRequest->headers->set('Accept-Language', 'en-US');

        $resolver = app(VisitorFingerprintResolver::class);
        $fingerprintHashes = [
            $resolver->resolve($fingerprintRequest)->fingerprintHash,
        ];

        $fallbackFingerprintRequest = Request::create(
            "/api/public/collections/{$collection->slug}/view",
            'POST',
            [],
            [],
            [],
            [
                'REMOTE_ADDR' => '127.0.0.1',
                'HTTP_USER_AGENT' => 'Mozilla/5.0 test browser',
            ],
        );
        $fallbackFingerprintRequest->headers->set('Accept-Language', 'en-US');
        $fingerprintHashes[] = $resolver
            ->resolve($fallbackFingerprintRequest)
            ->fingerprintHash;

        foreach (array_unique($fingerprintHashes) as $fingerprintHash) {
            Cache::store(config('view_counter.cache_store') ?: config('cache.default'))
                ->add(
                    "collection_view:{$collection->id}:{$fingerprintHash}",
                    now()->timestamp,
                    now()->addHours(config('view_counter.dedupe_ttl_hours', 12)),
                );
        }

        $this->withHeader('User-Agent', 'Mozilla/5.0 test browser')
            ->withHeader('Accept-Language', 'en-US')
            ->withCookie(config('view_counter.visitor_cookie_name'), 'visitor-concurrent')
            ->postJson("/api/public/collections/{$collection->slug}/view")
            ->assertOk()
            ->assertJson([
                'counted' => false,
                'views_count' => 0,
            ]);

        Queue::assertNothingPushed();
    }

    /** @test */
    public function persist_collection_view_job_is_idempotent()
    {
        $collection = Collection::factory()->create([
            'is_public' => true,
            'status' => 'approved',
        ]);

        $event = CollectionViewEvent::create([
            'collection_id' => $collection->id,
            'event_key' => Str::uuid()->toString(),
            'visitor_hash' => hash_hmac('sha256', 'visitor', config('app.key')),
            'ip_hash' => hash_hmac('sha256', '127.0.0.0', config('app.key')),
            'user_agent_hash' => hash_hmac('sha256', 'mozilla', config('app.key')),
            'viewed_at' => now(),
            'is_bot' => false,
        ]);

        $job = new PersistCollectionView($event->id);
        $job->handle(app('db'));
        $job->handle(app('db'));

        $this->assertDatabaseHas('collections', [
            'id' => $collection->id,
            'views_count' => 1,
        ]);
        $this->assertNotNull($event->fresh()->counted_at);
    }
}
