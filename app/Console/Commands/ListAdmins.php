<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ListAdmins extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:list-admins';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all admin users';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $admins = User::role('Admin')->get(['id', 'name', 'email']);

        if ($admins->isEmpty()) {
            $this->info('No admin users found.');
            return self::SUCCESS;
        }

        $this->table(
            ['ID', 'Name', 'Email'],
            $admins->toArray()
        );

        return self::SUCCESS;
    }
}
