<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ImportChapterInfo extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'quran:import-chapter-info';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import surah info from SQLite database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dbPath = database_path('surah-info-en.db');

        if (!file_exists($dbPath)) {
            $this->error("Database file not found: {$dbPath}");
            return 1;
        }

        $this->info("Importing surah info from {$dbPath}...");

        $sqlite = new \SQLite3($dbPath);
        $results = $sqlite->query("SELECT * FROM surah_infos");

        $count = 0;
        while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
            \App\Models\ChapterInfo::updateOrCreate(
                ['surah_number' => $row['surah_number']],
                [
                    'surah_name' => $row['surah_name'],
                    'text' => $row['text'],
                    'short_text' => $row['short_text'],
                ]
            );
            $count++;
        }

        $this->info("Successfully imported {$count} surah infos.");
        return 0;
    }
}
