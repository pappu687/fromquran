<?php

namespace App\Console\Commands;

use App\Mail\VerseReportAdminEmail;
use App\Models\VerseReport;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestVerseReportEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test-verse-report {--report-id= : Existing verse report ID to use}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test verse report admin email using the same mailable as the report controller.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $adminEmail = config('mail.admin.address');

        if (! $adminEmail) {
            $this->error('mail.admin.address is not configured. Set MAIL_ADMIN_EMAIL in your .env.');

            return self::FAILURE;
        }

        $reportId = $this->option('report-id');

        if ($reportId) {
            $report = VerseReport::find($reportId);

            if (! $report) {
                $this->error("Verse report {$reportId} was not found.");

                return self::FAILURE;
            }
        } else {
            $report = new VerseReport([
                'user_id' => 1,
                'chapter_id' => 1,
                'verse_id' => 1,
                'type' => 'translation_error',
                'description' => 'This is a test verse report email generated from the artisan command.',
                'status' => 'pending',
            ]);
        }

        try {
            Mail::to($adminEmail)->send(new VerseReportAdminEmail($report));
            $this->info("Verse report email sent to {$adminEmail}.");

            return self::SUCCESS;
        } catch (\Throwable $exception) {
            $this->error('Failed to send verse report email: ' . $exception->getMessage());

            return self::FAILURE;
        }
    }
}
