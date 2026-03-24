import { api, getErrorMessage } from '@/lib/api-client';
import { useCallback, useEffect, useState } from 'react';
import { BookOpen, FileText, Play, Scale, Video } from 'lucide-react';

export interface ResourceType {
    id: number;
    slug: string;
    name: string;
}

export interface Resource {
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

export interface SimilarVerse {
    id: number;
    verse_key: string;
    verse_number: number;
    chapter_id: number;
    chapter_number: number;
    chapter_name: string;
    chapter_name_roman: string;
    text_uthmani: string;
    translation: string;
    translation_resource: string;
    matched_words_count: number;
    coverage: number;
    score: number;
    match_words_range: number[][];
}

export interface Topic {
    topic_id: number;
    name: string;
    arabic_name: string;
}

export interface MainVerse {
    id: number;
    chapterId: number;
    chapterNumber?: number;
    verseNumber: number;
    text: string;
    translation?: string;
    audioUrl?: string;
    juzNumber: number;
    pageNumber: number;
    hasResources?: boolean;
    resourceCount?: number;
}

export interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: 'Meccan' | 'Medinan';
    verses: number;
}

export interface FullResource {
    id: number;
    title: string | null;
    url: string | null;
    comment: string;
}

interface UseRelatedVerseReturn {
    // Data
    resources: Resource[];
    similarVerses: SimilarVerse[];
    topics: Topic[];
    mainVerse: MainVerse | null;
    chapters: Chapter[];

    // State
    loadingResources: boolean;
    loadingSimilar: boolean;
    loadingTopics: boolean;
    loadingMainVerse: boolean;
    loadingFullResourceId: string | number | null;
    error: string | null;
    selectedResource: {
        title: string | null;
        url: string | null;
        comment: string;
    } | null;

    // Computed
    groupedResources: Record<string, Resource[]>;
    resourcesCount: number;

    // Actions
    refresh: () => Promise<void>;
    handleSeeMore: (resourceId: string | number) => Promise<void>;
    handleVerseNavigate: (targetChapter: number, targetVerse: number) => void;
    handleOpenInReader: () => void;
    handleTopicClick: (topicId: number) => void;
    handleChapterSelect: (chapterId: number) => void;
    formatMatchRange: (range: number[][]) => string;
    getResourceHighlight: (type: string) => {
        color: string;
        bg: string;
        icon: React.ComponentType<{ className?: string }>;
    };
    getDomainName: (url: string) => string;
}

/**
 * Hook for managing related verse page state and data fetching
 * 
 * Features:
 * - Fetches resources, similar verses, and topics for a given verse
 * - Manages main verse data for display
 * - Provides grouped resources by type
 * - Handles resource detail loading
 * - Navigation helpers for verse and topic navigation
 * 
 * @param verseId - The ID of the verse to fetch related data for
 * @param chapterNumber - The chapter number for navigation
 * @param verseNumber - The verse number for navigation
 * 
 * @example
 * ```tsx
 * const { 
 *   resources, similarVerses, topics, mainVerse,
 *   loadingResources, groupedResources, handleSeeMore 
 * } = useRelatedVerse(verseId, chapterNumber, verseNumber);
 * 
 * return (
 *   <div>
 *     <VerseCard verse={mainVerse} />
 *     {Object.entries(groupedResources).map(([type, items]) => (
 *       <ResourceGroup key={type} type={type} resources={items} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useRelatedVerse(
    verseId: number,
    chapterNumber: number,
    verseNumber: number,
): UseRelatedVerseReturn {
    const [resources, setResources] = useState<Resource[]>([]);
    const [similarVerses, setSimilarVerses] = useState<SimilarVerse[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [mainVerse, setMainVerse] = useState<MainVerse | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);

    const [loadingResources, setLoadingResources] = useState(false);
    const [loadingSimilar, setLoadingSimilar] = useState(false);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [loadingMainVerse, setLoadingMainVerse] = useState(false);
    const [loadingFullResourceId, setLoadingFullResourceId] = useState<
        string | number | null
    >(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedResource, setSelectedResource] = useState<{
        title: string | null;
        url: string | null;
        comment: string;
    } | null>(null);

    // Fetch chapters
    const fetchChapters = useCallback(async () => {
        try {
            const data = await api.get<Chapter[]>('/api/quran/chapters');
            setChapters(data);
        } catch (err) {
            console.error('Failed to fetch chapters:', err);
        }
    }, []);

    // Fetch main verse
    const fetchMainVerse = useCallback(async () => {
        if (!chapters.length) return;

        const chapter = chapters.find((ch) => ch.number === chapterNumber);
        if (!chapter) return;

        setLoadingMainVerse(true);
        try {
            const params = new URLSearchParams({
                page: '1',
                limit: '1',
                edition: 'en.sahih',
                from: String(verseNumber),
                to: String(verseNumber),
            });

            const data = await api.get<{ data?: MainVerse[] }>(
                `/api/quran/chapters/${chapter.id}/verses?${params.toString()}`,
            );

            const verse = data.data?.[0];
            if (verse) {
                setMainVerse({
                    ...verse,
                    chapterNumber,
                });
            }
        } catch (err) {
            console.error('Failed to load main verse:', err);
        } finally {
            setLoadingMainVerse(false);
        }
    }, [chapters, chapterNumber, verseNumber]);

    // Fetch resources
    const fetchResources = useCallback(async () => {
        setLoadingResources(true);
        try {
            const data = await api.get<{ data: Resource[] }>(
                `/api/verses/${verseId}/resources?limit=1000`,
            );
            setResources(data.data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoadingResources(false);
        }
    }, [verseId]);

    // Fetch similar verses
    const fetchSimilarVerses = useCallback(async () => {
        setLoadingSimilar(true);
        try {
            const data = await api.get<{ data: SimilarVerse[] }>(
                `/api/verses/${verseId}/similar`,
            );
            setSimilarVerses(data.data || []);
        } catch (err) {
            console.error('Failed to fetch similar verses:', err);
        } finally {
            setLoadingSimilar(false);
        }
    }, [verseId]);

    // Fetch topics
    const fetchTopics = useCallback(async () => {
        setLoadingTopics(true);
        try {
            const data = await api.get<{ data: Topic[] }>(
                `/api/verses/${verseId}/topics`,
            );
            setTopics(data.data || []);
        } catch (err) {
            console.error('Failed to fetch topics:', err);
        } finally {
            setLoadingTopics(false);
        }
    }, [verseId]);

    // Initial load
    useEffect(() => {
        fetchChapters();
    }, [fetchChapters]);

    useEffect(() => {
        if (chapters.length) {
            fetchMainVerse();
        }
    }, [chapters, fetchMainVerse]);

    useEffect(() => {
        const fetchAll = async () => {
            setError(null);
            await Promise.all([
                fetchResources(),
                fetchSimilarVerses(),
                fetchTopics(),
            ]);
        };

        fetchAll();
    }, [verseId, fetchResources, fetchSimilarVerses, fetchTopics]);

    const refresh = useCallback(async () => {
        await Promise.all([
            fetchResources(),
            fetchSimilarVerses(),
            fetchTopics(),
        ]);
    }, [fetchResources, fetchSimilarVerses, fetchTopics]);

    const handleSeeMore = async (resourceId: string | number) => {
        if (resourceId === -1 || resourceId === '-1') {
            setSelectedResource(null);
            setLoadingFullResourceId(null);
            return;
        }

        setLoadingFullResourceId(resourceId);
        try {
            const data = await api.getSingle<FullResource>(
                `/api/resources/${resourceId}`,
            );
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
    };

    const handleVerseNavigate = useCallback(
        (targetChapter: number, targetVerse: number) => {
            window.dispatchEvent(
                new CustomEvent('navigate-related', {
                    detail: { chapterNumber: targetChapter, verseNumber: targetVerse },
                }),
            );
        },
        [],
    );

    const handleOpenInReader = useCallback(() => {
        window.dispatchEvent(
            new CustomEvent('navigate-reader', {
                detail: { chapterNumber, verseNumber },
            }),
        );
    }, [chapterNumber, verseNumber]);

    const handleTopicClick = useCallback((topicId: number) => {
        window.dispatchEvent(
            new CustomEvent('navigate-topic', {
                detail: { topicId },
            }),
        );
    }, []);

    const handleChapterSelect = useCallback((chapterId: number) => {
        window.dispatchEvent(
            new CustomEvent('navigate-chapter', {
                detail: { chapterId },
            }),
        );
    }, []);

    const formatMatchRange = (range: number[][]): string => {
        if (!range || range.length === 0) return '';
        return range.map((r) => `words ${r[0]}-${r[1]}`).join(', ');
    };

    const groupedResources = resources.reduce(
        (acc, resource) => {
            const type = resource.resource_type?.name ?? 'Other';
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(resource);
            return acc;
        },
        {} as Record<string, Resource[]>,
    );

    const getResourceHighlight = (type: string) => {
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
        if (lowerType.includes('audio')) {
            return {
                color: 'text-blue-600 dark:text-blue-400',
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                icon: Play,
            };
        }
        return { color: 'text-primary', bg: 'bg-primary/10', icon: FileText };
    };

    const getDomainName = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch {
            return 'Source';
        }
    };

    return {
        // Data
        resources,
        similarVerses,
        topics,
        mainVerse,
        chapters,

        // State
        loadingResources,
        loadingSimilar,
        loadingTopics,
        loadingMainVerse,
        loadingFullResourceId,
        error,
        selectedResource,

        // Computed
        groupedResources,
        resourcesCount: resources.length,

        // Actions
        refresh,
        handleSeeMore,
        handleVerseNavigate,
        handleOpenInReader,
        handleTopicClick,
        handleChapterSelect,
        formatMatchRange,
        getResourceHighlight,
        getDomainName,
    };
}
