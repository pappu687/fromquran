<?php

namespace App\Console\Commands;

use App\Models\Verse;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ImportIslamqa extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:islamqa {--input-file= : The absolute path to the CSV file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import IslamQA CSV and link fatwas to Quran verses based on references in the answer.';

    /**
     * Cache for verse key to verse ID mapping.
     *
     * @var array
     */
    protected $verseCache = [];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filePath = $this->option('input-file');

        if (!$filePath) {
            $this->error('The --input-file option is required.');
            return 1;
        }

        if (!File::exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return 1;
        }

        $this->info("Starting import from: {$filePath}");

        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            $this->error('Could not open the file.');
            return 1;
        }

        // Skip header row
        $header = fgetcsv($handle);
        if ($header === false) {
            $this->error('Empty file.');
            return 1;
        }

        // Get column indices
        $columns = array_flip($header);
        $urlIndex = $columns['url'] ?? null;
        $answerIndex = $columns['answer'] ?? null;

        if ($urlIndex === null || $answerIndex === null) {
            $this->error('CSV must contain "url" and "answer" columns.');
            return 1;
        }

        $batch = [];
        $batchSize = 500;
        $processedRows = 0;
        $matchesFound = 0;
        $startTime = microtime(true);

        while (($row = fgetcsv($handle)) !== false) {
            $processedRows++;
            
            $url = $row[$urlIndex] ?? '';
            $answer = $row[$answerIndex] ?? '';

            if (empty($answer)) {
                continue;
            }

            // Regex for chapter:verse (max 3 digits before and after :)
            // Expected format: 39:24, 2:286 etc.
            if (preg_match_all('/\b(\d{1,3}):(\d{1,3})\b/', $answer, $matches)) {
                $references = array_unique($matches[0]);

                foreach ($references as $reference) {
                    $verseId = $this->getVerseId($reference);

                    if ($verseId) {
                        $batch[] = [
                            'user_id' => 1,
                            'verse_id' => $verseId,
                            'resource_type_id' => 7, // Fatwa
                            'resource_url' => $url,
                            'comment' => $answer,
                            'status' => 'approved',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                        $matchesFound++;

                        if (count($batch) >= $batchSize) {
                            $this->saveBatch($batch);
                            $batch = [];
                        }
                    }
                }
            }

            if ($processedRows % 1000 === 0) {
                $this->info("Processed {$processedRows} rows... Matches found: {$matchesFound}");
            }
        }

        // Save last batch
        if (!empty($batch)) {
            $this->saveBatch($batch);
        }

        fclose($handle);

        $endTime = microtime(true);
        $duration = round($endTime - $startTime, 2);

        $this->info("Import completed!");
        $this->info("Total rows processed: {$processedRows}");
        $this->info("Total matches found and imported: {$matchesFound}");
        $this->info("Time taken: {$duration} seconds");

        return 0;
    }

    /**
     * Get verse ID from cache or database.
     *
     * @param string $verseKey
     * @return int|null
     */
    protected function getVerseId(string $verseKey): ?int
    {
        if (isset($this->verseCache[$verseKey])) {
            return $this->verseCache[$verseKey];
        }

        $verse = Verse::where('verse_key', $verseKey)->first();
        
        if ($verse) {
            $this->verseCache[$verseKey] = $verse->id;
            return $verse->id;
        }

        return null;
    }

    /**
     * Save a batch of records to the database.
     *
     * @param array $batch
     */
    protected function saveBatch(array $batch)
    {
        // Use insertOrIgnore to avoid duplicates if necessary, 
        // or just insert if we expect fresh data each time.
        // Given 'user_id', 'verse_id', 'resource_type_id', 'resource_url', 'comment' 
        // there is no unique constraint shown in the migration except for id.
        DB::table('user_verse_resources')->insert($batch);
    }
}
