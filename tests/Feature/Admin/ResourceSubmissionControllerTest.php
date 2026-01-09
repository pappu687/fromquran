<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserVerseResource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ResourceSubmissionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        // Create Admin role (Admin, Moderator can approve)
        $role = Role::create(['name' => 'Admin']);
        $this->admin = User::factory()->create();
        $this->admin->assignRole($role);
    }

    /** @test */
    public function admin_can_approve_submission()
    {
        $submission = UserVerseResource::factory()->create(['status' => 'pending']);

        $this->actingAs($this->admin)
            ->post("/admin/resource-submissions/{$submission->id}/approve")
            ->assertRedirect(); // Controller returns back()

        $this->assertDatabaseHas('user_verse_resources', [
            'id' => $submission->id,
            'status' => 'approved',
        ]);
    }

    /** @test */
    public function admin_can_reject_submission()
    {
        $submission = UserVerseResource::factory()->create(['status' => 'pending']);

        $this->actingAs($this->admin)
            ->post("/admin/resource-submissions/{$submission->id}/reject")
            ->assertRedirect();

        $this->assertDatabaseHas('user_verse_resources', [
            'id' => $submission->id,
            'status' => 'rejected',
        ]);
    }

    /** @test */
    public function admin_can_delete_submission()
    {
        $submission = UserVerseResource::factory()->create();

        $this->actingAs($this->admin)
            ->delete("/admin/resource-submissions/{$submission->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('user_verse_resources', ['id' => $submission->id]);
    }
}
