<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class SeedDemoUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:seed-demo-users';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create demo users with Admin, Moderator, Reviewer and User roles';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Seeding roles, permissions and demo users...');

        // Ensure roles exist
        $roles = [
            'Admin',
            'Moderator',
            'Reviewer',
            'User',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }

        // Ensure permissions exist
        $permissions = [
            'view submissions',
            'approve submissions',
            'reject submissions',
            'submit resources',
        ];

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => 'web']);
        }

        // Assign permissions to roles
        $adminRole = Role::where('name', 'Admin')->first();
        $moderatorRole = Role::where('name', 'Moderator')->first();
        $reviewerRole = Role::where('name', 'Reviewer')->first();
        $userRole = Role::where('name', 'User')->first();

        if ($adminRole) {
            $adminRole->givePermissionTo($permissions);
        }

        if ($moderatorRole) {
            $moderatorRole->syncPermissions([
                'view submissions',
                'approve submissions',
                'reject submissions',
            ]);
        }

        if ($reviewerRole) {
            $reviewerRole->syncPermissions([
                'view submissions',
            ]);
        }

        if ($userRole) {
            $userRole->syncPermissions([
                'submit resources',
            ]);
        }

        // Shared password for all demo users
        $password = 'Password123!';

        // Helper to (re)create a user
        $createUser = function (string $name, string $email, string $roleName) use ($password) {
            /** @var \App\Models\User $user */
            $user = User::where('email', $email)->first();

            if (! $user) {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => $password,
                ]);
                $this->info("Created user {$email}");
            } else {
                $user->update([
                    'name' => $name,
                    'password' => $password,
                ]);
                $this->info("Updated user {$email}");
            }

            $user->syncRoles([$roleName]);
        };

        // 1 Admin
        $createUser('Admin User', 'admin@example.com', 'Admin');

        // 4 Moderators
        for ($i = 1; $i <= 4; $i++) {
            $createUser("Moderator {$i}", "moderator{$i}@example.com", 'Moderator');
        }

        // 2 Reviewers
        for ($i = 1; $i <= 2; $i++) {
            $createUser("Reviewer {$i}", "reviewer{$i}@example.com", 'Reviewer');
        }

        // 3 Users
        for ($i = 1; $i <= 3; $i++) {
            $createUser("User {$i}", "user{$i}@example.com", 'User');
        }

        $this->newLine();
        $this->info('Demo users seeded successfully.');
        $this->info("Login password for all demo users: {$password}");

        return static::SUCCESS;
    }
}


