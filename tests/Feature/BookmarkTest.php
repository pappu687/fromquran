<?php

namespace Tests\Feature;

use App\Models\QuranBookmark;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookmarkTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a test user
        $this->user = User::factory()->create();
    }

    /** @test */
    public function unauthenticated_user_cannot_access_bookmarks()
    {
        $response = $this->getJson('/api/bookmarks');
        
        $response->assertStatus(401);
    }

    /** @test */
    public function authenticated_user_can_create_a_bookmark()
    {
        $bookmarkData = [
            'chapter_id' => 2,
            'verse_number' => 255,
            'verse_id' => '2:255',
            'verse_data' => [
                'id' => 2255,
                'verseNumber' => 255,
                'text' => 'Test Arabic text',
                'translation' => 'Test translation',
            ],
            'edition' => 'en.sahih',
            'notes' => 'Ayatul Kursi',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/bookmarks', $bookmarkData);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Bookmark added successfully',
            ])
            ->assertJsonStructure([
                'message',
                'bookmark' => [
                    'id',
                    'user_id',
                    'chapter_id',
                    'verse_number',
                    'verse_id',
                    'edition',
                    'notes',
                ],
            ]);

        $this->assertDatabaseHas('quran_bookmarks', [
            'user_id' => $this->user->id,
            'chapter_id' => 2,
            'verse_number' => 255,
            'verse_id' => '2:255',
            'edition' => 'en.sahih',
        ]);
    }

    /** @test */
    public function user_cannot_create_duplicate_bookmark()
    {
        $bookmarkData = [
            'chapter_id' => 2,
            'verse_number' => 255,
            'verse_id' => '2:255',
            'verse_data' => ['text' => 'Test'],
            'edition' => 'en.sahih',
        ];

        // Create first bookmark
        $this->actingAs($this->user)
            ->postJson('/api/bookmarks', $bookmarkData);

        // Try to create duplicate
        $response = $this->actingAs($this->user)
            ->postJson('/api/bookmarks', $bookmarkData);

        $response->assertStatus(409)
            ->assertJson([
                'message' => 'Bookmark already exists',
            ]);
    }

    /** @test */
    public function authenticated_user_can_view_their_bookmarks()
    {
        // Create some bookmarks for the user
        QuranBookmark::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'edition' => 'en.sahih',
        ]);

        // Create bookmarks for another user (should not be returned)
        $otherUser = User::factory()->create();
        QuranBookmark::factory()->count(2)->create([
            'user_id' => $otherUser->id,
            'edition' => 'en.sahih',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/bookmarks?edition=en.sahih');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'user_id',
                        'chapter_id',
                        'verse_number',
                        'verse_id',
                        'edition',
                    ],
                ],
                'count',
            ]);
    }

    /** @test */
    public function user_can_filter_bookmarks_by_chapter()
    {
        // Create bookmarks for different chapters
        QuranBookmark::factory()->create([
            'user_id' => $this->user->id,
            'chapter_id' => 2,
            'edition' => 'en.sahih',
        ]);

        QuranBookmark::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'chapter_id' => 3,
            'edition' => 'en.sahih',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/bookmarks?chapter_id=3&edition=en.sahih');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    /** @test */
    public function user_can_check_if_verse_is_bookmarked()
    {
        $bookmark = QuranBookmark::factory()->create([
            'user_id' => $this->user->id,
            'verse_id' => '2:255',
            'edition' => 'en.sahih',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/bookmarks/check?verse_id=2:255&edition=en.sahih');

        $response->assertStatus(200)
            ->assertJson([
                'is_bookmarked' => true,
            ])
            ->assertJsonStructure([
                'is_bookmarked',
                'bookmark',
            ]);
    }

    /** @test */
    public function user_can_delete_their_bookmark()
    {
        $bookmark = QuranBookmark::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/bookmarks/{$bookmark->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Bookmark removed successfully',
            ]);

        $this->assertDatabaseMissing('quran_bookmarks', [
            'id' => $bookmark->id,
        ]);
    }

    /** @test */
    public function user_cannot_delete_another_users_bookmark()
    {
        $otherUser = User::factory()->create();
        $bookmark = QuranBookmark::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/api/bookmarks/{$bookmark->id}");

        $response->assertStatus(403);

        $this->assertDatabaseHas('quran_bookmarks', [
            'id' => $bookmark->id,
        ]);
    }

    /** @test */
    public function user_can_update_bookmark_notes()
    {
        $bookmark = QuranBookmark::factory()->create([
            'user_id' => $this->user->id,
            'notes' => 'Original notes',
        ]);

        $response = $this->actingAs($this->user)
            ->putJson("/api/bookmarks/{$bookmark->id}", [
                'notes' => 'Updated notes',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Bookmark updated successfully',
                'bookmark' => [
                    'notes' => 'Updated notes',
                ],
            ]);

        $this->assertDatabaseHas('quran_bookmarks', [
            'id' => $bookmark->id,
            'notes' => 'Updated notes',
        ]);
    }

    /** @test */
    public function user_can_view_bookmark_statistics()
    {
        // Create bookmarks for different chapters
        QuranBookmark::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'chapter_id' => 2,
        ]);

        QuranBookmark::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'chapter_id' => 3,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/bookmarks/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_bookmarks',
                'bookmarks_by_chapter',
                'recent_bookmarks',
            ])
            ->assertJson([
                'total_bookmarks' => 5,
            ]);
    }

    /** @test */
    public function bookmark_requires_valid_chapter_id()
    {
        $bookmarkData = [
            'chapter_id' => 115, // Invalid - only 114 chapters
            'verse_number' => 1,
            'verse_id' => '115:1',
            'verse_data' => ['text' => 'Test'],
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/bookmarks', $bookmarkData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['chapter_id']);
    }

    /** @test */
    public function bookmark_requires_verse_number()
    {
        $bookmarkData = [
            'chapter_id' => 2,
            'verse_id' => '2:255',
            'verse_data' => ['text' => 'Test'],
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/bookmarks', $bookmarkData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['verse_number']);
    }
}
