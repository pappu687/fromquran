<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class RoleControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        // Create Admin role
        $role = Role::create(['name' => 'Admin']);
        $this->admin = User::factory()->create();
        $this->admin->assignRole($role);
    }

    /** @test */
    public function admin_can_create_role()
    {
        $data = [
            'name' => 'Editor',
            'permissions' => [],
        ];

        $this->actingAs($this->admin)
            ->postJson('/admin/roles', $data)
            ->assertStatus(201)
            ->assertJsonFragment(['name' => 'Editor']);

        $this->assertDatabaseHas('roles', ['name' => 'Editor']);
    }

    /** @test */
    public function admin_can_update_role()
    {
        $role = Role::create(['name' => 'Editor']);

        $data = ['name' => 'Senior Editor'];

        $this->actingAs($this->admin)
            ->putJson("/admin/roles/{$role->id}", $data)
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Senior Editor']);

        $this->assertDatabaseHas('roles', ['id' => $role->id, 'name' => 'Senior Editor']);
    }

    /** @test */
    public function admin_can_delete_role()
    {
        $role = Role::create(['name' => 'Editor']);

        $this->actingAs($this->admin)
            ->deleteJson("/admin/roles/{$role->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    /** @test */
    public function non_admin_cannot_access_role_management()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/admin/roles', ['name' => 'Hacker'])
            ->assertStatus(403);
    }
}
