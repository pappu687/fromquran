<?php

namespace App\Console\Commands;

use App\Models\Verse;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Solarium\Client;

class IndexVersesToSolr extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'solr:index-verses';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Index all verses and their translations into Solr using Solarium';

    public function __construct(protected Client $client)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $totalVerses = Verse::count();

        if ($totalVerses === 0) {
            $this->warn('No verses found to index.');
            return self::SUCCESS;
        }

        $this->info("Indexing {$totalVerses} verses into Solr core '".config('solr.endpoint.localhost.core')."'");

        // Clear existing documents for a full reindex
        $this->info('Clearing existing Solr index (delete by query: *:*)...');
        $deleteUpdate = $this->client->createUpdate();
        $deleteUpdate->addDeleteQuery('*:*');
        $deleteUpdate->addCommit();
        $this->client->update($deleteUpdate);

        $bar = $this->output->createProgressBar($totalVerses);
        $bar->start();

        Verse::with(['translations' => function ($query) {
            $query->orderBy('priority', 'desc');
        }])
            ->orderBy('id')
            ->chunk(200, function ($verses) use ($bar) {
                $update = $this->client->createUpdate();
                $verseIds = $verses->pluck('id')->all();
                $resourceCountsQuery = DB::table('user_verse_resources')
                    ->select('verse_id', DB::raw('COUNT(*) as resource_count'))
                    ->whereIn('verse_id', $verseIds)
                    ->where('status', 'approved');

                if (Schema::hasColumn('user_verse_resources', 'deleted_at')) {
                    $resourceCountsQuery->whereNull('deleted_at');
                }

                $resourceCounts = $resourceCountsQuery
                    ->groupBy('verse_id')
                    ->pluck('resource_count', 'verse_id');

                foreach ($verses as $verse) {
                    $doc = $update->createDocument();

                    // Unique document id: use verse_key
                    $doc->id = $verse->verse_key;

                    // Core verse fields (using Solr dynamic field suffixes)
                    $doc->chapter_id_i = (int) $verse->chapter_id;
                    $doc->verse_number_i = (int) $verse->verse_number;
                    $doc->verse_index_i = (int) $verse->verse_index;
                    $doc->verse_key_s = $verse->verse_key;
                    $doc->text_uthmani_t = $verse->text_uthmani;
                    $doc->juz_number_i = (int) $verse->juz_number;
                    $doc->page_number_i = (int) $verse->page_number;
                    $doc->ruku_number_i = (int) $verse->ruku_number;
                    $doc->surah_ruku_number_i = (int) $verse->surah_ruku_number;
                    $doc->num_resource_i = (int) ($resourceCounts[$verse->id] ?? 0);

                    foreach ($verse->translations as $translation) {
                        if (
                            !$translation->resource_content_id ||
                            !trim((string) $translation->text)
                        ) {
                            continue;
                        }

                        // Field like: translation_131_t where 131 is resource_content_id.
                        $fieldName = 'translation_' . $translation->resource_content_id . '_t';
                        $doc->$fieldName = $translation->text;
                    }

                    $update->addDocument($doc);
                    $bar->advance();
                }

                $update->addCommit();
                $this->client->update($update);
            });

        $bar->finish();
        $this->newLine(2);
        $this->info('Verses indexed into Solr successfully.');

        return self::SUCCESS;
    }
}
