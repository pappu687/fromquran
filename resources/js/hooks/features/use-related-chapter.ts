import { api, getErrorMessage } from '@/lib/api-client';
import { BookOpen, FileText, Globe, Scale, Video } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ResourceType {
    id?: number;
    slug?: string | null;
    name: string;
}

interface Resource {
    id: string | number;
    resource_type_id?: number;
    resource_url: string;
    resource_title: string | null;
    comment: string | null;
    is_truncated?: boolean;
    resource_type: ResourceType;
    user: {
        name: string;
    };
    created_at?: string;
}

interface ChapterInfo {
    surah_number: number;
    surah_name: string;
    text: string;
    short_text: string;
}

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: 'Meccan' | 'Medinan';
    verses: number;
    romanName?: string;
}

interface UseRelatedChapterReturn {
    resources: Resource[];
    chapterInfo: ChapterInfo | null;
    chapters: Chapter[];
    groupedResources: Record<string, Resource[]>;
    loadingResources: boolean;
    loadingChapterInfo: boolean;
    loadingFullResourceId: string | number | null;
    error: string | null;
    selectedResource: {
        title: string | null;
        url: string | null;
        comment: string;
    } | null;
    refresh: () => Promise<void>;
    handleSeeMore: (resourceId: string | number) => Promise<void>;
    handleOpenInReader: () => void;
    handleChapterSelect: (chapterId: number) => void;
    getResourceHighlight: (type: string) => {
        color: string;
        bg: string;
        icon: React.ComponentType<{ className?: string }>;
    };
    getDomainName: (url: string) => string;
}

export function useRelatedChapter(
    chapterNumber: number,
): UseRelatedChapterReturn {
    const [resources, setResources] = useState<Resource[]>([]);
    const [chapterInfo, setChapterInfo] = useState<ChapterInfo | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [loadingChapterInfo, setLoadingChapterInfo] = useState(false);
    const [loadingFullResourceId, setLoadingFullResourceId] = useState<
        string | number | null
    >(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedResource, setSelectedResource] = useState<{
        title: string | null;
        url: string | null;
        comment: string;
    } | null>(null);

    const fetchResources = useCallback(async () => {
        setLoadingResources(true);
        try {
            const data = await api.get<{ data: Resource[] }>(
                `/api/quran/chapters/${chapterNumber}/resources`,
            );
            setResources(data.data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoadingResources(false);
        }
    }, [chapterNumber]);

    const fetchChapterInfo = useCallback(async () => {
        setLoadingChapterInfo(true);
        try {
            const data = await api.get<ChapterInfo>(
                `/api/quran/chapters/${chapterNumber}/info`,
            );
            setChapterInfo(data);
        } catch (err) {
            console.error('Failed to fetch chapter info:', err);
        } finally {
            setLoadingChapterInfo(false);
        }
    }, [chapterNumber]);

    const fetchChapters = useCallback(async () => {
        try {
            const data = await api.get<Chapter[]>('/api/quran/chapters');
            setChapters(data);
        } catch (err) {
            console.error('Failed to fetch chapters:', err);
        }
    }, []);

    useEffect(() => {
        fetchChapters();
    }, [fetchChapters]);

    useEffect(() => {
        setError(null);
        void Promise.all([fetchResources(), fetchChapterInfo()]);
    }, [fetchChapterInfo, fetchResources]);

    const refresh = useCallback(async () => {
        await Promise.all([fetchResources(), fetchChapterInfo()]);
    }, [fetchChapterInfo, fetchResources]);

    const handleSeeMore = useCallback(async (resourceId: string | number) => {
        if (resourceId === -1 || resourceId === '-1') {
            setSelectedResource(null);
            setLoadingFullResourceId(null);
            return;
        }

        setLoadingFullResourceId(resourceId);
        try {
            const data = await api.getSingle<{
                id: string | number;
                title: string | null;
                url: string | null;
                comment: string;
            }>(`/api/resources/${resourceId}`);
            setSelectedResource({
                title: data.data.title || 'Full Description',
                url: data.data.url || null,
                comment: data.data.comment,
            });
        } catch (err) {
            console.error('Failed to fetch full resource:', err);
        } finally {
            setLoadingFullResourceId(null);
        }
    }, []);

    const handleOpenInReader = useCallback(() => {
        window.dispatchEvent(
            new CustomEvent('navigate-chapter-reader', {
                detail: { chapterNumber },
            }),
        );
    }, [chapterNumber]);

    const handleChapterSelect = useCallback((chapterId: number) => {
        window.dispatchEvent(
            new CustomEvent('navigate-chapter', {
                detail: { chapterId },
            }),
        );
    }, []);

    const groupedResources = resources.reduce(
        (acc, resource) => {
            const type = resource.resource_type.name;
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(resource);
            return acc;
        },
        {} as Record<string, Resource[]>,
    );

    const getResourceHighlight = useCallback((type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('fatwa')) {
            return {
                color: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-100 dark:bg-amber-900/30',
                icon: Scale,
            };
        }
        if (lowerType.includes('tafsir')) {
            return {
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                icon: BookOpen,
            };
        }
        if (lowerType.includes('video')) {
            return {
                color: 'text-red-600 dark:text-red-400',
                bg: 'bg-red-100 dark:bg-red-900/30',
                icon: Video,
            };
        }
        if (lowerType.includes('article')) {
            return {
                color: 'text-purple-600 dark:text-purple-400',
                bg: 'bg-purple-100 dark:bg-purple-900/30',
                icon: FileText,
            };
        }
        return { color: 'text-primary', bg: 'bg-primary/10', icon: Globe };
    }, []);

    const getDomainName = useCallback((url: string) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'Source';
        }
    }, []);

    return {
        resources,
        chapterInfo,
        chapters,
        groupedResources,
        loadingResources,
        loadingChapterInfo,
        loadingFullResourceId,
        error,
        selectedResource,
        refresh,
        handleSeeMore,
        handleOpenInReader,
        handleChapterSelect,
        getResourceHighlight,
        getDomainName,
    };
}
