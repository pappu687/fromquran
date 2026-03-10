<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ChangePassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:change-password {--email= : The email address of the user}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Change the password of a user by email';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->option('email');

        if (! $email) {
            $this->error('The --email option is required.');
            return self::FAILURE;
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("User not found with email: {$email}");
            return self::FAILURE;
        }

        $password = $this->secret('Enter new password');

        if (! $password) {
            $this->error('Password cannot be empty.');
            return self::FAILURE;
        }

        $passwordConfirmation = $this->secret('Confirm new password');

        if ($password !== $passwordConfirmation) {
            $this->error('Passwords do not match.');
            return self::FAILURE;
        }

        $user->update([
            'password' => $password,
        ]);

        $this->info("Password for user {$email} changed successfully.");

        return self::SUCCESS;
    }
}
