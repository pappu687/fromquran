import { api, getErrorMessage } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { useQuery } from '@tanstack/react-query';

export interface ChapterInfoData {
    surah_number: number;
    surah_name: string;
    text: string;
    short_text: string;
}

export interface ChapterResourceType {
    id: number;
    slug: string;
    name: string;
}

export interface ChapterResourceData {
    id: string | number;
    resource_type_id?: number;
    resource_url: string;
    resource_title: string | null;
    comment: string | null;
    is_truncated?: boolean;
    created_at?: string;
    resource_type: ChapterResourceType;
    user: {
        name: string;
    };
}

export function useChapterInfoQuery(chapterNumber: number, enabled = true) {
    const query = useQuery({
        queryKey: queryKeys.quranChapterInfo(chapterNumber),
        queryFn: () =>
            api.get<ChapterInfoData>(
                `/api/quran/chapters/${chapterNumber}/info`,
            ),
        enabled: enabled && chapterNumber > 0,
        staleTime: 5 * 60 * 1000,
    });

    return {
        ...query,
        chapterInfo: query.data ?? null,
        errorMessage: query.error ? getErrorMessage(query.error) : null,
    };
}

export function useChapterResourcesQuery(
    chapterNumber: number,
    enabled = true,
) {
    const query = useQuery({
        queryKey: queryKeys.quranChapterResources(chapterNumber),
        queryFn: () =>
            api.get<{ data: ChapterResourceData[] }>(
                `/api/quran/chapters/${chapterNumber}/resources`,
            ),
        enabled: enabled && chapterNumber > 0,
        staleTime: 2 * 60 * 1000,
    });

    return {
        ...query,
        resources: query.data?.data ?? [],
        errorMessage: query.error ? getErrorMessage(query.error) : null,
    };
}
