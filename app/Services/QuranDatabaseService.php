<?php
namespace App\Services;

use App\Models\Chapter;
use App\Models\ResourceContent;
use App\Models\TafseerBook;
use App\Models\Translation;
use App\Models\Verse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Solarium\Client;

class QuranDatabaseService {
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
        $cacheKey = "q.verses.{$chapterId}.all.{$edition}." . implode(',', $translationIds);

        return Cache::remember( $cacheKey, $this->cacheTtl, function () use ( $chapterId, $edition, $translationIds ) {
            $chapter = Chapter::where( 'id', $chapterId )
                ->orWhere( 'chapter_number', $chapterId )
                ->first();

            if ( ! $chapter ) {
                return array(  );
            }

            // Resolve language_ids from translations
            $languageIdMap = [];
            if (!empty($translationIds)) {
                $resources = ResourceContent::whereIn('id', $translationIds)
                    ->where('approved', true)
                    ->get();
                
                foreach ($resources as $resource) {
                    $languageIdMap[$resource->id] = $resource->language_id;
                }
            } else if ( 'ar' !== $edition ) {
                $resource = ResourceContent::where( 'resource_type', 'translation' )
                    ->where( 'approved', true )
                    ->where( function ( $query ) use ( $edition ) {
                        $query->where( 'resource_id', 'like', "%{$edition}%" )
                            ->orWhere( 'slug', 'like', "%{$edition}%" );
                    } )
                    ->first();

                if ( ! $resource ) {
                    // Fallback to any English translation resource
                    $resource = ResourceContent::where( 'resource_type', 'translation' )
                        ->where( 'approved', true )
                        ->where( 'language_name', 'English' )
                        ->first();
                }

                if ($resource) {
                    $languageIdMap[$resource->id] = $resource->language_id;
                }
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

            // Collect verse_keys from Solr and load DB metadata + resource counts
            $verseKeys = array(  );

            foreach ( $resultSet as $doc ) {
                if ( isset( $doc[ 'verse_key_s' ] ) ) {
                    $verseKeys[  ] = $doc[ 'verse_key_s' ];
                }
            }

            $verseMeta = Verse::whereIn( 'verses.verse_key', $verseKeys )
                ->leftJoin( 'user_verse_resources', function ( $join ) {
                    $join->on( 'verses.id', '=', 'user_verse_resources.verse_id' )
                        ->where( 'user_verse_resources.status', '=', 'approved' );
                } )
                ->select(
                    'verses.id',
                    'verses.chapter_id',
                    'verses.verse_number',
                    'verses.verse_key',
                    'verses.juz_number',
                    'verses.rub_el_hizb_number',
                    'verses.page_number',
                    DB::raw( 'COUNT(DISTINCT user_verse_resources.id) as resource_count' )
                )
                ->groupBy(
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

            $verses = array(  );

            foreach ( $resultSet as $doc ) {
                $verseKey = $doc[ 'verse_key_s' ] ?? null;

                if ( ! $verseKey ) {
                    continue;
                }

                $meta = $verseMeta->get( $verseKey );

                // Translations from Solr
                $translations = [];
                foreach ($languageIdMap as $resourceId => $langId) {
                    $fieldName = 'translation_' . $langId . '_t';
                    if (isset($doc[$fieldName])) {
                        $translations[] = [
                            'resource_id' => $resourceId,
                            'text' => $doc[$fieldName]
                        ];
                    }
                }

                $verses[  ] = array(
                    'id'            => $meta->id ?? null,
                    'chapterId'     => $meta->chapter_id ?? $chapter->id,
                    'verseNumber'   => $meta->verse_number ?? ( $doc[ 'verse_number_i' ] ?? null ),
                    'text'          => $doc[ 'text_uthmani_t' ] ?? null,
                    'translations'  => $translations,
                    'translation'   => !empty($translations) ? $translations[0]['text'] : null, // keep for backward compatibility
                    'juzNumber'     => $meta->juz_number ?? ( $doc[ 'juz_number_i' ] ?? null ),
                    'pageNumber'    => $meta->page_number ?? ( $doc[ 'page_number_i' ] ?? null ),
                    'hizbQuarter'   => $meta->rub_el_hizb_number ?? null,
                    'sajda'         => false,
                    'audioUrl'      => null,
                    'hasResources'  => isset( $meta ) ? $meta->resource_count > 0 : false,
                    'resourceCount' => isset( $meta ) ? (int) $meta->resource_count : 0,
                 );
            }

            return $verses;
        } );
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
        return Cache::remember( 'quran.db.translations_list', $this->cacheTtl * 24, function () {
            return ResourceContent::where( 'resource_type', 'translation' )
                ->where( 'approved', true )
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
        $cacheKey = "quran.solr.search." . md5( $query . $edition );

        return Cache::remember( $cacheKey, $this->cacheTtl / 2, function () use ( $query, $edition ) {
            // Resolve language_id from edition to pick correct translation field
            $languageId = null;

            if ( 'ar' !== $edition ) {
                $resource = ResourceContent::where( 'resource_type', 'translation' )
                    ->where( 'approved', true )
                    ->where( function ( $q ) use ( $edition ) {
                        $q->where( 'resource_id', 'like', "%{$edition}%" )
                            ->orWhere( 'slug', 'like', "%{$edition}%" );
                    } )
                    ->first();

                if ( ! $resource ) {
                    $resource = ResourceContent::where( 'resource_type', 'translation' )
                        ->where( 'approved', true )
                        ->where( 'language_name', 'English' )
                        ->first();
                }

                $languageId = $resource?->language_id;
            }

            $select       = $this->solrClient->createSelect();
            $escapedQuery = addcslashes( $query, '+-&|!(){}[]^"~*?:\\/' );

            if ( $languageId ) {
                $fieldName = 'translation_' . $languageId . '_t';
                $select->setQuery( sprintf( '(%s:%s) OR (text_uthmani_t:%s)', $fieldName, $escapedQuery, $escapedQuery ) );
            } else {
                $select->setQuery( sprintf( 'text_uthmani_t:%s', $escapedQuery ) );
            }

            $select->addSort( 'score', $select::SORT_DESC );
            $select->setStart( 0 )->setRows( 200 );

            $resultSet = $this->solrClient->select( $select );

            if ( $resultSet->getNumFound() === 0 ) {
                return array(  );
            }

            $verseKeys = array(  );

            foreach ( $resultSet as $doc ) {
                if ( isset( $doc[ 'verse_key_s' ] ) ) {
                    $verseKeys[  ] = $doc[ 'verse_key_s' ];
                }
            }

            $verses = Verse::whereIn( 'verse_key', $verseKeys )
                ->with( 'chapter' )
                ->get()
                ->keyBy( 'verse_key' );

            $results = array(  );

            foreach ( $resultSet as $doc ) {
                $verseKey = $doc[ 'verse_key_s' ] ?? null;

                if ( ! $verseKey ) {
                    continue;
                }

                $verse = $verses->get( $verseKey );

                if ( ! $verse ) {
                    continue;
                }

                $translation = null;

                if ( $languageId ) {
                    $fieldName   = 'translation_' . $languageId . '_t';
                    $translation = $doc[ $fieldName ] ?? null;
                }

                $results[  ] = array(
                    'id'            => $verse->id,
                    'chapterId'     => $verse->chapter->id,
                    'chapterName'   => $verse->chapter->name_roman,
                    'chapterNumber' => $verse->chapter->chapter_number,
                    'verseNumber'   => $verse->verse_number,
                    'text'          => $doc[ 'text_uthmani_t' ] ?? $verse->text_uthmani,
                    'translation'   => $translation,
                    'juzNumber'     => $verse->juz_number,
                    'pageNumber'    => $verse->page_number,
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
                ->setQuery( 'type_s:tafsir' );
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
                ->setQuery( 'type_s:tafsir' );
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
