<?php
namespace App\Services;

use App\Models\ResourceContent;
use App\Models\Chapter;
use App\Models\TafseerBook;
use App\Models\Translation;
use App\Models\Verse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Solarium\Client;

class QuranDatabaseService {
    private const CACHE_SCHEMA_VERSION = 'v3';
    private int $cacheTtl;
    private Client $solrClient;

    public function __construct( Client $solrClient ) {
        $this->cacheTtl   = config( 'quran.cache_ttl', 3600 ); // 1 hour default
        $this->solrClient = $solrClient;
    }

    /**
     * Get all chapters (surahs) from database
     */
    public function getChapters(): array {
        return Cache::remember( 'quran.db.chapters', $this->cacheTtl, function () {
            // Fetch chapters with their first verse's juz_number
            return Chapter::orderBy( 'chapter_number' )
                ->get()
                ->map( function ( $chapter ) {
                // Optimized: Get the juz_number of the first verse
                $firstVerse = $chapter->firstVerse()->select('juz_number')->first();

                return array(
                        'id'                     => $chapter->id,
                        'number'                 => $chapter->chapter_number,
                        'name'                   => $chapter->name_arabic,
                        'englishName'            => $chapter->name_simple,
                        'romanName'              => $chapter->name_roman,
                        'englishNameTranslation' => $chapter->name_simple,
                        'revelationType'         => ucfirst( $chapter->revelation_place ),
                        'verses'                 => $chapter->verses_count,
                    'startJuz'               => $firstVerse ? $firstVerse->juz_number : null,
                     );
                } )
                ->toArray();
        } );
    }

    /**
     * Get info for a specific chapter
     */
    public function getChapterInfo( int $chapterNumber ): ?array {
        return Cache::remember( "quran.db.chapter_info.{$chapterNumber}", $this->cacheTtl, function () use ( $chapterNumber ) {
            $info = \App\Models\ChapterInfo::where( 'surah_number', $chapterNumber )->first();
            $chapter = \App\Models\Chapter::find($chapterNumber);

            if ( ! $info ) {
                return null;
            }

            return array(
                'surah_number' => $info->surah_number,
                'surah_name'   => $chapter ? $chapter->name_roman : $info->surah_name,
                'text'         => $info->text,
                'short_text'   => $info->short_text,
             );
        } );
    }

    /**
     * Get verses for a specific chapter from database
     */
    public function getVerses( int $chapterId, int $page = 1, int $limit = 10, string $edition = 'en.sahih', array $translationIds = [] ): array {
        // We use a broader cache key here because we fetch all verses of the chapter at once
        $cacheKey = "q." . self::CACHE_SCHEMA_VERSION . ".verses.{$chapterId}.all.{$edition}." . implode(',', $translationIds);

        return Cache::remember( $cacheKey, $this->cacheTtl, function () use ( $chapterId, $edition, $translationIds ) {
            $chapter = Chapter::where( 'id', $chapterId )
                ->orWhere( 'chapter_number', $chapterId )
                ->first();

            if ( ! $chapter ) {
                return array(  );
            }

            $availableTranslationIds = $this->getAvailableTranslationResourceIds();
            $translationResources = $this->resolveVerseTranslationResources(
                $translationIds,
                $edition,
                $availableTranslationIds,
            );

            if (!empty($translationIds)) {
                $translationResources = $translationResources->sortBy(function (
                    ResourceContent $resource,
                ) use ($translationIds) {
                    $position = array_search($resource->id, $translationIds, true);

                    return $position === false ? PHP_INT_MAX : $position;
                });
            }

            // Query Solr for all verses in this chapter
            $select = $this->solrClient->createSelect();
            // Filter to only get verse documents (no document_type_s or type_s)
            $select->setQuery('verse_key_s:[* TO *] AND -document_type_s:[* TO *] AND -type_s:[* TO *]');
            $select->createFilterQuery( 'chapter' )
                ->setQuery( 'chapter_id_i:' . $chapter->id );
            $select->addSort( 'verse_number_i', $select::SORT_ASC );
            $select->setStart( 0 )->setRows( 500 ); // enough for any chapter

            $resultSet = $this->solrClient->select( $select );

            if ( $resultSet->getNumFound() === 0 ) {
                return array(  );
            }

            // Collect verse_keys from Solr and load DB metadata
            $verseKeys = array(  );

            foreach ( $resultSet as $doc ) {
                if ( isset( $doc[ 'verse_key_s' ] ) ) {
                    $verseKeys[  ] = $doc[ 'verse_key_s' ];
                }
            }

            $verseMeta = Verse::whereIn( 'verses.verse_key', $verseKeys )
                ->select(
                    'verses.id',
                    'verses.chapter_id',
                    'verses.verse_number',
                    'verses.verse_key',
                    'verses.juz_number',
                    'verses.rub_el_hizb_number',
                    'verses.page_number'
                )
                ->orderBy( 'verses.verse_number' )
                ->get()
                ->keyBy( 'verse_key' );

            return $this->formatSolrVerses(
                $resultSet,
                $verseMeta,
                $translationResources,
                $chapter->id,
            );
        } );
    }

    /**
     * Get specific verses by verse keys from Solr.
     */
    public function getVersesByKeys(
        array $verseKeys,
        string $edition = 'en.sahih',
        array $translationIds = [],
    ): array {
        $verseKeys = array_values(array_unique(array_filter($verseKeys)));

        if (empty($verseKeys)) {
            return [];
        }

        $cacheKey = 'q.' . self::CACHE_SCHEMA_VERSION . '.verses.keys.' . md5(
            implode(',', $verseKeys) . '|' . $edition . '|' . implode(',', $translationIds),
        );

        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($verseKeys, $edition, $translationIds) {
            $availableTranslationIds = $this->getAvailableTranslationResourceIds();
            $translationResources = $this->resolveVerseTranslationResources(
                $translationIds,
                $edition,
                $availableTranslationIds,
            );

            $select = $this->solrClient->createSelect();
            $select->setQuery('verse_key_s:[* TO *] AND -document_type_s:[* TO *] AND -type_s:[* TO *]');

            $escapedVerseKeys = array_map(
                static fn (string $verseKey): string => '"' . addcslashes($verseKey, '"\\') . '"',
                $verseKeys,
            );

            $select->createFilterQuery('verse_keys')
                ->setQuery('verse_key_s:(' . implode(' OR ', $escapedVerseKeys) . ')');
            $select->setStart(0)->setRows(count($verseKeys));

            $resultSet = $this->solrClient->select($select);

            if ($resultSet->getNumFound() === 0) {
                return [];
            }

            $verseMeta = Verse::whereIn('verses.verse_key', $verseKeys)
                ->select(
                    'verses.id',
                    'verses.chapter_id',
                    'verses.verse_number',
                    'verses.verse_key',
                    'verses.juz_number',
                    'verses.rub_el_hizb_number',
                    'verses.page_number'
                )
                ->get()
                ->keyBy('verse_key');

            $formatted = $this->formatSolrVerses(
                $resultSet,
                $verseMeta,
                $translationResources,
            );

            $formattedByKey = collect($formatted)->keyBy(
                static fn (array $verse): string => ($verse['chapterId'] ?? '') . ':' . ($verse['verseNumber'] ?? ''),
            );

            return collect($verseKeys)
                ->map(static fn (string $verseKey) => $formattedByKey->get($verseKey))
                ->filter()
                ->values()
                ->all();
        });
    }

    /**
     * Get translations for verses (already included in getVerses)
     */
    public function getTranslations( array $verses, string $edition = 'en.sahih' ): array {
        // Translations are already included in getVerses method
        return $verses;
    }

    /**
     * Get available editions (languages/translators) from database
     */
    public function getEditions(): array {
        return Cache::remember( 'quran.db.editions', $this->cacheTtl * 24, function () {
            return ResourceContent::where( 'resource_type', 'translation' )
                ->where( 'approved', true )
                ->orderBy( 'priority' )
                ->get()
                ->map( function ( $resource ) {
                    return array(
                        'identifier'  => $resource->resource_id ?? $resource->slug,
                        'language'    => $resource->language->iso_code ?? 'en',
                        'name'        => $resource->name,
                        'englishName' => $resource->name,
                        'romanName'   => $resource->roman_name,
                        'format'      => 'text',
                        'type'        => 'translation',
                        'direction'   => $resource->language->direction ?? 'ltr',
                     );
                } )
                ->toArray();
        } );
    }

    /**
     * Get available translations list from database
     */
    public function getTranslationsList(): array {
        return Cache::remember( 'quran.' . self::CACHE_SCHEMA_VERSION . '.db.translations_list', $this->cacheTtl * 24, function () {
            $availableTranslationIds = $this->getAvailableTranslationResourceIds();

            if ( empty( $availableTranslationIds ) ) {
                return [];
            }

            return ResourceContent::where( 'resource_type', 'translation' )
                ->where( 'approved', true )
                ->whereIn( 'id', $availableTranslationIds )
                ->orderBy( 'priority' )
                ->get()
                ->map( function ( $resource ) {
                    return array(
                        'id'       => $resource->id,
                        'name'     => $resource->name,
                        'language' => $resource->language_name,
                     );
                } )
                ->toArray();
        } );
    }

    /**
     * Resolve translation resources from explicit ids or the selected edition.
     */
    private function resolveVerseTranslationResources(
        array $translationIds,
        string $edition,
        array $availableTranslationIds,
    ): Collection {
        $query = ResourceContent::query()
            ->where('resource_type', 'translation')
            ->where('approved', true)
            ->when(!empty($availableTranslationIds), function ($builder) use ($availableTranslationIds) {
                $builder->whereIn('id', $availableTranslationIds);
            });

        if (!empty($translationIds)) {
            return $query
                ->whereIn('id', $translationIds)
                ->get()
                ->keyBy('id');
        }

        if ('ar' === $edition) {
            return collect();
        }

        $resource = (clone $query)
            ->where(function ($builder) use ($edition) {
                $builder->where('resource_id', 'like', "%{$edition}%")
                    ->orWhere('slug', 'like', "%{$edition}%");
            })
            ->orderBy('priority')
            ->first();

        if (!$resource) {
            $resource = (clone $query)
                ->where('language_name', 'English')
                ->orderBy('priority')
                ->first();
        }

        if (!$resource) {
            return collect();
        }

        return collect([$resource])->keyBy('id');
    }

    /**
     * @param \Traversable<int, mixed> $resultSet
     * @param \Illuminate\Support\Collection<string, Verse> $verseMeta
     * @param \Illuminate\Support\Collection<int, ResourceContent> $translationResources
     * @return array<int, array<string, mixed>>
     */
    private function formatSolrVerses(
        \Traversable $resultSet,
        Collection $verseMeta,
        Collection $translationResources,
        ?int $fallbackChapterId = null,
    ): array {
        $verses = [];

        foreach ($resultSet as $doc) {
            $verseKey = $doc['verse_key_s'] ?? null;

            if (!$verseKey) {
                continue;
            }

            $meta = $verseMeta->get($verseKey);
            $resourceCount = isset($doc['num_resource_i'])
                ? (int) $doc['num_resource_i']
                : 0;

            $translations = [];
            foreach ($translationResources as $resource) {
                $fieldName = 'translation_' . $resource->id . '_t';
                if (isset($doc[$fieldName])) {
                    $translations[] = [
                        'resource_id' => $resource->id,
                        'resource_content_id' => $resource->id,
                        'resource_name' => $resource->name,
                        'language' => $resource->language_name,
                        'text' => $doc[$fieldName],
                    ];
                }
            }

            $verses[] = [
                'id' => $meta->id ?? null,
                'chapterId' => $meta->chapter_id ?? $fallbackChapterId ?? ($doc['chapter_id_i'] ?? null),
                'verseNumber' => $meta->verse_number ?? ($doc['verse_number_i'] ?? null),
                'text' => $doc['text_uthmani_t'] ?? null,
                'translations' => $translations,
                'juzNumber' => $meta->juz_number ?? ($doc['juz_number_i'] ?? null),
                'pageNumber' => $meta->page_number ?? ($doc['page_number_i'] ?? null),
                'hizbQuarter' => $meta->rub_el_hizb_number ?? null,
                'sajda' => false,
                'audioUrl' => null,
                'hasResources' => $resourceCount > 0,
                'resourceCount' => $resourceCount,
            ];
        }

        return $verses;
    }

    /**
     * Get Solr-backed translation resource IDs by inspecting indexed verse fields.
     */
    private function getAvailableTranslationResourceIds(): array
    {
        return Cache::remember( 'quran.' . self::CACHE_SCHEMA_VERSION . '.solr.translation_resource_ids', $this->cacheTtl * 24, function () {
            $select = $this->solrClient->createSelect();
            $select->setQuery( 'verse_key_s:[* TO *] AND -document_type_s:[* TO *] AND -type_s:[* TO *]' );
            $select->setStart( 0 )->setRows( 25 );

            $resultSet = $this->solrClient->select( $select );
            $resourceIds = [];

            foreach ( $resultSet as $doc ) {
                foreach ( $doc as $fieldName => $value ) {
                    if ( preg_match( '/^translation_(\d+)_t$/', (string) $fieldName, $matches ) ) {
                        $resourceIds[(int) $matches[1]] = true;
                    }
                }
            }

            $resourceIds = array_keys( $resourceIds );
            sort( $resourceIds );

            return $resourceIds;
        } );
    }

    /**
     * Get specific edition by identifier
     */
    public function getEdition( string $identifier ): ?array {
        $editions = $this->getEditions();
        return collect( $editions )->firstWhere( 'identifier', $identifier );
    }

    /**
     * Search Quran text using Solr
     */
    public function search( string $query, string $edition = 'en.sahih' ): array {
        $cacheKey = "quran." . self::CACHE_SCHEMA_VERSION . ".solr.search." . md5( $query . $edition );

        return Cache::remember( $cacheKey, $this->cacheTtl / 2, function () use ( $query, $edition ) {
            $availableTranslationIds = $this->getAvailableTranslationResourceIds();
            $translationResource = $this->resolveVerseTranslationResources(
                [],
                $edition,
                $availableTranslationIds,
            )->first();
            $translationResourceId = $translationResource?->id;

            $select       = $this->solrClient->createSelect();
            $escapedQuery = addcslashes( $query, '+-&|!(){}[]^"~*?:\\/' );
            $resourceQuery = sprintf(
                '((document_type_s:(user_verse_resource user_chapter_resource translation tafsir) AND description_t:%1$s) OR (type_s:tafsir AND text_t:%1$s))',
                $escapedQuery
            );

            if ( $translationResourceId ) {
                $fieldName = 'translation_' . $translationResourceId . '_t';
                $select->setQuery(
                    sprintf(
                        '((%s:%s) OR (text_uthmani_t:%s)) OR %s',
                        $fieldName,
                        $escapedQuery,
                        $escapedQuery,
                        $resourceQuery
                    )
                );
            } else {
                $select->setQuery( sprintf( '(text_uthmani_t:%s) OR %s', $escapedQuery, $resourceQuery ) );
            }

            $select->addSort( 'score', $select::SORT_DESC );
            $select->setStart( 0 )->setRows( 200 );

            $resultSet = $this->solrClient->select( $select );

            if ( $resultSet->getNumFound() === 0 ) {
                return array(  );
            }

            $verseKeys = array(  );
            $chapterIds = array(  );

            foreach ( $resultSet as $doc ) {
                if ( isset( $doc[ 'verse_key_s' ] ) ) {
                    $verseKeys[  ] = $doc[ 'verse_key_s' ];
                }

                if ( isset( $doc[ 'chapter_id_i' ] ) ) {
                    $chapterIds[  ] = (int) $doc[ 'chapter_id_i' ];
                }
            }

            $verses = Verse::whereIn( 'verse_key', $verseKeys )
                ->with( 'chapter' )
                ->get()
                ->keyBy( 'verse_key' );
            $chapters = Chapter::whereIn( 'id', array_values( array_unique( $chapterIds ) ) )
                ->get()
                ->keyBy( 'id' );

            $results = array(  );

            foreach ( $resultSet as $doc ) {
                $documentType = $doc[ 'document_type_s' ] ?? ( ( $doc[ 'type_s' ] ?? null ) === 'tafsir' ? 'tafsir' : 'verse' );
                $verseKey = $doc[ 'verse_key_s' ] ?? null;
                $chapterId = isset( $doc[ 'chapter_id_i' ] ) ? (int) $doc[ 'chapter_id_i' ] : null;
                $chapter = $chapterId ? $chapters->get( $chapterId ) : null;

                if ( $documentType !== 'verse' ) {
                    $results[  ] = array(
                        'id'                 => $doc[ 'id' ] ?? null,
                        'documentType'       => $documentType,
                        'chapterId'          => $chapterId,
                        'chapterName'        => $chapter?->name_roman,
                        'chapterNumber'      => $chapter?->chapter_number,
                        'verseNumber'        => isset( $doc[ 'verse_number_i' ] ) ? (int) $doc[ 'verse_number_i' ] : null,
                        'title'              => $doc[ 'title_t' ] ?? $doc[ 'tafsir_book_name_s' ] ?? null,
                        'description'        => $doc[ 'description_t' ] ?? $doc[ 'text_t' ] ?? null,
                        'resourceUrl'        => $doc[ 'resource_url_s' ] ?? null,
                        'resourceTypeName'   => $doc[ 'resource_type_name_s' ] ?? null,
                        'tafsirBookName'     => $doc[ 'tafsir_book_name_s' ] ?? null,
                        'tafsirBookSlug'     => $doc[ 'tafsir_book_slug_s' ] ?? null,
                        'fromAyah'           => $doc[ 'from_ayah_s' ] ?? null,
                        'toAyah'             => $doc[ 'to_ayah_s' ] ?? null,
                        'ayahKey'            => $doc[ 'ayah_key_s' ] ?? null,
                    );

                    continue;
                }

                if ( ! $verseKey ) {
                    continue;
                }

                $verse = $verses->get( $verseKey );

                if ( ! $verse ) {
                    continue;
                }

                $translation = null;

                if ( $translationResourceId ) {
                    $fieldName   = 'translation_' . $translationResourceId . '_t';
                    $translation = $doc[ $fieldName ] ?? null;
                }

                $results[  ] = array(
                    'id'            => $verse->id,
                    'documentType'  => 'verse',
                    'chapterId'     => $verse->chapter->id,
                    'chapterName'   => $verse->chapter->name_roman,
                    'chapterNumber' => $verse->chapter->chapter_number,
                    'verseNumber'   => $verse->verse_number,
                    'text'          => $doc[ 'text_uthmani_t' ] ?? $verse->text_uthmani,
                    'translation'   => $translation,
                    'juzNumber'     => $verse->juz_number,
                    'pageNumber'    => $verse->page_number,
                    'hasResources'  => isset( $doc[ 'num_resource_i' ] ) ? (int) $doc[ 'num_resource_i' ] > 0 : false,
                    'resourceCount' => isset( $doc[ 'num_resource_i' ] ) ? (int) $doc[ 'num_resource_i' ] : 0,
                 );
            }

            return $results;
        } );
    }

    /**
     * Get Juz information from database
     */
    public function getJuzs(): array {
        return Cache::remember( 'quran.db.juzs', $this->cacheTtl * 24, function () {
            $juzs = array(  );

            for ( $i = 1; $i <= 30; ++$i ) {
                $verseCount = Verse::where( 'juz_number', $i )->count();

                $juzs[  ] = array(
                    'id'   => $i,
                    'name' => "Juz {$i}",
                    'number'     => $i,
                    'verseCount' => $verseCount,
                 );
            }

            return $juzs;
        } );
    }

    /**
     * Clear Quran cache
     */
    public function clearCache(): void {
        $patterns = array(
            'quran.db.chapters',
            'quran.db.editions',
            'quran.db.juzs',
            'quran.db.verses.*',
            'quran.db.search.*',
         );

        foreach ( $patterns as $pattern ) {
            if ( str_contains( $pattern, '*' ) ) {
                // Clear pattern-based keys
                $prefix = str_replace( '*', '', $pattern );
                Cache::flush(); // In production, use a more targeted approach
            } else {
                Cache::forget( $pattern );
            }
        }
    }

    /**
     * Get all available tafseer books
     */
    public function getTafseerBooks(): array {
        return Cache::remember( 'quran.db.tafseer_books', $this->cacheTtl * 24, function () {
            return TafseerBook::orderBy( 'display_order' )
                ->get()
                ->map( function ( $book ) {
                    return array(
                        'id'          => $book->id,
                        'name'        => $book->name,
                        'slug'        => $book->slug,
                        'description' => $book->description,
                     );
                } )
                ->toArray();
        } );
    }

    /**
     * Get tafsir for a specific verse from a specific tafseer book
     */
    public function getTafsirForVerse( int $chapterId, int $verseNumber, int $tafsirId ): ?array {
        $cacheKey = "quran.solr.tafsir.{$chapterId}.{$verseNumber}.{$tafsirId}";

        return Cache::remember( $cacheKey, $this->cacheTtl, function () use ( $chapterId, $verseNumber, $tafsirId ) {
            $ayahKey = $chapterId . ':' . $verseNumber;

            // Query Solr for tafsir matching this verse and tafseer book
            $select = $this->solrClient->createSelect();
            $select->setQuery( '*:*' );
            $select->createFilterQuery( 'type' )
                ->setQuery( '(document_type_s:tafsir OR type_s:tafsir)' );
            $select->createFilterQuery( 'tafsir' )
                ->setQuery( 'tafsir_id_i:' . $tafsirId );
            $select->createFilterQuery( 'ayah' )
                ->setQuery( sprintf( 'ayah_key_s:"%s" OR (from_ayah_s:[* TO "%s"] AND to_ayah_s:["%s" TO *])', $ayahKey, $ayahKey, $ayahKey ) );

            $resultSet = $this->solrClient->select( $select );

            if ( $resultSet->getNumFound() === 0 ) {
                return null;
            }

            // Get the first matching tafsir
            foreach ( $resultSet as $doc ) {
                return array(
                    'tafsirId'       => $doc[ 'tafsir_id_i' ] ?? null,
                    'bookName'       => $doc[ 'tafsir_book_name_s' ] ?? null,
                    'bookSlug'       => $doc[ 'tafsir_book_slug_s' ] ?? null,
                    'ayahKey'        => $doc[ 'ayah_key_s' ] ?? null,
                    'text'           => $doc[ 'text_t' ] ?? null,
                    'fromAyah'       => $doc[ 'from_ayah_s' ] ?? null,
                    'toAyah'         => $doc[ 'to_ayah_s' ] ?? null,
                    'ayahKeys'       => $doc[ 'ayah_keys_ss' ] ?? array(),
                    'chapterId'      => $doc[ 'chapter_id_i' ] ?? null,
                    'verseNumber'    => $doc[ 'verse_number_i' ] ?? null,
                );
            }

            return null;
        } );
    }

    /**
     * Get tafsir for a specific verse by ayah key and tafseer book slug
     */
    public function getTafsirByAyahKey( string $ayahKey, string $tafsirSlug ): ?array {
        $cacheKey = "quran.solr.tafsir.{$ayahKey}.{$tafsirSlug}";

        return Cache::remember( $cacheKey, $this->cacheTtl, function () use ( $ayahKey, $tafsirSlug ) {
            // Query Solr for tafsir matching this verse and tafseer book
            $select = $this->solrClient->createSelect();
            $select->setQuery( '*:*' );
            $select->createFilterQuery( 'type' )
                ->setQuery( '(document_type_s:tafsir OR type_s:tafsir)' );
            $select->createFilterQuery( 'slug' )
                ->setQuery( sprintf( 'tafsir_book_slug_s:"%s"', $tafsirSlug ) );
            $select->createFilterQuery( 'ayah' )
                ->setQuery( sprintf( 'ayah_key_s:"%s" OR (from_ayah_s:[* TO "%s"] AND to_ayah_s:["%s" TO *])', $ayahKey, $ayahKey, $ayahKey ) );

            $resultSet = $this->solrClient->select( $select );

            if ( $resultSet->getNumFound() === 0 ) {
                return null;
            }

            // Collect all matching documents and prefer ones with text content
            $bestMatch = null;
            $hasExactMatch = false;

            foreach ( $resultSet as $doc ) {
                $text = $doc[ 'text_t' ] ?? null;
                $docAyahKey = $doc[ 'ayah_key_s' ] ?? null;

                // If we haven't found an exact match yet
                if ( !$hasExactMatch ) {
                    // Exact ayah_key match is always best
                    if ( $docAyahKey === $ayahKey && !empty( $text ) ) {
                        $bestMatch = $doc;
                        $hasExactMatch = true;
                    }
                    // Otherwise, prefer documents with text content
                    elseif ( !$bestMatch && !empty( $text ) ) {
                        $bestMatch = $doc;
                    }
                }
            }

            // If we found an exact match with text, use it; otherwise use the best match
            $doc = $bestMatch;

            if ( !$doc ) {
                return null;
            }

            return array(
                'tafsirId'       => $doc[ 'tafsir_id_i' ] ?? null,
                'bookName'       => $doc[ 'tafsir_book_name_s' ] ?? null,
                'bookSlug'       => $doc[ 'tafsir_book_slug_s' ] ?? null,
                'ayahKey'        => $doc[ 'ayah_key_s' ] ?? null,
                'text'           => $doc[ 'text_t' ] ?? null,
                'fromAyah'       => $doc[ 'from_ayah_s' ] ?? null,
                'toAyah'         => $doc[ 'to_ayah_s' ] ?? null,
                'ayahKeys'       => $doc[ 'ayah_keys_ss' ] ?? array(),
                'chapterId'      => $doc[ 'chapter_id_i' ] ?? null,
                'verseNumber'    => $doc[ 'verse_number_i' ] ?? null,
            );
        } );
    }
}
