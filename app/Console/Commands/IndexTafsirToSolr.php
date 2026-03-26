<?php

namespace App\Console\Commands;

use App\Models\TafseerContent;
use App\Models\TafseerBook;
use Illuminate\Console\Command;
use Solarium\Client;

class IndexTafsirToSolr extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'solr:index-tafsir';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Index all tafsir content into Solr using Solarium';

    public function __construct(protected Client $client)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $totalTafsir = TafseerContent::count();

        if ($totalTafsir === 0) {
            $this->warn('No tafsir found to index.');
            return self::SUCCESS;
        }

        $this->info("Indexing {$totalTafsir} tafsir entries into Solr core '".config('solr.endpoint.localhost.core')."'");

        // Get all tafseer books for reference
        $tafseerBooks = TafseerBook::ordered()->get()->keyBy('id');

        // Clear existing tafsir documents from Solr
        $this->info('Clearing existing tafsir documents from Solr index...');
        $deleteUpdate = $this->client->createUpdate();
        $deleteUpdate->addDeleteQuery('document_type_s:tafsir OR type_s:tafsir');
        $deleteUpdate->addCommit();
        $this->client->update($deleteUpdate);

        $bar = $this->output->createProgressBar($totalTafsir);
        $bar->start();

        TafseerContent::orderBy('tafsir_id')
            ->orderBy('ayah_key')
            ->chunk(200, function ($tafsirContents) use ($bar, $tafseerBooks) {
                $update = $this->client->createUpdate();

                foreach ($tafsirContents as $content) {
                    $doc = $update->createDocument();

                    // Get the tafseer book info
                    $tafseerBook = $tafseerBooks->get($content->tafsir_id);
                    if (!$tafseerBook) {
                        $this->warn("Skipping tafsir content with invalid tafseer_id: {$content->tafsir_id}");
                        $bar->advance();
                        continue;
                    }

                    // Create unique document id using tafseer_id and ayah_key
                    $doc->id = 'tafsir_' . $content->tafsir_id . '_' . str_replace(':', '_', $content->ayah_key ?? '');

                    // Use the same document type fields as other non-verse Solr documents.
                    $doc->document_type_t = 'tafsir';
                    $doc->document_type_s = 'tafsir';

                    // Tafseer book info
                    $doc->tafsir_id_i = (int) $content->tafsir_id;
                    $doc->tafsir_book_name_s = $tafseerBook->name;
                    $doc->tafsir_book_slug_s = $tafseerBook->slug;

                    // Ayah/verse info
                    $doc->ayah_key_s = $content->ayah_key;

                    if ($content->ayah_key) {
                        [$chapterId, $verseNumber] = explode(':', $content->ayah_key);
                        $doc->chapter_id_i = (int) $chapterId;
                        $doc->verse_number_i = (int) $verseNumber;
                    }

                    // Group ayah info for multi-verse tafsir
                    $doc->group_ayah_key_s = $content->group_ayah_key;
                    $doc->from_ayah_s = $content->from_ayah;
                    $doc->to_ayah_s = $content->to_ayah;

                    if ($content->from_ayah) {
                        [$fromChapterId, $fromVerseNumber] = explode(':', $content->from_ayah);
                        $doc->from_chapter_id_i = (int) $fromChapterId;
                        $doc->from_verse_number_i = (int) $fromVerseNumber;
                    }

                    if ($content->to_ayah) {
                        [$toChapterId, $toVerseNumber] = explode(':', $content->to_ayah);
                        $doc->to_chapter_id_i = (int) $toChapterId;
                        $doc->to_verse_number_i = (int) $toVerseNumber;
                    }

                    // Array of ayah_keys (stored as comma-separated string)
                    if (!empty($content->ayah_keys) && is_array($content->ayah_keys)) {
                        $doc->ayah_keys_ss = $content->ayah_keys;
                    }

                    // Keep tafsir text in the shared searchable field and the legacy field.
                    $doc->description_t = $content->text;
                    $doc->text_t = $content->text;

                    $update->addDocument($doc);
                    $bar->advance();
                }

                $update->addCommit();
                $this->client->update($update);
            });

        $bar->finish();
        $this->newLine(2);
        $this->info('Tafsir indexed into Solr successfully.');

        return self::SUCCESS;
    }
}
