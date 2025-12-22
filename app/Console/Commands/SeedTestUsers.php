<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SeedTestUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:seed-test {--password=password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed 10 test users with different roles (1 Admin, 4 Moderators, 2 Reviewers, 3 Users)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $password = $this->option('password');
        $hashedPassword = Hash::make($password);

        $this->info('Seeding test users with password: ' . $password);
        $this->newLine();

        // 1 Admin
        $admin = User::updateOrCreate(
            ['email' => 'admin@fromquran.test'],
            [
                'name' => 'Admin User',
                'password' => $hashedPassword,
                'email_verified_at' => now(),
            ]
        );
        $admin->syncRoles(['Admin']);
        $this->info('✓ Created: admin@fromquran.test (Admin)');

        // 4 Moderators
        for ($i = 1; $i <= 4; $i++) {
            $moderator = User::updateOrCreate(
                ['email' => "moderator{$i}@fromquran.test"],
                [
                    'name' => "Moderator {$i}",
                    'password' => $hashedPassword,
                    'email_verified_at' => now(),
                ]
            );
            $moderator->syncRoles(['Moderator']);
            $this->info("✓ Created: moderator{$i}@fromquran.test (Moderator)");
        }

        // 2 Reviewers
        for ($i = 1; $i <= 2; $i++) {
            $reviewer = User::updateOrCreate(
                ['email' => "reviewer{$i}@fromquran.test"],
                [
                    'name' => "Reviewer {$i}",
                    'password' => $hashedPassword,
                    'email_verified_at' => now(),
                ]
            );
            $reviewer->syncRoles(['Reviewer']);
            $this->info("✓ Created: reviewer{$i}@fromquran.test (Reviewer)");
        }

        // 3 Regular Users
        for ($i = 1; $i <= 3; $i++) {
            $user = User::updateOrCreate(
                ['email' => "user{$i}@fromquran.test"],
                [
                    'name' => "User {$i}",
                    'password' => $hashedPassword,
                    'email_verified_at' => now(),
                ]
            );
            $user->syncRoles(['User']);
            $this->info("✓ Created: user{$i}@fromquran.test (User)");
        }

        $this->newLine();
        $this->info('✅ All test users created successfully!');
        $this->newLine();
        $this->table(
            ['Role', 'Count', 'Email Pattern'],
            [
                ['Admin', '1', 'admin@fromquran.test'],
                ['Moderator', '4', 'moderator[1-4]@fromquran.test'],
                ['Reviewer', '2', 'reviewer[1-2]@fromquran.test'],
                ['User', '3', 'user[1-3]@fromquran.test'],
            ]
        );
        $this->info('Password for all users: ' . $password);
    }
}
