<?php

namespace App\Services\Arango;

class QuranGraphQueryService
{
    public function __construct(protected ArangoClient $client) {}

    public function getVerseGraph(string $verseKey, int $depth = 1, ?array $types = null): array
    {
        $parts = explode(':', $verseKey);
        if (count($parts) !== 2) {
            throw new \InvalidArgumentException('Invalid verse key format. Expected chapter:verse');
        }

        $chapterNumber = (int) $parts[0];
        $verseNumber = (int) $parts[1];
        $centerKey = QuranGraphIndexer::verseKey($chapterNumber, $verseNumber);

        $edgeCollections = $this->resolveEdgeCollections($types);

        $aql = <<<'AQL'
            LET center = DOCUMENT('verses', @centerKey)
            LET nodes = (
                FOR v, e, p IN 1..@depth
                    OUTBOUND center
                    @edgeCollections
                    OPTIONS { bfs: true, uniqueVertices: 'global' }
                    RETURN DISTINCT v
            )
            LET links = (
                FOR v, e, p IN 1..@depth
                    OUTBOUND center
                    @edgeCollections
                    OPTIONS { bfs: true, uniqueVertices: 'global' }
                    RETURN DISTINCT {
                        source: PARSE_IDENTIFIER(e._from).key,
                        target: PARSE_IDENTIFIER(e._to).key,
                        type: e._id,
                        weight: e.score != null ? e.score : (e.coverage != null ? e.coverage : 1),
                        payload: e.matched_words_count != null ? { matched_words_count: e.matched_words_count } : null
                    }
            )
            RETURN {
                center: center,
                nodes: APPEND(nodes, [center], true),
                links: links
            }
        AQL;

        $bindVars = [
            'centerKey' => $centerKey,
            'depth' => $depth,
        ];

        $result = $this->executeTraversalAql($aql, $bindVars, $edgeCollections);

        return $this->formatGraphResponse($result, $centerKey, $depth);
    }

    public function getChapterGraph(int $chapterNumber, int $depth = 1, ?array $types = null): array
    {
        $centerKey = QuranGraphIndexer::chapterKey($chapterNumber);

        $edgeCollections = $this->resolveEdgeCollections($types, true);

        $aql = <<<'AQL'
            LET center = DOCUMENT('chapters', @centerKey)
            LET nodes = (
                FOR v, e, p IN 1..@depth
                    OUTBOUND center
                    @edgeCollections
                    OPTIONS { bfs: true, uniqueVertices: 'global' }
                    RETURN DISTINCT v
            )
            LET links = (
                FOR v, e, p IN 1..@depth
                    OUTBOUND center
                    @edgeCollections
                    OPTIONS { bfs: true, uniqueVertices: 'global' }
                    RETURN DISTINCT {
                        source: PARSE_IDENTIFIER(e._from).key,
                        target: PARSE_IDENTIFIER(e._to).key,
                        type: e._id,
                        weight: e.score != null ? e.score : (e.coverage != null ? e.coverage : 1),
                        payload: e.matched_words_count != null ? { matched_words_count: e.matched_words_count } : null
                    }
            )
            RETURN {
                center: center,
                nodes: APPEND(nodes, [center], true),
                links: links
            }
        AQL;

        $bindVars = [
            'centerKey' => $centerKey,
            'depth' => $depth,
        ];

        $result = $this->executeTraversalAql($aql, $bindVars, $edgeCollections);

        return $this->formatGraphResponse($result, $centerKey, $depth);
    }

    protected function executeTraversalAql(string $aql, array $bindVars, array $edgeCollections): ?array
    {
        if (empty($edgeCollections)) {
            $edgeCollections = config('arango.collections.edges', []);
        }

        // Build edge collection string for AQL (unquoted identifiers)
        $edgeStr = implode(', ', $edgeCollections);
        $aql = str_replace('@edgeCollections', $edgeStr, $aql);

        $response = $this->client->aql($aql, $bindVars);
        $results = $response['result'] ?? [];

        return $results[0] ?? null;
    }

    protected function formatGraphResponse(?array $result, string $centerKey, int $depth): array
    {
        if (! $result) {
            return [
                'nodes' => [],
                'links' => [],
                'meta' => [
                    'center' => $centerKey,
                    'depth' => $depth,
                    'counts' => ['nodes' => 0, 'links' => 0],
                ],
            ];
        }

        $nodes = [];
        $nodeIds = [];

        foreach ($result['nodes'] ?? [] as $doc) {
            if (! $doc) {
                continue;
            }

            $key = $doc['_key'] ?? null;
            if (! $key || isset($nodeIds[$key])) {
                continue;
            }

            $nodeIds[$key] = true;
            $type = $this->inferNodeType($doc);
            $label = $this->inferNodeLabel($doc, $type);

            $nodes[] = [
                'id' => $key,
                'label' => $label,
                'type' => $type,
                'payload' => $this->filterPayload($doc),
            ];
        }

        $links = [];
        $linkIds = [];

        foreach ($result['links'] ?? [] as $edge) {
            $linkId = "{$edge['source']}__{$edge['target']}";
            if (isset($linkIds[$linkId])) {
                continue;
            }

            $linkIds[$linkId] = true;
            $links[] = [
                'source' => $edge['source'],
                'target' => $edge['target'],
                'type' => $this->inferEdgeType($edge['type']),
                'weight' => $edge['weight'] ?? 1,
                'payload' => $edge['payload'] ?? null,
            ];
        }

        return [
            'nodes' => $nodes,
            'links' => $links,
            'meta' => [
                'center' => $centerKey,
                'depth' => $depth,
                'counts' => [
                    'nodes' => count($nodes),
                    'links' => count($links),
                ],
            ],
        ];
    }

    protected function inferNodeType(array $doc): string
    {
        $id = $doc['_id'] ?? '';
        $parts = explode('/', $id);
        $collection = $parts[0] ?? '';

        return match ($collection) {
            'verses' => 'verse',
            'chapters' => 'chapter',
            'topics' => 'topic',
            'resources' => 'resource',
            'tafsirs' => 'tafsir',
            'translations' => 'translation',
            'roots' => 'root',
            'lemmas' => 'lemma',
            'stems' => 'stem',
            default => 'unknown',
        };
    }

    protected function inferNodeLabel(array $doc, string $type): string
    {
        return match ($type) {
            'verse' => $doc['verse_key'] ?? ($doc['_key'] ?? 'Verse'),
            'chapter' => ($doc['name_simple'] ?? 'Chapter').' ('.($doc['chapter_number'] ?? '').')',
            'topic' => $doc['name'] ?? 'Topic',
            'resource' => $doc['title'] ?? 'Resource',
            'tafsir' => ($doc['resource_name'] ?? 'Tafsir').' '.$doc['verse_key'] ?? '',
            'translation' => ($doc['resource_name'] ?? 'Translation').' '.$doc['verse_key'] ?? '',
            'root' => $doc['value'] ?? 'Root',
            'lemma' => $doc['text_madani'] ?? ($doc['text_clean'] ?? 'Lemma'),
            'stem' => $doc['text_madani'] ?? ($doc['text_clean'] ?? 'Stem'),
            default => $doc['_key'] ?? 'Node',
        };
    }

    protected function inferEdgeType(string $edgeId): string
    {
        $parts = explode('/', $edgeId);
        $collection = $parts[0] ?? '';

        return match ($collection) {
            'chapter_has_verse' => 'chapter_has_verse',
            'verse_next' => 'verse_next',
            'verse_similar_to' => 'verse_similar_to',
            'verse_has_topic' => 'verse_has_topic',
            'topic_parent_of' => 'topic_parent_of',
            'topic_related_to' => 'topic_related_to',
            'verse_has_resource' => 'verse_has_resource',
            'chapter_has_resource' => 'chapter_has_resource',
            'verse_has_tafsir' => 'verse_has_tafsir',
            'verse_has_translation' => 'verse_has_translation',
            'verse_has_root' => 'verse_has_root',
            'verse_has_lemma' => 'verse_has_lemma',
            'verse_has_stem' => 'verse_has_stem',
            default => $collection,
        };
    }

    protected function filterPayload(array $doc): array
    {
        $hidden = ['_id', '_key', '_rev', '_from', '_to'];

        return array_diff_key($doc, array_flip($hidden));
    }

    protected function resolveEdgeCollections(?array $types, bool $isChapter = false): array
    {
        $all = config('arango.collections.edges', []);

        if (empty($types)) {
            return $all;
        }

        $allowed = [];
        $typeMap = [
            'chapter' => ['chapter_has_verse', 'chapter_has_resource'],
            'verse' => ['verse_next', 'verse_similar_to', 'verse_has_topic', 'verse_has_resource', 'verse_has_tafsir', 'verse_has_translation', 'verse_has_root', 'verse_has_lemma', 'verse_has_stem'],
            'topic' => ['verse_has_topic', 'topic_parent_of', 'topic_related_to'],
            'resource' => ['verse_has_resource', 'chapter_has_resource'],
            'tafsir' => ['verse_has_tafsir'],
            'translation' => ['verse_has_translation'],
            'root' => ['verse_has_root'],
            'lemma' => ['verse_has_lemma'],
            'stem' => ['verse_has_stem'],
            'similar' => ['verse_similar_to'],
        ];

        foreach ($types as $type) {
            if (isset($typeMap[$type])) {
                $allowed = array_merge($allowed, $typeMap[$type]);
            }
        }

        return array_values(array_intersect($all, array_unique($allowed)));
    }
}
