import type {
    QuranGraphV2Link,
    QuranGraphV2Meta,
    QuranGraphV2Node,
    QuranGraphV2NodeType,
    QuranGraphV2Response,
} from '@/types/quran-graph';
import { describe, expect, it } from 'vitest';

describe('QuranGraphV2 types', () => {
    it('accepts valid node types', () => {
        const types: QuranGraphV2NodeType[] = [
            'verse',
            'chapter',
            'topic',
            'similar',
            'tafsir',
            'resource',
            'translation',
            'root',
            'lemma',
            'stem',
            'unknown',
        ];

        expect(types.length).toBe(11);
    });

    it('accepts a valid response shape', () => {
        const node: QuranGraphV2Node = {
            id: 'verse_1_1',
            label: '1:1',
            type: 'verse',
            payload: { text_uthmani: 'بسم الله' },
        };

        const link: QuranGraphV2Link = {
            source: 'verse_1_1',
            target: 'chapter_1',
            type: 'chapter_has_verse',
            weight: 1,
            payload: null,
        };

        const meta: QuranGraphV2Meta = {
            center: 'verse_1_1',
            depth: 1,
            counts: { nodes: 2, links: 1 },
        };

        const response: QuranGraphV2Response = {
            nodes: [node],
            links: [link],
            meta,
        };

        expect(response.nodes.length).toBe(1);
        expect(response.links[0].source).toBe('verse_1_1');
    });
});
