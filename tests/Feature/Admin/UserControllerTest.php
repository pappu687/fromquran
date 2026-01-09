<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserControllerTest extends TestCase
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

    /** @test */
    public function admin_can_create_user()
    {
        $data = [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $this->actingAs($this->admin)
            ->postJson('/admin/users', $data)
            ->assertStatus(201)
            ->assertJsonFragment(['email' => 'newuser@example.com']);

        $this->assertDatabaseHas('users', ['email' => 'newuser@example.com']);
    }

    /** @test */
    public function admin_can_update_user()
    {
        $user = User::factory()->create();

        $data = [
            'name' => 'Updated User Name',
        ];

        $this->actingAs($this->admin)
            ->putJson("/admin/users/{$user->id}", $data)
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Updated User Name']);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Updated User Name']);
    }

    /** @test */
    public function admin_can_delete_user()
    {
        $user = User::factory()->create();

        $this->actingAs($this->admin)
            ->deleteJson("/admin/users/{$user->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    /** @test */
    public function admin_cannot_delete_themselves()
    {
        $this->actingAs($this->admin)
            ->deleteJson("/admin/users/{$this->admin->id}")
            ->assertStatus(403);
    }
}
