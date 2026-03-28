import { api, getErrorMessage } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { useQuery } from '@tanstack/react-query';

export interface QuranSearchResult {
    id: number;
    documentType?: string;
    chapterId: number;
    chapterName?: string;
    verseNumber: number;
    text: string;
    translation?: string | null;
    highlight?: string;
}

export function useQuranSearch(
    query: string,
    { limit = 20, enabled = true }: { limit?: number; enabled?: boolean } = {},
) {
    const normalizedQuery = query.trim();

    const searchQuery = useQuery({
        queryKey: queryKeys.quranSearch(normalizedQuery, limit),
        queryFn: () =>
            api.get<{ data?: QuranSearchResult[] }>(
                `/api/quran/search?query=${encodeURIComponent(normalizedQuery)}&limit=${limit}`,
            ),
        enabled: enabled && normalizedQuery.length > 0,
        staleTime: 60 * 1000,
    });

    return {
        ...searchQuery,
        results: searchQuery.data?.data ?? [],
        errorMessage: searchQuery.error
            ? getErrorMessage(searchQuery.error)
            : null,
    };
}
