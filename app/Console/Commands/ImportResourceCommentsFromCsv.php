<?php

namespace App\Console\Commands;

use App\Models\UserVerseResource;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportResourceCommentsFromCsv extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:resource-comments {path : Path to the CSV file}
                            {--dry-run : Run without making changes to see what would be updated}
                            {--batch-size=100 : Number of records to process per batch}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import resource comments from CSV file and update user_verse_resources table by matching resource_url';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $path = $this->argument('path');
        $isDryRun = $this->option('dry-run');
        $batchSize = (int) $this->option('batch-size');

        // Validate file exists
        if (!file_exists($path)) {
            $this->error("CSV file not found: {$path}");
            return Command::FAILURE;
        }

        $this->info("Reading CSV file: {$path}");

        // Read and parse CSV
        $csvRows = $this->parseCsv($path);

        if (empty($csvRows)) {
            $this->error('No valid data found in CSV file');
            return Command::FAILURE;
        }

        $totalRows = count($csvRows);
        $this->info("Found {$totalRows} rows in CSV file");

        if ($isDryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }

        // Get all resource URLs from the database
        $dbResources = UserVerseResource::query()
            ->select('id', 'resource_url', 'comment')
            ->get()
            ->keyBy('resource_url');

        $this->info("Found {$dbResources->count()} resources in database");

        // Statistics
        $stats = [
            'matched' => 0,
            'updated' => 0,
            'skipped' => 0,
            'not_found' => 0,
        ];

        $updates = [];

        $this->newLine();
        $this->info('Processing CSV rows...');
        $this->newLine();

        $progressBar = $this->output->createProgressBar($totalRows);
        $progressBar->start();

        foreach ($csvRows as $row) {
            $url = $row['url'] ?? null;
            $description = $row['description'] ?? null;

            if (empty($url)) {
                $stats['skipped']++;
                $progressBar->advance();
                continue;
            }

            $resource = $dbResources->get($url);

            if (!$resource) {
                $stats['not_found']++;
                $progressBar->advance();
                continue;
            }

            $stats['matched']++;

            // Check if comment is different
            if ($description && $resource->comment !== $description) {
                $updates[$resource->id] = [
                    'id' => $resource->id,
                    'resource_url' => $url,
                    'old_comment' => $resource->comment,
                    'new_comment' => $description,
                ];
                $stats['updated']++;
            } else {
                $stats['skipped']++;
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine();
        $this->newLine();

        // Display summary
        $this->info('Summary:');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total CSV rows', $totalRows],
                ['Matched URLs', $stats['matched']],
                ['Would update', $stats['updated']],
                ['Skipped (same comment)', $stats['skipped']],
                ['Not found in DB', $stats['not_found']],
            ]
        );

        // Show sample of changes
        if (count($updates) > 0) {
            $sampleSize = min(10, count($updates));
            $this->newLine();
            $this->info("Sample of changes (showing {$sampleSize} of " . count($updates) . "):");
            $this->newLine();

            $sampleRows = array_slice(array_values($updates), 0, $sampleSize);
            $tableData = [];
            foreach ($sampleRows as $update) {
                $tableData[] = [
                    $update['id'],
                    strlen($update['resource_url']) > 50
                        ? substr($update['resource_url'], 0, 47) . '...'
                        : $update['resource_url'],
                    $update['old_comment'] ?? '(empty)',
                    strlen($update['new_comment']) > 40
                        ? substr($update['new_comment'], 0, 37) . '...'
                        : $update['new_comment'],
                ];
            }

            $this->table(
                ['ID', 'Resource URL', 'Old Comment', 'New Comment'],
                $tableData
            );
        }

        // Apply updates if not dry run
        if (!$isDryRun && count($updates) > 0) {
            $this->newLine();
            $this->info('Applying updates to database...');

            $chunks = array_chunk(array_values($updates), $batchSize);
            $totalChunks = count($chunks);

            foreach ($chunks as $index => $chunk) {
                DB::beginTransaction();
                try {
                    foreach ($chunk as $update) {
                        UserVerseResource::where('id', $update['id'])
                            ->update(['comment' => $update['new_comment']]);
                    }
                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    $this->error("Error in batch " . ($index + 1) . ": " . $e->getMessage());
                    return Command::FAILURE;
                }
            }

            $this->info("Successfully updated {$stats['updated']} records in {$totalChunks} batch(es)");
        } elseif ($isDryRun && count($updates) > 0) {
            $this->newLine();
            $this->warn('Dry run complete - no changes were made to the database');
            $this->info('Run without --dry-run to apply these changes');
        }

        return Command::SUCCESS;
    }

    /**
     * Parse CSV file and return array of rows
     */
    protected function parseCsv(string $path): array
    {
        $rows = [];
        $handle = fopen($path, 'r');

        if ($handle === false) {
            $this->error("Could not open file: {$path}");
            return [];
        }

        // Read header
        $header = fgetcsv($handle);

        if ($header === false) {
            fclose($handle);
            return [];
        }

        // Normalize header keys (lowercase, trim)
        $header = array_map(fn($h) => strtolower(trim($h)), $header);

        // Validate required columns
        if (!in_array('url', $header, true)) {
            fclose($handle);
            $this->error('CSV must contain a "url" column');
            return [];
        }

        // Read data rows
        $rowNumber = 1; // Header is row 0
        while (($data = fgetcsv($handle)) !== false) {
            $rowNumber++;
            $row = array_combine($header, $data);

            if ($row === false) {
                $this->warn("Skipping malformed row {$rowNumber}");
                continue;
            }

            $rows[] = $row;
        }

        fclose($handle);
        return $rows;
    }
}
