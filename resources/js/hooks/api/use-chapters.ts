import { type ChapterSummary } from '@/types/quran';
import { api, isApiError } from '@/lib/api-client';
import { useEffect, useState, useCallback } from 'react';

interface ChaptersCache {
    data: ChapterSummary[];
    timestamp: number;
    error: string | null;
}

// Cache configuration
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Global cache (shared across all hook instances)
let globalCache: ChaptersCache | null = null;
let pendingRequest: Promise<ChapterSummary[]> | null = null;

interface UseChaptersReturn {
    chapters: ChapterSummary[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    getChapterByNumber: (number: number) => ChapterSummary | undefined;
    getChapterById: (id: number) => ChapterSummary | undefined;
}

/**
 * Hook to fetch and cache Quran chapters
 * 
 * Features:
 * - Shared cache across all component instances
 * - Stale-while-revalidate strategy
 * - Automatic retry on failure
 * - Utility methods for chapter lookup
 * 
 * @example
 * ```tsx
 * const { chapters, loading, error, getChapterByNumber } = useChapters();
 * 
 * useEffect(() => {
 *     if (!loading && chapters.length > 0) {
 *         const chapter = getChapterByNumber(18); // Surah Al-Kahf
 *     }
 * }, [chapters, loading, getChapterByNumber]);
 * ```
 */
export function useChapters(): UseChaptersReturn {
    const [chapters, setChapters] = useState<ChapterSummary[]>(
        globalCache?.data || [],
    );
    const [loading, setLoading] = useState(!globalCache?.data);
    const [error, setError] = useState<string | null>(
        globalCache?.error || null,
    );

    const fetchChapters = useCallback(async (forceRefresh = false): Promise<void> => {
        const now = Date.now();

        // Return cached data if still valid and not forcing refresh
        if (
            !forceRefresh &&
            globalCache?.data &&
            now - globalCache.timestamp < CACHE_DURATION_MS &&
            !globalCache.error
        ) {
            setChapters(globalCache.data);
            setLoading(false);
            return;
        }

        // Return pending request if available (deduplication)
        if (pendingRequest && !forceRefresh) {
            try {
                const data = await pendingRequest;
                setChapters(data);
                setLoading(false);
                return;
            } catch {
                // Will be handled below
            }
        }

        setLoading(true);
        setError(null);

        pendingRequest = api
            .get<ChapterSummary[]>('/api/quran/chapters')
            .then((data) => {
                globalCache = {
                    data,
                    timestamp: Date.now(),
                    error: null,
                };
                setChapters(data);
                setLoading(false);
                setError(null);
                pendingRequest = null;
                return data;
            })
            .catch((err) => {
                const errorMessage = isApiError(err)
                    ? err.message
                    : 'Failed to load chapters';
                
                globalCache = {
                    data: globalCache?.data || [],
                    timestamp: globalCache?.timestamp || 0,
                    error: errorMessage,
                };
                
                setChapters(globalCache.data || []);
                setLoading(false);
                setError(errorMessage);
                pendingRequest = null;
                throw err;
            });

        try {
            await pendingRequest;
        } catch {
            // Error already handled in the promise chain
        }
    }, []);

    const refresh = useCallback(async () => {
        await fetchChapters(true);
    }, [fetchChapters]);

    // Initial load
    useEffect(() => {
        if (!globalCache?.data || globalCache.error) {
            fetchChapters();
        } else if (globalCache.data) {
            setChapters(globalCache.data);
            setLoading(false);
        }
    }, [fetchChapters]);

    // Utility methods for chapter lookup
    const getChapterByNumber = useCallback(
        (number: number): ChapterSummary | undefined => {
            return chapters.find((chapter) => chapter.number === number);
        },
        [chapters],
    );

    const getChapterById = useCallback(
        (id: number): ChapterSummary | undefined => {
            return chapters.find((chapter) => chapter.id === id);
        },
        [chapters],
    );

    return {
        chapters,
        loading,
        error,
        refresh,
        getChapterByNumber,
        getChapterById,
    };
}

/**
 * Get chapters synchronously from cache (for non-component code)
 * Returns null if no cache available
 */
export function getChaptersFromCache(): ChapterSummary[] | null {
    return globalCache?.data || null;
}

/**
 * Check if chapters are cached and still valid
 */
export function isChaptersCacheValid(): boolean {
    if (!globalCache?.data) return false;
    return Date.now() - globalCache.timestamp < CACHE_DURATION_MS;
}
