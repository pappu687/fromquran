<?php

namespace App\Services\Solr;

use App\Models\Verse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Solarium\Client;

class VerseIndexer
{
    public function __construct(private readonly Client $client) {}

    public function reindexAll(): void
    {
        $this->deleteAllVerseDocuments();
        $this->indexQuery(Verse::query()->with($this->relations())->orderBy('id'));
    }

    public function reindexVerse(int $verseId): void
    {
        $this->reindexByQuery(
            Verse::query()->with($this->relations())->whereKey($verseId)
        );
    }

    public function reindexChapter(int $chapterId): void
    {
        $this->reindexByQuery(
            Verse::query()
                ->with($this->relations())
                ->where('chapter_id', $chapterId)
                ->orderBy('id')
        );
    }

    public function reindexVerses(array $verseIds): void
    {
        $verseIds = array_values(array_unique(array_map('intval', $verseIds)));

        if ($verseIds === []) {
            return;
        }

        $this->reindexByQuery(
            Verse::query()
                ->with($this->relations())
                ->whereIn('id', $verseIds)
                ->orderBy('id')
        );
    }

    private function reindexByQuery(Builder $query): void
    {
        $verses = (clone $query)->get();

        if ($verses->isEmpty()) {
            return;
        }

        $this->deleteVerseDocumentsByKeys($verses->pluck('verse_key')->all());
        $this->indexQuery(
            Verse::query()
                ->with($this->relations())
                ->whereIn('id', $verses->pluck('id')->all())
                ->orderBy('id')
        );
    }

    private function indexQuery(Builder $query): void
    {
        $query->chunk(200, function ($verses): void {
            $update = $this->client->createUpdate();
            $resourceCounts = $this->resourceCountsForVerseIds($verses->pluck('id')->all());

            foreach ($verses as $verse) {
                $doc = $update->createDocument();

                $doc->id = $verse->verse_key;
                $doc->chapter_id_i = (int) $verse->chapter_id;
                $doc->verse_number_i = (int) $verse->verse_number;
                $doc->verse_index_i = (int) $verse->verse_index;
                $doc->verse_key_s = $verse->verse_key;
                $doc->text_uthmani_t = $verse->text_uthmani;
                $doc->text_uthmani_tajweed_t = $verse->text_uthmani_tajweed ?? null;
                $doc->juz_number_i = (int) $verse->juz_number;
                $doc->page_number_i = (int) $verse->page_number;
                $doc->ruku_number_i = (int) $verse->ruku_number;
                $doc->surah_ruku_number_i = (int) $verse->surah_ruku_number;
                $doc->num_resource_i = (int) ($resourceCounts[$verse->id] ?? 0);

                foreach ($verse->translations as $translation) {
                    if (
                        ! $translation->resource_content_id ||
                        ! trim((string) $translation->text)
                    ) {
                        continue;
                    }

                    $fieldName = 'translation_'.$translation->resource_content_id.'_t';
                    $doc->$fieldName = $translation->text;
                }

                $update->addDocument($doc);
            }

            $update->addCommit();
            $this->client->update($update);
        });
    }

    private function deleteAllVerseDocuments(): void
    {
        $update = $this->client->createUpdate();
        $update->addDeleteQuery('-document_type_s:[* TO *] AND -type_s:[* TO *]');
        $update->addCommit();
        $this->client->update($update);
    }

    private function deleteVerseDocumentsByKeys(array $verseKeys): void
    {
        if ($verseKeys === []) {
            return;
        }

        $update = $this->client->createUpdate();

        foreach ($verseKeys as $verseKey) {
            $update->addDeleteById((string) $verseKey);
        }

        $update->addCommit();
        $this->client->update($update);
    }

    private function resourceCountsForVerseIds(array $verseIds)
    {
        $query = DB::table('user_verse_resources')
            ->select('verse_id', DB::raw('COUNT(*) as resource_count'))
            ->whereIn('verse_id', $verseIds)
            ->where('status', 'approved');

        if (Schema::hasColumn('user_verse_resources', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        return $query
            ->groupBy('verse_id')
            ->pluck('resource_count', 'verse_id');
    }

    private function relations(): array
    {
        return [
            'translations' => fn ($query) => $query->orderBy('priority', 'desc'),
        ];
    }
}
