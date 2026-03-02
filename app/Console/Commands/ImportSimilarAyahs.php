<?php

namespace App\Console\Commands;

use App\Models\ResourceType;
use App\Models\User;
use App\Models\Verse;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportSimilarAyahs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:similar-ayahs {--verse= : Only import for a specific verse key (e.g., 2:5)} {--truncate : Truncate existing similar verses resources before import}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import Similar Ayahs into User Verse Resources table for Solr indexing.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Similar Ayahs import...');

        // 1. Ensure "Similar Verses" resource type exists
        $resourceType = ResourceType::firstOrCreate(
            ['slug' => 'similar_verses'],
            [
                'name' => 'Similar Verses',
                'display_order' => 10,
            ]
        );

        // Optional: truncate existing similar verses
        if ($this->option('truncate')) {
            $this->info('Truncating existing Similar Verses resources...');
            DB::table('user_verse_resources')
                ->where('resource_type_id', $resourceType->id)
                ->delete();
        }

        $query = DB::table('similar_ayahs');
        
        if ($verseKey = $this->option('verse')) {
            $this->info("Filtering for verse key: {$verseKey}");
            $query->where('verse_key', $verseKey);
        }

        // Group matched_ayah_key by verse_key
        $grouped = $query->orderBy('verse_key')->get()->groupBy('verse_key');

        $adminUser = User::where('email', 'admin@example.com')->first();
        // Fallback to first user or ID 1 if admin is not found
        $adminUserId = $adminUser ? $adminUser->id : 1;

        $batch = [];
        $batchSize = 250;
        $processed = 0;

        foreach ($grouped as $vKey => $matches) {
            $verse = Verse::where('verse_key', $vKey)->first();

            if (!$verse) {
                continue;
            }

            // Extract all matched_ayah_key into array
            $matchedKeys = $matches->pluck('matched_ayah_key')->values()->toArray();

            // Encode as JSON for the comment field
            $commentJson = json_encode($matchedKeys);

            // Check if we already have this resource to update it (or insert)
            $existing = DB::table('user_verse_resources')
                ->where('verse_id', $verse->id)
                ->where('resource_type_id', $resourceType->id)
                ->first();

            if ($existing) {
                DB::table('user_verse_resources')
                    ->where('id', $existing->id)
                    ->update([
                        'comment' => $commentJson,
                        'updated_at' => now(),
                    ]);
            } else {
                $batch[] = [
                    'user_id' => $adminUserId,
                    'verse_id' => $verse->id,
                    'resource_type_id' => $resourceType->id,
                    'resource_url' => '', // Empty for similar verses
                    'resource_title' => 'Similar Verses for ' . $vKey,
                    'comment' => $commentJson,
                    'status' => 'approved',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if (count($batch) >= $batchSize) {
                    DB::table('user_verse_resources')->insert($batch);
                    $batch = [];
                }
            }

            $processed++;
            if ($processed % 500 === 0) {
                $this->info("Processed {$processed} verses...");
            }
        }

        // Save last batch
        if (!empty($batch)) {
            DB::table('user_verse_resources')->insert($batch);
        }

        $this->info("Import completed successfully! Processed {$processed} verses.");
        return Command::SUCCESS;
    }
}
