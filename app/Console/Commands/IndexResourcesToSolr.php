<?php

namespace App\Console\Commands;

use App\Models\Translation;
use App\Models\UserChapterResource;
use App\Models\UserVerseResource;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Solarium\Client;

class IndexResourcesToSolr extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'solr:index-resources';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Index user resources and translations into Solr in a unified format';

    public function __construct(protected Client $client)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info("Indexing resources into Solr core '" . config('solr.endpoint.localhost.core') . "'");

        // Clear existing docs for these types
        $this->info('Clearing existing unified resource documents from Solr...');
        $deleteUpdate = $this->client->createUpdate();
        $deleteUpdate->addDeleteQuery('document_type_s:user_verse_resource OR document_type_s:user_chapter_resource OR document_type_s:translation');
        $deleteUpdate->addCommit();
        $this->client->update($deleteUpdate);

        $this->indexUserVerseResources();
        $this->indexUserChapterResources();
        $this->indexTranslations();

        $this->newLine();
        $this->info('All resources indexed into Solr successfully.');

        return self::SUCCESS;
    }

    protected function indexUserVerseResources()
    {
        $count = UserVerseResource::approved()->count();
        if ($count === 0) {
            $this->warn('No approved user verse resources found.');
            return;
        }

        $this->info("Indexing {$count} user verse resources...");
        $bar = $this->output->createProgressBar($count);
        $bar->start();

        UserVerseResource::approved()
            ->with(['user:id,name', 'resourceType:id,name', 'verse:id,chapter_id,verse_number', 'verse.chapter:id,chapter_number'])
            ->chunk(200, function ($resources) use ($bar) {
                $update = $this->client->createUpdate();
                foreach ($resources as $resource) {
                    $doc = $update->createDocument();
                    $doc->id = 'uvr_' . $resource->id;
                    $doc->document_type_t = 'user_verse_resource';
                    $doc->document_type_s = 'user_verse_resource';
                    $doc->verse_id_i = (int) $resource->verse_id;
                    $doc->chapter_id_i = (int) $resource->verse?->chapter_id;
                    $doc->verse_number_i = (int) $resource->verse?->verse_number;
                    $doc->chapter_number_i = (int) $resource->verse?->chapter?->chapter_number;
                    $doc->title_t = $resource->resource_title;
                    $doc->description_t = $resource->comment;
                    $doc->resource_url_s = $resource->resource_url;
                    $doc->thumbnail_url_s = $resource->thumbnail_url;
                    $doc->status_s = $resource->status;
                    $doc->user_name_s = $resource->user?->name;
                    $doc->resource_type_name_s = $resource->resourceType?->name;
                    $doc->created_at_dt = $resource->created_at?->format('Y-m-d\TH:i:s\Z');

                    $update->addDocument($doc);
                    $bar->advance();
                }
                $update->addCommit();
                $this->client->update($update);
            });

        $bar->finish();
        $this->newLine();
    }

    protected function indexUserChapterResources()
    {
        // Assuming status exists here too based on UserVerseResource
        $query = UserChapterResource::query();
        if (Schema::hasColumn('user_chapter_resources', 'status')) {
            $query->where('status', 'approved');
        }

        $count = $query->count();
        if ($count === 0) {
            $this->warn('No user chapter resources found.');
            return;
        }

        $this->info("Indexing {$count} user chapter resources...");
        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $query->with(['user:id,name', 'resourceType:id,name', 'chapter:id,chapter_number'])
            ->chunk(200, function ($resources) use ($bar) {
                $update = $this->client->createUpdate();
                foreach ($resources as $resource) {
                    $doc = $update->createDocument();
                    $doc->id = 'ucr_' . $resource->id;
                    $doc->document_type_t = 'user_chapter_resource';
                    $doc->document_type_s = 'user_chapter_resource';
                    $doc->chapter_id_i = (int) $resource->chapter_id;
                    $doc->chapter_number_i = (int) $resource->chapter?->chapter_number;
                    $doc->title_t = $resource->resource_title;
                    $doc->description_t = $resource->comment;
                    $doc->resource_url_s = $resource->resource_url;
                    $doc->thumbnail_url_s = $resource->thumbnail_url;
                    $doc->user_name_s = $resource->user?->name;
                    $doc->resource_type_name_s = $resource->resourceType?->name;
                    $doc->created_at_dt = $resource->created_at?->format('Y-m-d\TH:i:s\Z');

                    $update->addDocument($doc);
                    $bar->advance();
                }
                $update->addCommit();
                $this->client->update($update);
            });

        $bar->finish();
        $this->newLine();
    }

    protected function indexTranslations()
    {
        $count = Translation::count();
        if ($count === 0) {
            $this->warn('No translations found.');
            return;
        }

        $this->info("Indexing {$count} translations...");
        $bar = $this->output->createProgressBar($count);
        $bar->start();

        Translation::with(['verse:id,chapter_id,verse_number', 'verse.chapter:id,chapter_number'])
            ->chunk(200, function ($translations) use ($bar) {
                $update = $this->client->createUpdate();
                foreach ($translations as $translation) {
                    $doc = $update->createDocument();
                    $doc->id = 'trans_' . $translation->id;
                    $doc->document_type_t = 'translation';
                    $doc->document_type_s = 'translation';
                    $doc->verse_id_i = (int) $translation->verse_id;
                    $doc->chapter_id_i = (int) $translation->chapter_id;
                    $doc->verse_number_i = (int) $translation->verse?->verse_number;
                    $doc->chapter_number_i = (int) $translation->verse?->chapter?->chapter_number;
                    $doc->language_id_i = (int) $translation->language_id;
                    $doc->title_t = $translation->resource_name;
                    $doc->description_t = $translation->text;
                    $doc->resource_type_name_s = 'Translation';
                    $doc->created_at_dt = $translation->created_at?->format('Y-m-d\TH:i:s\Z');

                    $update->addDocument($doc);
                    $bar->advance();
                }
                $update->addCommit();
                $this->client->update($update);
            });

        $bar->finish();
        $this->newLine();
    }
}
