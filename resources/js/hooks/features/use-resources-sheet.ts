/**
 * useResourcesSheet Hook
 *
 * Manages resources sheet state and data fetching.
 * Handles resources, similar verses, topics, and resource counts.
 *
 * @example
 * ```typescript
 * const {
 *   resources,
 *   similarVerses,
 *   topics,
 *   resourceCounts,
 *   groupedResources,
 *   loading,
 *   hasMore,
 *   totalResources,
 *   activeSection,
 *   selectedResource,
 *   loadingFullResourceId,
 *   setActiveSection,
 *   handleVerseClick,
 *   handleSeeMore,
 *   getResourceHighlight,
 *   getDomainName,
 *   isVerifiedSource,
 *   formatMatchRange,
 *   refresh,
 * } = useResourcesSheet({
 *   open,
 *   verseId,
 *   chapterNumber,
 *   verseNumber,
 *   initialActiveSection,
 *   onOpenChange,
 * });
 * ```
 */

import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { router } from '@inertiajs/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

interface ResourceType {
    id: number;
    slug: string;
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

interface SimilarVerse {
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

interface Topic {
    topic_id: number;
    name: string;
    arabic_name: string;
}

interface UseResourcesSheetOptions {
    open: boolean;
    verseId: number;
    verseNumber: number;
    chapterNumber?: number;
    initialActiveSection?: string;
    onOpenChange: (open: boolean) => void;
}

interface UseResourcesSheetReturn {
    // Data
    resources: Resource[];
    similarVerses: SimilarVerse[];
    topics: Topic[];
    resourceCounts: Record<string, number>;
    groupedResources: Record<string, Resource[]>;

    // State
    loading: boolean;
    hasMore: boolean;
    totalResources: number;
    activeSection: string | undefined;
    selectedResource: {
        title: string | null;
        url: string | null;
        comment: string;
    } | null;
    loadingFullResourceId: string | number | null;

    // Actions
    setActiveSection: (section: string | undefined) => void;
    handleVerseClick: (chapterNumber: number, verseNumber: number) => void;
    handleSeeMore: (resourceId: string | number) => Promise<void>;
    getDomainName: (url: string) => string;
    isVerifiedSource: (url: string) => boolean;
    formatMatchRange: (range: number[][]) => string;
    refresh: () => Promise<void>;
}

export function useResourcesSheet({
    open,
    verseId,
    verseNumber,
    chapterNumber,
    initialActiveSection,
    onOpenChange,
}: UseResourcesSheetOptions): UseResourcesSheetReturn {
    const queryClient = useQueryClient();
    const [loadingFullResourceId, setLoadingFullResourceId] = useState<
        string | number | null
    >(null);
    const [selectedResource, setSelectedResource] = useState<{
        title: string | null;
        url: string | null;
        comment: string;
    } | null>(null);
    const [activeSection, setActiveSection] = useState<string | undefined>(
        undefined,
    );
    const verseResourcesQuery = useQuery({
        queryKey: queryKeys.verseResourcesSummary(verseId),
        queryFn: () =>
            api.get<{
                data?: Resource[];
                meta?: {
                    total?: number;
                    hasMore?: boolean;
                    counts?: {
                        resource_types?: Record<string, number>;
                    };
                };
                similar_verses?: { data?: SimilarVerse[] };
                topics?: { data?: Topic[] };
            }>(
                `/api/verses/${verseId}/resources?limit=5&include_chapter_resources=0`,
            ),
        enabled: open && verseId > 0,
        staleTime: 2 * 60 * 1000,
    });

    const resources = verseResourcesQuery.data?.data || [];
    const totalResources = verseResourcesQuery.data?.meta?.total || 0;
    const hasMore = Boolean(verseResourcesQuery.data?.meta?.hasMore);
    const resourceCounts =
        verseResourcesQuery.data?.meta?.counts?.resource_types || {};
    const similarVerses = verseResourcesQuery.data?.similar_verses?.data || [];
    const topics = verseResourcesQuery.data?.topics?.data || [];
    const loading = verseResourcesQuery.isLoading;

    // Handle initial active section sync when sheet opens or resources change
    useEffect(() => {
        if (open) {
            if (initialActiveSection) {
                setActiveSection(initialActiveSection);
            } else if (resources.length > 0 && !activeSection) {
                const firstGroup = Object.keys(
                    resources.reduce(
                        (acc, resource) => {
                            const type = resource.resource_type.name;
                            if (!acc[type]) {
                                acc[type] = [];
                            }
                            acc[type].push(resource);
                            return acc;
                        },
                        {} as Record<string, Resource[]>,
                    ),
                )[0];
                if (firstGroup) {
                    setActiveSection(firstGroup);
                }
            }
        }
    }, [open, initialActiveSection, resources, activeSection]);

    // Group resources by type
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

    // Handle verse click - navigate to the verse
    const handleVerseClick = useCallback(
        (chapterNumber: number, verseNumber: number) => {
            router.visit(`/${chapterNumber}/${verseNumber}`, {
                method: 'get',
            });
            onOpenChange(false);
        },
        [onOpenChange],
    );

    // Format match words range for display
    const formatMatchRange = useCallback((range: number[][]): string => {
        if (!range || range.length === 0) return '';
        return range.map((r) => `words ${r[0]}-${r[1]}`).join(', ');
    }, []);

    const getDomainName = useCallback((url: string) => {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch (e) {
            return 'Source';
        }
    }, []);

    const isVerifiedSource = useCallback(
        (url: string) => {
            const domain = getDomainName(url).toLowerCase();
            const verifiedDomains = [
                'islamqa.info',
                'sunnah.com',
                'quran.com',
                'tafsir.net',
                'kingfahdcomplex.gov.sa',
            ];
            return verifiedDomains.includes(domain);
        },
        [getDomainName],
    );

    const handleSeeMore = useCallback(async (resourceId: string | number) => {
        if (resourceId === -1 || resourceId === '-1') {
            setSelectedResource(null);
            setLoadingFullResourceId(null);
            return;
        }

        setLoadingFullResourceId(resourceId);
        try {
            const response = await fetch(`/api/resources/${resourceId}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedResource({
                    title: data.data.title || 'Full Description',
                    url: data.data.url || null,
                    comment: data.data.comment,
                });
            }
        } catch (error) {
            console.error('Failed to fetch full resource:', error);
        } finally {
            setLoadingFullResourceId(null);
        }
    }, []);

    const refresh = useCallback(async () => {
        await queryClient.invalidateQueries({
            queryKey: queryKeys.verseResourcesSummary(verseId),
        });
    }, [queryClient, verseId]);

    return {
        // Data
        resources,
        similarVerses,
        topics,
        resourceCounts,
        groupedResources,

        // State
        loading,
        hasMore,
        totalResources,
        activeSection,
        selectedResource,
        loadingFullResourceId,

        // Actions
        setActiveSection,
        handleVerseClick,
        handleSeeMore,
        getDomainName,
        isVerifiedSource,
        formatMatchRange,
        refresh,
    };
}
