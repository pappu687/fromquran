<?php

namespace App\Services\Solr;

use App\Models\Translation;
use App\Models\UserChapterResource;
use App\Models\UserVerseResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;
use Solarium\Client;

class ResourceIndexer
{
    public function __construct(private readonly Client $client) {}

    public function reindexAll(): void
    {
        $this->deleteAllResourceDocuments();
        $this->indexUserVerseResourcesQuery($this->approvedVerseResourcesQuery());
        $this->indexUserChapterResourcesQuery($this->approvedChapterResourcesQuery());
        $this->indexTranslationsQuery(Translation::query()->with($this->translationRelations())->orderBy('id'));
    }

    public function reindexVerse(int $verseId): void
    {
        $this->deleteDocumentsForVerse($verseId);
        $this->indexUserVerseResourcesQuery(
            $this->approvedVerseResourcesQuery()->where('verse_id', $verseId)
        );
        $this->indexTranslationsQuery(
            Translation::query()
                ->with($this->translationRelations())
                ->where('verse_id', $verseId)
                ->orderBy('id')
        );
    }

    public function reindexChapter(int $chapterId): void
    {
        $this->deleteDocumentsForChapter($chapterId);
        $this->indexUserVerseResourcesQuery(
            $this->approvedVerseResourcesQuery()
                ->whereHas('verse', fn ($query) => $query->where('chapter_id', $chapterId))
        );
        $this->indexUserChapterResourcesQuery(
            $this->approvedChapterResourcesQuery()->where('chapter_id', $chapterId)
        );
        $this->indexTranslationsQuery(
            Translation::query()
                ->with($this->translationRelations())
                ->where('chapter_id', $chapterId)
                ->orderBy('id')
        );
    }

    public function indexVerseResource(UserVerseResource $resource): void
    {
        $resource->loadMissing(['user:id,name', 'resourceType:id,name', 'verse:id,chapter_id,verse_number', 'verse.chapter:id,chapter_number']);

        $this->deleteDocumentById($this->verseResourceDocumentId($resource->id));

        if ($resource->status !== 'approved') {
            return;
        }

        $update = $this->client->createUpdate();
        $update->addDocument($this->makeVerseResourceDocument($update, $resource));
        $update->addCommit();
        $this->client->update($update);
    }

    public function indexChapterResource(UserChapterResource $resource): void
    {
        $resource->loadMissing(['user:id,name', 'resourceType:id,name', 'chapter:id,chapter_number']);

        $this->deleteDocumentById($this->chapterResourceDocumentId($resource->id));

        if ($this->chapterResourceStatus($resource) !== 'approved') {
            return;
        }

        $update = $this->client->createUpdate();
        $update->addDocument($this->makeChapterResourceDocument($update, $resource));
        $update->addCommit();
        $this->client->update($update);
    }

    private function indexUserVerseResourcesQuery(Builder $query): void
    {
        $query->with(['user:id,name', 'resourceType:id,name', 'verse:id,chapter_id,verse_number', 'verse.chapter:id,chapter_number'])
            ->orderBy('id')
            ->chunk(200, function ($resources): void {
                $update = $this->client->createUpdate();

                foreach ($resources as $resource) {
                    $update->addDocument($this->makeVerseResourceDocument($update, $resource));
                }

                if ($resources->isEmpty()) {
                    return;
                }

                $update->addCommit();
                $this->client->update($update);
            });
    }

    private function indexUserChapterResourcesQuery(Builder $query): void
    {
        $query->with(['user:id,name', 'resourceType:id,name', 'chapter:id,chapter_number'])
            ->orderBy('id')
            ->chunk(200, function ($resources): void {
                $update = $this->client->createUpdate();

                foreach ($resources as $resource) {
                    $update->addDocument($this->makeChapterResourceDocument($update, $resource));
                }

                if ($resources->isEmpty()) {
                    return;
                }

                $update->addCommit();
                $this->client->update($update);
            });
    }

    private function indexTranslationsQuery(Builder $query): void
    {
        $query->chunk(200, function ($translations): void {
            $update = $this->client->createUpdate();

            foreach ($translations as $translation) {
                $doc = $update->createDocument();
                $doc->id = $this->translationDocumentId($translation->id);
                $doc->document_type_t = 'translation';
                $doc->document_type_s = 'translation';
                $doc->type_s = 'translation';
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
            }

            if ($translations->isEmpty()) {
                return;
            }

            $update->addCommit();
            $this->client->update($update);
        });
    }

    private function deleteAllResourceDocuments(): void
    {
        $update = $this->client->createUpdate();
        $update->addDeleteQuery('document_type_s:user_verse_resource OR document_type_s:user_chapter_resource OR document_type_s:translation');
        $update->addCommit();
        $this->client->update($update);
    }

    private function deleteDocumentsForVerse(int $verseId): void
    {
        $update = $this->client->createUpdate();
        $update->addDeleteQuery("((document_type_s:user_verse_resource OR document_type_s:translation) AND verse_id_i:{$verseId})");
        $update->addCommit();
        $this->client->update($update);
    }

    private function deleteDocumentsForChapter(int $chapterId): void
    {
        $update = $this->client->createUpdate();
        $update->addDeleteQuery("((document_type_s:user_verse_resource OR document_type_s:user_chapter_resource OR document_type_s:translation) AND chapter_id_i:{$chapterId})");
        $update->addCommit();
        $this->client->update($update);
    }

    private function deleteDocumentById(string $documentId): void
    {
        $update = $this->client->createUpdate();
        $update->addDeleteById($documentId);
        $update->addCommit();
        $this->client->update($update);
    }

    private function approvedVerseResourcesQuery(): Builder
    {
        return UserVerseResource::approved();
    }

    private function approvedChapterResourcesQuery(): Builder
    {
        $query = UserChapterResource::query();

        if (Schema::hasColumn('user_chapter_resources', 'status')) {
            $query->where('status', 'approved');
        }

        return $query;
    }

    private function translationRelations(): array
    {
        return ['verse:id,chapter_id,verse_number', 'verse.chapter:id,chapter_number'];
    }

    private function makeVerseResourceDocument($update, UserVerseResource $resource)
    {
        $doc = $update->createDocument();
        $doc->id = $this->verseResourceDocumentId($resource->id);
        $doc->document_type_t = 'user_verse_resource';
        $doc->document_type_s = 'user_verse_resource';
        $doc->type_s = 'user_verse_resource';
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

        return $doc;
    }

    private function makeChapterResourceDocument($update, UserChapterResource $resource)
    {
        $doc = $update->createDocument();
        $doc->id = $this->chapterResourceDocumentId($resource->id);
        $doc->document_type_t = 'user_chapter_resource';
        $doc->document_type_s = 'user_chapter_resource';
        $doc->type_s = 'user_chapter_resource';
        $doc->chapter_id_i = (int) $resource->chapter_id;
        $doc->chapter_number_i = (int) $resource->chapter?->chapter_number;
        $doc->title_t = $resource->resource_title;
        $doc->description_t = $resource->comment;
        $doc->resource_url_s = $resource->resource_url;
        $doc->thumbnail_url_s = $resource->thumbnail_url;
        $doc->status_s = $this->chapterResourceStatus($resource);
        $doc->user_name_s = $resource->user?->name;
        $doc->resource_type_name_s = $resource->resourceType?->name;
        $doc->created_at_dt = $resource->created_at?->format('Y-m-d\TH:i:s\Z');

        return $doc;
    }

    private function verseResourceDocumentId(int $resourceId): string
    {
        return 'uvr_'.$resourceId;
    }

    private function chapterResourceDocumentId(int $resourceId): string
    {
        return 'ucr_'.$resourceId;
    }

    private function translationDocumentId(int $translationId): string
    {
        return 'trans_'.$translationId;
    }

    private function chapterResourceStatus(UserChapterResource $resource): string
    {
        return (string) ($resource->status ?? 'approved');
    }
}
