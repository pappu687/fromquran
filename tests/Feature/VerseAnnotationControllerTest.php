<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Verse;
use App\Models\VerseAnnotation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerseAnnotationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_annotation(): void
    {
        $user = User::factory()->create();
        $verse = Verse::factory()->create([
            'text_uthmani' => 'بسم الله الرحمن الرحيم',
        ]);

        $selectedText = 'الله';
        $startOffset = mb_strpos($verse->text_uthmani, $selectedText, 0, 'UTF-8');
        $endOffset = $startOffset + mb_strlen($selectedText, 'UTF-8');

        $this->actingAs($user)
            ->postJson('/api/verse-annotations', [
                'verse_id' => $verse->id,
                'start_offset' => $startOffset,
                'end_offset' => $endOffset,
                'selected_text' => $selectedText,
                'note' => 'This phrase stands out to me.',
            ])
            ->assertCreated()
            ->assertJsonFragment([
                'verse_id' => $verse->id,
                'start_offset' => $startOffset,
                'end_offset' => $endOffset,
                'selected_text' => $selectedText,
                'note' => 'This phrase stands out to me.',
            ]);

        $this->assertDatabaseHas('verse_annotations', [
            'user_id' => $user->id,
            'verse_id' => $verse->id,
            'selected_text' => $selectedText,
        ]);
    }

    public function test_guest_cannot_create_annotation(): void
    {
        $this->postJson('/api/verse-annotations', [])
            ->assertUnauthorized();
    }

    public function test_store_rejects_mismatched_selected_text(): void
    {
        $user = User::factory()->create();
        $verse = Verse::factory()->create([
            'text_uthmani' => 'بسم الله الرحمن الرحيم',
        ]);

        $this->actingAs($user)
            ->postJson('/api/verse-annotations', [
                'verse_id' => $verse->id,
                'start_offset' => 0,
                'end_offset' => 3,
                'selected_text' => 'الله',
                'note' => 'Invalid selection.',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['selected_text']);
    }

    public function test_store_rejects_overlapping_annotation_for_same_user_and_verse(): void
    {
        $user = User::factory()->create();
        $verse = Verse::factory()->create([
            'text_uthmani' => 'بسم الله الرحمن الرحيم',
        ]);

        VerseAnnotation::factory()->create([
            'user_id' => $user->id,
            'verse_id' => $verse->id,
            'start_offset' => 4,
            'end_offset' => 8,
            'selected_text' => 'الله',
        ]);

        $this->actingAs($user)
            ->postJson('/api/verse-annotations', [
                'verse_id' => $verse->id,
                'start_offset' => 6,
                'end_offset' => 11,
                'selected_text' => 'له ال',
                'note' => 'Overlap should fail.',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['start_offset']);
    }

    public function test_authenticated_user_can_list_only_their_annotations(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $verse = Verse::factory()->create();
        $otherVerse = Verse::factory()->create();

        $ownAnnotation = VerseAnnotation::factory()->create([
            'user_id' => $user->id,
            'verse_id' => $verse->id,
        ]);

        VerseAnnotation::factory()->create([
            'user_id' => $otherUser->id,
            'verse_id' => $verse->id,
        ]);

        VerseAnnotation::factory()->create([
            'user_id' => $user->id,
            'verse_id' => $otherVerse->id,
        ]);

        $this->actingAs($user)
            ->getJson("/api/verse-annotations?verse_ids={$verse->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'id' => $ownAnnotation->id,
                'verse_id' => $verse->id,
            ]);
    }

    public function test_user_can_update_only_their_annotation_note(): void
    {
        $user = User::factory()->create();
        $annotation = VerseAnnotation::factory()->create([
            'user_id' => $user->id,
            'note' => 'Original note',
        ]);

        $this->actingAs($user)
            ->putJson("/api/verse-annotations/{$annotation->id}", [
                'note' => 'Updated note',
            ])
            ->assertOk()
            ->assertJsonFragment([
                'id' => $annotation->id,
                'note' => 'Updated note',
            ]);

        $this->assertDatabaseHas('verse_annotations', [
            'id' => $annotation->id,
            'note' => 'Updated note',
        ]);
    }

    public function test_user_cannot_update_another_users_annotation(): void
    {
        $user = User::factory()->create();
        $annotation = VerseAnnotation::factory()->create();

        $this->actingAs($user)
            ->putJson("/api/verse-annotations/{$annotation->id}", [
                'note' => 'Updated note',
            ])
            ->assertForbidden();
    }

    public function test_user_can_soft_delete_their_annotation(): void
    {
        $user = User::factory()->create();
        $annotation = VerseAnnotation::factory()->create([
            'user_id' => $user->id,
        ]);

        $this->actingAs($user)
            ->deleteJson("/api/verse-annotations/{$annotation->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('verse_annotations', [
            'id' => $annotation->id,
        ]);
    }
}
