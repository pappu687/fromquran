<?php

namespace Tests\Feature\Admin;

use App\Models\ResourceType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ResourceTypeControllerTest extends TestCase
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
    public function admin_can_create_resource_type()
    {
        $data = [
            'name' => 'Video Tutorial',
            'slug' => 'video-tutorial',
            'display_order' => 1,
        ];

        $this->actingAs($this->admin)
            ->postJson('/admin/resource-types', $data)
            ->assertStatus(201)
            ->assertJsonFragment(['name' => 'Video Tutorial']);

        $this->assertDatabaseHas('resource_types', ['slug' => 'video-tutorial']);
    }

    /** @test */
    public function admin_can_update_resource_type()
    {
        $type = ResourceType::factory()->create();

        $data = ['name' => 'Updated Type'];

        $this->actingAs($this->admin)
            ->putJson("/admin/resource-types/{$type->id}", $data)
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Updated Type']);

        $this->assertDatabaseHas('resource_types', ['id' => $type->id, 'name' => 'Updated Type']);
    }

    /** @test */
    public function admin_can_delete_resource_type()
    {
        $type = ResourceType::factory()->create();

        $this->actingAs($this->admin)
            ->deleteJson("/admin/resource-types/{$type->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('resource_types', ['id' => $type->id]);
    }
}
