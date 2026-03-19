export interface ChapterSummary {
    id: number;
    number: number;
    name: string;
    englishName: string;
    romanName?: string;
    englishNameTranslation: string;
    revelationType?: 'Meccan' | 'Medinan';
    verses?: number;
}

export interface VerseTranslation {
    resource_id: number;
    resource_content_id?: number;
    resource_name?: string;
    language?: string;
    text: string;
}

export interface VerseListItem {
    id: number;
    chapterId: number;
    chapterNumber?: number;
    verseNumber: number;
    text: string;
    translation?: string;
    translations?: VerseTranslation[];
    audioUrl?: string;
    juzNumber: number;
    pageNumber: number;
    hasResources?: boolean;
    resourceCount?: number;
}

export interface PaginatedVersesResponse {
    data: VerseListItem[];
    total: number;
    has_more: boolean;
}

export interface BookmarkListItem {
    verse_id: number;
}

export interface ResourceGraphCounts {
    resource_types: Record<string, number>;
    similar_verses: number;
    topics: number;
}

export interface ResourceGraphApiResponse {
    meta?: {
        counts?: Partial<ResourceGraphCounts>;
    };
}

export type GraphNodeType = 'verse' | 'resource' | 'topic' | 'similar';

export interface ResourceGraphNode {
    id: string;
    label: string;
    type: GraphNodeType;
    originalName?: string;
    x?: number;
    y?: number;
}

export interface ResourceGraphLink {
    source: string;
    target: string;
}
