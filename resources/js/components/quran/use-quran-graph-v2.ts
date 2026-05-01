import type { QuranGraphV2Response } from '@/types/quran-graph';
import { useCallback, useEffect, useState } from 'react';

interface UseQuranGraphV2Options {
    verseId?: number;
    chapterId?: number;
    depth?: number;
    types?: string[];
}

export function useQuranGraphV2({
    verseId,
    chapterId,
    depth = 1,
    types,
}: UseQuranGraphV2Options) {
    const [data, setData] = useState<QuranGraphV2Response | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!verseId && !chapterId) {
            setError('No verseId or chapterId provided');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.set('depth', String(Math.min(depth, 2)));
            if (types && types.length > 0) {
                params.set('types', types.join(','));
            }

            const url = verseId
                ? `/api/quran/graph-v2/verses/${verseId}?${params.toString()}`
                : `/api/quran/graph-v2/chapters/${chapterId}?${params.toString()}`;

            const response = await fetch(url);
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.message || `HTTP ${response.status}`);
            }

            const json = (await response.json()) as QuranGraphV2Response;
            setData(json);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Failed to load graph';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [verseId, chapterId, depth, types]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
