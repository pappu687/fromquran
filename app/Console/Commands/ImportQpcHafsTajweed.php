<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportQpcHafsTajweed extends Command
{
    protected $signature = 'import:qpc-hafs-tajweed {file=docs/qpc-hafs-tajweed.json}';
    protected $description = 'Import QPC Hafs Tajweed text into verses.text_uthmani_tajweed';

    public function handle(): int
    {
        $filePath = base_path($this->argument('file'));

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return self::FAILURE;
        }

        $this->info('Reading QPC Hafs Tajweed JSON...');
        $jsonContent = file_get_contents($filePath);
        $data = json_decode($jsonContent, true);

        if (!is_array($data)) {
            $this->error('Failed to parse JSON file.');
            return self::FAILURE;
        }

        $totalJsonRecords = count($data);
        $this->info("Total JSON records: {$totalJsonRecords}");

        $ayahMap = [];
        $malformedKeys = [];
        $emptyTexts = [];

        foreach ($data as $key => $entry) {
            if (!is_array($entry) || !isset($entry['verse_key'])) {
                $malformedKeys[] = $key;
                continue;
            }

            $verseKey = $entry['verse_key'];
            $text = $entry['text'] ?? '';

            if (empty($text)) {
                $emptyTexts[] = $verseKey;
            }

            $ayahMap[$verseKey] = $text;
        }

        $totalAyahs = count($ayahMap);
        $this->info("Ayahs to import: {$totalAyahs}");

        if (!empty($malformedKeys)) {
            $this->warn('Malformed keys skipped: ' . count($malformedKeys));
            foreach (array_slice($malformedKeys, 0, 10) as $key) {
                $this->warn("  - {$key}");
            }
        }

        if (!empty($emptyTexts)) {
            $this->warn('Empty texts found: ' . count($emptyTexts));
        }

        $this->info('Fetching existing verse keys from database...');
        $existingKeys = DB::table('verses')
            ->pluck('verse_key')
            ->flip()
            ->toArray();

        $this->info('Existing verses in DB: ' . count($existingKeys));

        $missingInDb = [];
        $validAyahs = [];

        foreach ($ayahMap as $verseKey => $text) {
            if (!isset($existingKeys[$verseKey])) {
                $missingInDb[] = $verseKey;
            } else {
                $validAyahs[$verseKey] = $text;
            }
        }

        if (!empty($missingInDb)) {
            $this->warn('Verse keys in JSON but not in DB: ' . count($missingInDb));
            foreach (array_slice($missingInDb, 0, 10) as $key) {
                $this->warn("  - {$key}");
            }
        }

        $batchSize = 100;
        $totalToUpdate = count($validAyahs);
        $this->info("Updating {$totalToUpdate} verses in batches of {$batchSize}...");

        $updatedCount = 0;

        DB::transaction(function () use ($validAyahs, $batchSize, &$updatedCount) {
            $batch = [];

            foreach ($validAyahs as $verseKey => $text) {
                $batch[] = [
                    'verse_key' => $verseKey,
                    'text_uthmani_tajweed' => $text,
                ];

                if (count($batch) >= $batchSize) {
                    $this->processBatch($batch);
                    $updatedCount += count($batch);
                    $batch = [];
                    $this->info("  ... {$updatedCount} updated");
                }
            }

            if (!empty($batch)) {
                $this->processBatch($batch);
                $updatedCount += count($batch);
            }
        });

        $this->newLine();
        $this->info('Import complete.');
        $this->info("  Total JSON records: {$totalJsonRecords}");
        $this->info("  Total ayahs parsed: {$totalAyahs}");
        $this->info("  Verses updated: {$updatedCount}");
        $this->info("  Missing in DB: " . count($missingInDb));
        $this->info("  Malformed keys: " . count($malformedKeys));

        $this->info('Clearing verse caches so changes take effect...');
        Cache::flush();
        $this->info('Cache cleared.');

        Log::info('QPC Hafs Tajweed import completed', [
            'total_json_records' => $totalJsonRecords,
            'total_ayahs' => $totalAyahs,
            'updated' => $updatedCount,
            'missing_in_db' => count($missingInDb),
            'malformed_keys' => count($malformedKeys),
        ]);

        return self::SUCCESS;
    }

    private function processBatch(array $batch): void
    {
        $cases = [];
        $verseKeys = [];

        foreach ($batch as $row) {
            $cases[] = "WHEN '{$row['verse_key']}' THEN ?";
            $verseKeys[] = $row['verse_key'];
        }

        $caseSql = implode(' ', $cases);
        $placeholders = implode(',', array_fill(0, count($verseKeys), '?'));

        $params = [];
        foreach ($batch as $row) {
            $params[] = $row['text_uthmani_tajweed'];
        }
        foreach ($verseKeys as $key) {
            $params[] = $key;
        }

        DB::update(
            "UPDATE verses SET text_uthmani_tajweed = CASE verse_key {$caseSql} END WHERE verse_key IN ({$placeholders})",
            $params
        );
    }
}
