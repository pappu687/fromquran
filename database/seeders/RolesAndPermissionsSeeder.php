<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            'view submissions',
            'approve submissions',
            'reject submissions',
            'delete submissions',
            'manage users',
            'manage roles',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        // Create roles and assign permissions

        // Admin - Full access
        $admin = Role::findOrCreate('Admin');
        $admin->givePermissionTo(Permission::all());

        // Moderator - Can approve/reject submissions
        $moderator = Role::findOrCreate('Moderator');
        $moderator->givePermissionTo([
            'view submissions',
            'approve submissions',
            'reject submissions',
            'delete submissions',
        ]);

        // Reviewer - Can only view submissions
        $reviewer = Role::findOrCreate('Reviewer');
        $reviewer->givePermissionTo([
            'view submissions',
        ]);

        // User - Regular user (no special permissions)
        Role::findOrCreate('User');

        $this->command->info('Roles and permissions created successfully!');
    }
}
