<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Solarium\Client as SolariumClient;
use Solarium\Exception\HttpException as SolariumHttpException;

class ToolController extends Controller
{
    /**
     * Display the Tools page, passing Solr connection status.
     */
    public function index()
    {
        $solrStatus = $this->checkSolrConnection();

        return Inertia::render('admin/tools', [
            'solrStatus' => $solrStatus,
        ]);
    }

    /**
     * Send a test email to the provided address.
     */
    public function testEmail(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = $request->input('email');

        try {
            Mail::html(
                view('emails.test')->render(),
                function ($message) use ($email) {
                    $message->to($email)->subject('Test Email from FromQuran');
                }
            );

            return back()->with('success', "Test email sent to {$email}.");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to send email: ' . $e->getMessage());
        }
    }

    /**
     * Trigger a backup using spatie/laravel-backup.
     */
    public function createBackup()
    {
        try {
            Artisan::call('backup:run');
            $output = Artisan::output();

            return back()->with('success', 'Backup created successfully.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Backup failed: ' . $e->getMessage());
        }
    }

    /**
     * Clear all sessions.
     */
    public function clearSessions()
    {
        try {
            $driver = config('session.driver');

            if ($driver === 'database') {
                DB::table(config('session.table', 'sessions'))->truncate();
            } elseif ($driver === 'file') {
                Artisan::call('session:flush');
            }

            return redirect()->route('login')->with('success', 'All sessions have been cleared.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to clear sessions: ' . $e->getMessage());
        }
    }

    /**
     * Clear all application caches and optionally purge Cloudflare cache.
     */
    public function clearCaches()
    {
        try {
            Artisan::call('optimize:clear');

            $zoneId = config('services.cloudflare.zone_id');
            $apiToken = config('services.cloudflare.api_token');

            $cloudflareResult = null;

            if ($zoneId && $apiToken) {
                $response = Http::withToken($apiToken)
                    ->delete("https://api.cloudflare.com/client/v4/zones/{$zoneId}/purge_cache", [
                        'purge_everything' => true,
                    ]);

                $cloudflareResult = $response->successful()
                    ? 'Cloudflare cache purged.'
                    : 'Cloudflare purge failed: ' . $response->body();
            } else {
                $cloudflareResult = 'Cloudflare API not configured — skipped.';
            }

            return back()->with('success', "App caches cleared. {$cloudflareResult}");
        } catch (\Throwable $e) {
            return back()->with('error', 'Failed to clear caches: ' . $e->getMessage());
        }
    }

    /**
     * Check Solr connection and return status info.
     */
    private function checkSolrConnection(): array
    {
        try {
            /** @var SolariumClient $client */
            $client = app(SolariumClient::class);

            $ping = $client->createPing();
            $client->ping($ping);

            return ['connected' => true, 'message' => 'Success'];
        } catch (SolariumHttpException $e) {
            return ['connected' => false, 'message' => 'HTTP ' . $e->getCode() . ': ' . $e->getMessage()];
        } catch (\Throwable $e) {
            return ['connected' => false, 'message' => $e->getMessage()];
        }
    }
}
