<?php

namespace App\Services\Arango;

use App\Models\Chapter;
use App\Models\ResourceType;
use App\Models\SimilarAyah;
use App\Models\Tafsir;
use App\Models\Topic;
use App\Models\Translation;
use App\Models\UserChapterResource;
use App\Models\UserVerseResource;
use App\Models\Verse;
use App\Models\VerseLemma;
use App\Models\VerseRoot;
use App\Models\VerseStem;

class QuranGraphIndexer
{
    protected $progressCallback;

    protected array $docBatches = [];

    protected array $edgeBatches = [];

    protected int $batchSize = 500;

    public function __construct(protected ArangoClient $client) {}

    public function setProgressCallback(callable $callback): void
    {
        $this->progressCallback = $callback;
    }

    protected function log(string $message): void
    {
        if ($this->progressCallback) {
            ($this->progressCallback)($message);
        }
    }

    protected function queueDoc(string $collection, string $key, array $document): void
    {
        $this->docBatches[$collection][] = array_merge($document, ['_key' => $key]);

        if (count($this->docBatches[$collection]) >= $this->batchSize) {
            $this->flushDocs($collection);
        }
    }

    protected function queueEdge(string $collection, string $from, string $to, array $attributes = []): void
    {
        $this->edgeBatches[$collection][] = array_merge($attributes, [
            '_key' => md5("{$from}__{$to}"),
            '_from' => $from,
            '_to' => $to,
        ]);

        if (count($this->edgeBatches[$collection]) >= $this->batchSize) {
            $this->flushEdges($collection);
        }
    }

    protected function flushDocs(string $collection): void
    {
        if (empty($this->docBatches[$collection])) {
            return;
        }

        $this->client->upsertDocumentsBatch($collection, $this->docBatches[$collection]);
        $this->docBatches[$collection] = [];
    }

    protected function flushEdges(string $collection): void
    {
        if (empty($this->edgeBatches[$collection])) {
            return;
        }

        $this->client->upsertDocumentsBatch($collection, $this->edgeBatches[$collection]);
        $this->edgeBatches[$collection] = [];
    }

    protected function flushAll(): void
    {
        foreach (array_keys($this->docBatches) as $collection) {
            $this->flushDocs($collection);
        }
        foreach (array_keys($this->edgeBatches) as $collection) {
            $this->flushEdges($collection);
        }
    }

    public static function chapterKey(int $chapterNumber): string
    {
        return "chapter_{$chapterNumber}";
    }

    public static function verseKey(int $chapterNumber, int $verseNumber): string
    {
        return "verse_{$chapterNumber}_{$verseNumber}";
    }

    public static function topicKey(int $topicId): string
    {
        return "topic_{$topicId}";
    }

    public static function resourceUvrKey(int $id): string
    {
        return "resource_uvr_{$id}";
    }

    public static function resourceUcrKey(int $id): string
    {
        return "resource_ucr_{$id}";
    }

    public static function resourceTypeKey(int $id): string
    {
        return "resource_type_{$id}";
    }

    public static function tafsirKey(int $id, int $chapterId, int $verseNumber): string
    {
        return "tafsir_{$id}_{$chapterId}_{$verseNumber}";
    }

    public static function translationKey(int $id, int $chapterId, int $verseNumber): string
    {
        return "translation_{$id}_{$chapterId}_{$verseNumber}";
    }

    public static function rootKey(int $id): string
    {
        return "root_{$id}";
    }

    public static function lemmaKey(int $id): string
    {
        return "lemma_{$id}";
    }

    public static function stemKey(int $id): string
    {
        return "stem_{$id}";
    }

    public function indexAll(): void
    {
        $this->log('Indexing resource types...');
        $this->indexResourceTypes();
        $this->flushAll();

        $this->log('Indexing chapters...');
        $this->indexChapters();
        $this->flushAll();

        $this->log('Indexing verses...');
        $this->indexVerses();
        $this->flushAll();

        $this->log('Indexing topics...');
        $this->indexTopics();
        $this->flushAll();

        $this->log('Indexing resources...');
        $this->indexResources();
        $this->flushAll();

        // Note: tafsirs and translations are very large datasets.
        // Uncomment the lines below if you need them in the graph.
        // $this->log('Indexing tafsirs...');
        // $this->indexTafsirs();
        // $this->flushAll();

        // $this->log('Indexing translations...');
        // $this->indexTranslations();
        // $this->flushAll();

        $this->log('Indexing roots, lemmas and stems...');
        $this->indexRootsLemmasStems();
        $this->flushAll();

        $this->log('Indexing similar ayahs...');
        $this->indexSimilarAyahs();
        $this->flushAll();

        $this->log('Indexing topic relations...');
        $this->indexTopicRelations();
        $this->flushAll();

        $this->log('Indexing verse adjacencies...');
        $this->indexVerseAdjacencies();
        $this->flushAll();
    }

    public function indexChapter(int $chapterId): void
    {
        $chapter = Chapter::with('verses')->find($chapterId);

        if (! $chapter) {
            return;
        }

        $this->indexChapterDocument($chapter);

        foreach ($chapter->verses as $verse) {
            $this->indexVerseDocument($verse);
            $this->indexChapterHasVerse($verse);
            $this->indexVerseAdjacency($verse);
            $this->indexVerseTopics($verse);
            $this->indexVerseResources($verse);
            $this->indexVerseTafsirs($verse);
            $this->indexVerseTranslations($verse);
            $this->indexVerseMorphology($verse);
        }

        $this->indexChapterResources($chapter);
        $this->flushAll();
    }

    public function indexVerse(int $verseId): void
    {
        $verse = Verse::with(['chapter', 'translations.resourceContent', 'tafsirs.resourceContent', 'verseRoot', 'verseLemma', 'verseStem'])
            ->find($verseId);

        if (! $verse) {
            return;
        }

        $this->indexChapterDocument($verse->chapter);
        $this->indexVerseDocument($verse);
        $this->indexChapterHasVerse($verse);
        $this->indexVerseAdjacency($verse);
        $this->indexVerseTopics($verse);
        $this->indexVerseResources($verse);
        $this->indexVerseTafsirs($verse);
        $this->indexVerseTranslations($verse);
        $this->indexVerseMorphology($verse);
        $this->indexSimilarAyahsForVerse($verse);
        $this->flushAll();
    }

    protected function indexChapterDocument(Chapter $chapter): void
    {
        $this->queueDoc('chapters', self::chapterKey($chapter->chapter_number), [
            'chapter_number' => $chapter->chapter_number,
            'name_simple' => $chapter->name_simple,
            'name_complex' => $chapter->name_complex,
            'name_arabic' => $chapter->name_arabic,
            'name_roman' => $chapter->name_roman ?? null,
            'verses_count' => $chapter->verses_count,
            'revelation_place' => $chapter->revelation_place,
            'revelation_order' => $chapter->revelation_order,
        ]);
    }

    protected function indexVerseDocument(Verse $verse): void
    {
        $this->queueDoc('verses', self::verseKey($verse->chapter->chapter_number, $verse->verse_number), [
            'verse_key' => $verse->verse_key,
            'chapter_id' => $verse->chapter_id,
            'chapter_number' => $verse->chapter->chapter_number,
            'verse_number' => $verse->verse_number,
            'verse_index' => $verse->verse_index,
            'text_uthmani' => $verse->text_uthmani,
            'text_imlaei_simple' => $verse->text_imlaei_simple,
            'juz_number' => $verse->juz_number,
            'page_number' => $verse->page_number,
        ]);
    }

    protected function indexResourceTypes(): void
    {
        ResourceType::chunk(100, function ($types) {
            foreach ($types as $type) {
                $this->queueDoc('resource_types', self::resourceTypeKey($type->id), [
                    'name' => $type->name,
                    'description' => $type->description ?? null,
                ]);
            }
        });
    }

    protected function indexChapters(): void
    {
        Chapter::chunk(50, function ($chapters) {
            foreach ($chapters as $chapter) {
                $this->indexChapterDocument($chapter);
            }
        });
    }

    protected function indexVerses(): void
    {
        Verse::with('chapter')->chunk(200, function ($verses) {
            foreach ($verses as $verse) {
                $this->indexVerseDocument($verse);
                $this->indexChapterHasVerse($verse);
            }
        });
    }

    protected function indexChapterHasVerse(Verse $verse): void
    {
        $from = 'chapters/'.self::chapterKey($verse->chapter->chapter_number);
        $to = 'verses/'.self::verseKey($verse->chapter->chapter_number, $verse->verse_number);

        $this->queueEdge('chapter_has_verse', $from, $to);
    }

    protected function indexVerseAdjacencies(): void
    {
        Verse::with('chapter')->chunk(200, function ($verses) {
            foreach ($verses as $verse) {
                $this->indexVerseAdjacency($verse);
            }
        });
    }

    protected function indexVerseAdjacency(Verse $verse): void
    {
        $chapterNumber = $verse->chapter->chapter_number;
        $verseNumber = $verse->verse_number;

        $nextVerse = Verse::where('chapter_id', $verse->chapter_id)
            ->where('verse_number', '>', $verseNumber)
            ->orderBy('verse_number')
            ->first();

        if ($nextVerse) {
            $from = 'verses/'.self::verseKey($chapterNumber, $verseNumber);
            $to = 'verses/'.self::verseKey($chapterNumber, $nextVerse->verse_number);
            $this->queueEdge('verse_next', $from, $to);
        }
    }

    protected function indexTopics(): void
    {
        Topic::chunk(100, function ($topics) {
            foreach ($topics as $topic) {
                $this->queueDoc('topics', self::topicKey($topic->topic_id), [
                    'name' => $topic->name,
                    'arabic_name' => $topic->arabic_name ?? null,
                    'description' => $topic->description ?? null,
                    'wiki_link' => $topic->wiki_link ?? null,
                    'thematic' => $topic->thematic,
                    'ontology' => $topic->ontology,
                ]);
            }
        });
    }

    protected function indexTopicRelations(): void
    {
        Topic::chunk(100, function ($topics) {
            foreach ($topics as $topic) {
                $parentIds = array_filter([
                    $topic->parent_id,
                    $topic->thematic_parent_id,
                    $topic->ontology_parent_id,
                ]);

                foreach ($parentIds as $parentId) {
                    $from = 'topics/'.self::topicKey($topic->topic_id);
                    $to = 'topics/'.self::topicKey($parentId);
                    $this->queueEdge('topic_parent_of', $from, $to);
                }

                $relatedIds = $topic->getRelatedTopicIds();
                foreach ($relatedIds as $relatedId) {
                    $from = 'topics/'.self::topicKey($topic->topic_id);
                    $to = 'topics/'.self::topicKey($relatedId);
                    $this->queueEdge('topic_related_to', $from, $to);
                }

                $verseKeys = $topic->getVerseKeys();
                foreach ($verseKeys as $verseKey) {
                    $parts = explode(':', $verseKey);
                    if (count($parts) === 2) {
                        $chapterNumber = (int) $parts[0];
                        $verseNumber = (int) $parts[1];
                        $from = 'verses/'.self::verseKey($chapterNumber, $verseNumber);
                        $to = 'topics/'.self::topicKey($topic->topic_id);
                        $this->queueEdge('verse_has_topic', $from, $to);
                    }
                }
            }
        });
    }

    protected function indexVerseTopics(Verse $verse): void
    {
        $topics = Topic::forVerse($verse->verse_key)->get();

        foreach ($topics as $topic) {
            $from = 'verses/'.self::verseKey($verse->chapter->chapter_number, $verse->verse_number);
            $to = 'topics/'.self::topicKey($topic->topic_id);
            $this->queueEdge('verse_has_topic', $from, $to);
        }
    }

    protected function indexResources(): void
    {
        UserVerseResource::with(['verse.chapter', 'resourceType'])
            ->where('status', 'approved')
            ->chunk(200, function ($resources) {
                foreach ($resources as $resource) {
                    $this->indexUserVerseResource($resource);
                }
            });

        UserChapterResource::with(['chapter', 'resourceType'])
            ->where('status', 'approved')
            ->chunk(200, function ($resources) {
                foreach ($resources as $resource) {
                    $this->indexUserChapterResource($resource);
                }
            });
    }

    protected function indexUserVerseResource(UserVerseResource $resource): void
    {
        $key = self::resourceUvrKey($resource->id);
        $chapterNumber = $resource->verse?->chapter?->chapter_number;
        $verseNumber = $resource->verse?->verse_number;

        $this->queueDoc('resources', $key, [
            'resource_type' => 'user_verse_resource',
            'title' => $resource->resource_title,
            'url' => $resource->resource_url,
            'thumbnail_url' => $resource->thumbnail_url ?? null,
            'comment' => $resource->comment ?? null,
            'type_name' => $resource->resourceType?->name ?? null,
            'verse_id' => $resource->verse_id,
            'chapter_number' => $chapterNumber,
            'verse_number' => $verseNumber,
        ]);

        if ($chapterNumber && $verseNumber) {
            $from = 'verses/'.self::verseKey($chapterNumber, $verseNumber);
            $to = 'resources/'.$key;
            $this->queueEdge('verse_has_resource', $from, $to);
        }
    }

    protected function indexUserChapterResource(UserChapterResource $resource): void
    {
        $key = self::resourceUcrKey($resource->id);
        $chapterNumber = $resource->chapter?->chapter_number;

        $this->queueDoc('resources', $key, [
            'resource_type' => 'user_chapter_resource',
            'title' => $resource->resource_title,
            'url' => $resource->resource_url,
            'thumbnail_url' => $resource->thumbnail_url ?? null,
            'comment' => $resource->comment ?? null,
            'type_name' => $resource->resourceType?->name ?? null,
            'chapter_id' => $resource->chapter_id,
            'chapter_number' => $chapterNumber,
        ]);

        if ($chapterNumber) {
            $from = 'chapters/'.self::chapterKey($chapterNumber);
            $to = 'resources/'.$key;
            $this->queueEdge('chapter_has_resource', $from, $to);
        }
    }

    protected function indexVerseResources(Verse $verse): void
    {
        UserVerseResource::with('resourceType')
            ->where('verse_id', $verse->id)
            ->where('status', 'approved')
            ->chunk(100, function ($resources) {
                foreach ($resources as $resource) {
                    $this->indexUserVerseResource($resource);
                }
            });
    }

    protected function indexChapterResources(Chapter $chapter): void
    {
        UserChapterResource::with('resourceType')
            ->where('chapter_id', $chapter->id)
            ->where('status', 'approved')
            ->chunk(100, function ($resources) {
                foreach ($resources as $resource) {
                    $this->indexUserChapterResource($resource);
                }
            });
    }

    protected function indexTafsirs(): void
    {
        Tafsir::chunk(200, function ($tafsirs) {
            foreach ($tafsirs as $tafsir) {
                $this->indexTafsirDocument($tafsir);
            }
        });
    }

    protected function indexTafsirDocument(Tafsir $tafsir): void
    {
        $ayahKey = $tafsir->ayah_key;
        $parts = is_string($ayahKey) ? explode(':', $ayahKey) : [];
        $chapterNumber = isset($parts[0]) ? (int) $parts[0] : null;
        $verseNumber = isset($parts[1]) ? (int) $parts[1] : null;

        $key = self::tafsirKey($tafsir->tafsir_id, $chapterNumber ?? 0, $verseNumber ?? 0);

        $this->queueDoc('tafsirs', $key, [
            'text' => $tafsir->text ? strip_tags($tafsir->text) : null,
            'verse_key' => $ayahKey,
            'group_ayah_key' => $tafsir->group_ayah_key ?? null,
            'from_ayah' => $tafsir->from_ayah ?? null,
            'to_ayah' => $tafsir->to_ayah ?? null,
        ]);

        if ($chapterNumber && $verseNumber) {
            $from = 'verses/'.self::verseKey($chapterNumber, $verseNumber);
            $to = 'tafsirs/'.$key;
            $this->queueEdge('verse_has_tafsir', $from, $to);
        }
    }

    protected function indexVerseTafsirs(Verse $verse): void
    {
        $verseKey = $verse->verse_key;

        Tafsir::where('ayah_key', $verseKey)
            ->chunk(100, function ($tafsirs) {
                foreach ($tafsirs as $tafsir) {
                    $this->indexTafsirDocument($tafsir);
                }
            });
    }

    protected function indexTranslations(): void
    {
        Translation::with(['verse.chapter', 'resourceContent'])
            ->chunk(500, function ($translations) {
                foreach ($translations as $translation) {
                    $this->indexTranslationDocument($translation);
                }
            });
    }

    protected function indexTranslationDocument(Translation $translation): void
    {
        $chapterNumber = $translation->verse?->chapter?->chapter_number ?? $translation->chapter_id;
        $verseNumber = $translation->verse_number;

        $key = self::translationKey($translation->id, $translation->chapter_id, $translation->verse_number);

        $this->queueDoc('translations', $key, [
            'text' => strip_tags($translation->text),
            'resource_name' => $translation->resource_name,
            'language_name' => $translation->language_name,
            'verse_key' => $translation->verse_key,
            'chapter_id' => $translation->chapter_id,
            'verse_number' => $translation->verse_number,
            'priority' => $translation->priority,
        ]);

        if ($chapterNumber && $verseNumber) {
            $from = 'verses/'.self::verseKey((int) $chapterNumber, (int) $verseNumber);
            $to = 'translations/'.$key;
            $this->queueEdge('verse_has_translation', $from, $to);
        }
    }

    protected function indexVerseTranslations(Verse $verse): void
    {
        Translation::where('verse_id', $verse->id)
            ->chunk(100, function ($translations) {
                foreach ($translations as $translation) {
                    $this->indexTranslationDocument($translation);
                }
            });
    }

    protected function indexRootsLemmasStems(): void
    {
        VerseRoot::chunk(200, function ($roots) {
            foreach ($roots as $root) {
                $this->queueDoc('roots', self::rootKey($root->id), [
                    'value' => $root->value,
                ]);
            }
        });

        VerseLemma::chunk(200, function ($lemmas) {
            foreach ($lemmas as $lemma) {
                $this->queueDoc('lemmas', self::lemmaKey($lemma->id), [
                    'text_madani' => $lemma->text_madani,
                    'text_clean' => $lemma->text_clean,
                ]);
            }
        });

        VerseStem::chunk(200, function ($stems) {
            foreach ($stems as $stem) {
                $this->queueDoc('stems', self::stemKey($stem->id), [
                    'text_madani' => $stem->text_madani,
                    'text_clean' => $stem->text_clean,
                ]);
            }
        });

        Verse::with(['chapter', 'verseRoot', 'verseLemma', 'verseStem'])
            ->chunk(200, function ($verses) {
                foreach ($verses as $verse) {
                    $this->indexVerseMorphology($verse);
                }
            });
    }

    protected function indexVerseMorphology(Verse $verse): void
    {
        $verseKey = self::verseKey($verse->chapter->chapter_number, $verse->verse_number);

        if ($verse->verse_root_id && $verse->verseRoot) {
            $from = 'verses/'.$verseKey;
            $to = 'roots/'.self::rootKey($verse->verseRoot->id);
            $this->queueEdge('verse_has_root', $from, $to);
        }

        if ($verse->verse_lemma_id && $verse->verseLemma) {
            $from = 'verses/'.$verseKey;
            $to = 'lemmas/'.self::lemmaKey($verse->verseLemma->id);
            $this->queueEdge('verse_has_lemma', $from, $to);
        }

        if ($verse->verse_stem_id && $verse->verseStem) {
            $from = 'verses/'.$verseKey;
            $to = 'stems/'.self::stemKey($verse->verseStem->id);
            $this->queueEdge('verse_has_stem', $from, $to);
        }
    }

    protected function indexSimilarAyahs(): void
    {
        SimilarAyah::with(['matchedVerse.chapter'])
            ->orderBy('verse_key')
            ->chunk(500, function ($similarAyahs) {
                foreach ($similarAyahs as $similar) {
                    $this->indexSimilarAyah($similar);
                }
            });
    }

    protected function indexSimilarAyahsForVerse(Verse $verse): void
    {
        SimilarAyah::with(['matchedVerse.chapter'])
            ->where('verse_key', $verse->verse_key)
            ->orderBy('verse_key')
            ->chunk(100, function ($similarAyahs) {
                foreach ($similarAyahs as $similar) {
                    $this->indexSimilarAyah($similar);
                }
            });
    }

    protected function indexSimilarAyah(SimilarAyah $similar): void
    {
        $parts = explode(':', $similar->verse_key);
        if (count($parts) !== 2) {
            return;
        }

        $fromChapter = (int) $parts[0];
        $fromVerse = (int) $parts[1];

        $matchedVerse = $similar->matchedVerse;
        if (! $matchedVerse) {
            return;
        }

        $toChapter = $matchedVerse->chapter->chapter_number;
        $toVerse = $matchedVerse->verse_number;

        $from = 'verses/'.self::verseKey($fromChapter, $fromVerse);
        $to = 'verses/'.self::verseKey($toChapter, $toVerse);

        $this->queueEdge('verse_similar_to', $from, $to, [
            'score' => $similar->score,
            'coverage' => $similar->coverage,
            'matched_words_count' => $similar->matched_words_count,
        ]);
    }
}
