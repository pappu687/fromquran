<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class SendTestEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test email to a specified address to verify email configuration.';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $email = $this->ask('Please enter the email address to send the test email to');

        $validator = Validator::make(['email' => $email], [
            'email' => ['required', 'email'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return 1;
        }

        $this->info("Sending test email to: {$email}...");

        try {
            Mail::html(
                view('emails.test')->render(),
                function ($message) use ($email) {
                    $message->to($email)->subject('Test Email from FromQuran Artisan');
                }
            );

            $this->info("Test email sent successfully to {$email}!");
            return 0;
        } catch (\Throwable $e) {
            $this->error('Failed to send email: ' . $e->getMessage());
            return 1;
        }
    }
}
