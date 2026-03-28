import { api, isApiError } from '@/lib/api-client';
import {
    getBrowserQueryClient,
    getCachedQueryData,
    queryKeys,
} from '@/lib/query-client';
import { type ChapterSummary } from '@/types/quran';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

const CHAPTERS_STALE_TIME_MS = 5 * 60 * 1000;

async function fetchChapters() {
    return api.get<ChapterSummary[]>('/api/quran/chapters');
}

interface UseChaptersReturn {
    chapters: ChapterSummary[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    getChapterByNumber: (number: number) => ChapterSummary | undefined;
    getChapterById: (id: number) => ChapterSummary | undefined;
}

export function useChapters(): UseChaptersReturn {
    const queryClient = useQueryClient();
    const { data, isLoading, error } = useQuery({
        queryKey: queryKeys.quranChapters,
        queryFn: fetchChapters,
        staleTime: CHAPTERS_STALE_TIME_MS,
    });

    const chapters = data ?? [];

    const refresh = useCallback(async () => {
        await queryClient.invalidateQueries({
            queryKey: queryKeys.quranChapters,
        });
    }, [queryClient]);

    const getChapterByNumber = useCallback(
        (number: number) => {
            return chapters.find((chapter) => chapter.number === number);
        },
        [chapters],
    );

    const getChapterById = useCallback(
        (id: number) => {
            return chapters.find((chapter) => chapter.id === id);
        },
        [chapters],
    );

    return {
        chapters,
        loading: isLoading,
        error: error
            ? isApiError(error)
                ? error.message
                : 'Failed to load chapters'
            : null,
        refresh,
        getChapterByNumber,
        getChapterById,
    };
}

export function getChaptersFromCache(): ChapterSummary[] | null {
    return (
        getCachedQueryData<ChapterSummary[]>(queryKeys.quranChapters) ?? null
    );
}

export function isChaptersCacheValid(): boolean {
    const state = getBrowserQueryClient().getQueryState<ChapterSummary[]>(
        queryKeys.quranChapters,
    );

    if (!state?.dataUpdatedAt) {
        return false;
    }

    return Date.now() - state.dataUpdatedAt < CHAPTERS_STALE_TIME_MS;
}
