export type QuranGraphV2NodeType =
    | 'verse'
    | 'chapter'
    | 'topic'
    | 'similar'
    | 'tafsir'
    | 'resource'
    | 'resource_hub'
    | 'translation'
    | 'root'
    | 'lemma'
    | 'stem'
    | 'unknown';

export interface QuranGraphV2Node {
    id: string;
    label: string;
    type: QuranGraphV2NodeType;
    payload: Record<string, unknown>;
}

export interface QuranGraphV2Link {
    source: string;
    target: string;
    type: string;
    weight: number;
    payload: Record<string, unknown> | null;
}

export interface QuranGraphV2Meta {
    center: string;
    depth: number;
    counts: {
        nodes: number;
        links: number;
    };
}

export interface QuranGraphV2Response {
    nodes: QuranGraphV2Node[];
    links: QuranGraphV2Link[];
    meta: QuranGraphV2Meta;
}

export interface QuranGraphV2DetailPanelProps {
    node: QuranGraphV2Node | null;
    onClose: () => void;
}
