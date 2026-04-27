<?php

namespace App\Console\Commands;

use App\Services\QuranFoundationClient;
use Illuminate\Console\Command;
use Illuminate\Http\Client\Response;
use Throwable;

class VerifyQuranFoundationApi extends Command
{
    protected $signature = 'qf:verify
                            {--chapter= : Chapter number for the sample audio check}
                            {--chapter-reciter= : Chapter-reciter ID for the sample audio check}';

    protected $description = 'Verify Quran Foundation Content API credentials and core resources/audio endpoints';

    public function __construct(private readonly QuranFoundationClient $client)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Verifying Quran Foundation Content API integration...');
        $this->line('Environment: '.config('quran-foundation.environment'));
        $this->line('API base: '.config('quran-foundation.api_base_url'));
        $this->line('Cache store: '.config('quran-foundation.cache_store'));
        $this->newLine();

        try {
            $checks = [
                'chapters' => $this->checkChapters(),
                'resources recitations' => $this->checkSuccessful('/resources/recitations'),
                'resources translations' => $this->checkSuccessful('/resources/translations'),
                'audio chapter recitation' => $this->checkSuccessful($this->audioPath()),
            ];
        } catch (Throwable $exception) {
            $this->error('Verification failed before all checks completed.');
            $this->line($exception->getMessage());

            return self::FAILURE;
        }

        $failed = false;

        foreach ($checks as $name => $check) {
            if ($check['ok']) {
                $this->info(sprintf('PASS %-28s status=%s', $name, $check['status']));
            } else {
                $failed = true;
                $this->error(sprintf('FAIL %-28s status=%s', $name, $check['status']));
                $this->line('  '.$check['message']);
            }
        }

        $this->newLine();

        if ($failed) {
            $this->error('Quran Foundation verification failed.');

            return self::FAILURE;
        }

        $this->info('Quran Foundation verification passed.');

        return self::SUCCESS;
    }

    /**
     * @return array{ok: bool, status: int, message: string}
     */
    private function checkChapters(): array
    {
        $response = $this->client->get('/chapters');
        $payload = $response->json();
        $hasChapters = is_array(data_get($payload, 'chapters'));

        return [
            'ok' => $response->successful() && $hasChapters,
            'status' => $response->status(),
            'message' => $hasChapters
                ? 'Chapters array found.'
                : 'Expected response to contain a chapters array.',
        ];
    }

    /**
     * @return array{ok: bool, status: int, message: string}
     */
    private function checkSuccessful(string $path): array
    {
        $response = $this->client->get($path);

        return [
            'ok' => $response->successful(),
            'status' => $response->status(),
            'message' => $this->failureMessage($response),
        ];
    }

    private function failureMessage(Response $response): string
    {
        if ($response->successful()) {
            return 'OK';
        }

        return (string) data_get(
            $response->json(),
            'message',
            'Upstream request failed. Check credentials, QF_ENV, and network access.',
        );
    }

    private function audioPath(): string
    {
        $chapter = (int) ($this->option('chapter') ?: config('quran-foundation.verify_chapter_id'));
        $chapterReciter = (int) ($this->option('chapter-reciter') ?: config('quran-foundation.verify_chapter_reciter_id'));

        return "/chapter_recitations/{$chapterReciter}/{$chapter}";
    }
}
