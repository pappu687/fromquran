import { api, getErrorMessage } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { type CollectionTag } from '@/types/collections';
import { useQuery } from '@tanstack/react-query';

export interface CollectionVerse {
    id: number;
    verse_key: string;
    verse_number: number;
    text_uthmani: string;
    text_imlaei_simple?: string;
    juz_number?: number;
    page_number?: number;
    has_resources?: boolean;
    resource_count?: number;
    translations?: Array<{
        resource_id: number;
        resource_name?: string;
        language?: string;
        text: string;
    }>;
    chapter: {
        id: number;
        chapter_number: number;
        name_simple: string;
        name_roman?: string;
        name_arabic: string;
    };
    pivot: {
        display_order: number;
    };
}

export interface CollectionDetailData {
    id: number;
    name: string;
    description?: string;
    color: string;
    is_public: boolean;
    status: 'pending' | 'approved' | 'rejected';
    slug: string;
    created_at: string;
    views_count?: number;
    verses: CollectionVerse[];
    tags: CollectionTag[];
}

export function useCollectionDetailQuery(slug: string, enabled = true) {
    const query = useQuery({
        queryKey: queryKeys.collectionDetail(slug),
        queryFn: () =>
            api.get<CollectionDetailData>(`/api/collections/${slug}`),
        enabled: enabled && Boolean(slug),
    });

    return {
        ...query,
        collection: query.data ?? null,
        errorMessage: query.error ? getErrorMessage(query.error) : null,
    };
}

export function useCollectionTagsQuery(enabled = true) {
    const query = useQuery({
        queryKey: queryKeys.collectionTags,
        queryFn: () => api.get<CollectionTag[]>('/api/tags'),
        enabled,
        staleTime: 5 * 60 * 1000,
    });

    return {
        ...query,
        tags: query.data ?? [],
        errorMessage: query.error ? getErrorMessage(query.error) : null,
    };
}
