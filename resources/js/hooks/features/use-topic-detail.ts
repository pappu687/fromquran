import { useChapters } from '@/hooks';
import { api, getErrorMessage } from '@/lib/api-client';
import { type ChapterSummary } from '@/types/quran';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

export interface TopicVerse {
    id: number;
    verse_key: string;
    verse_number: number;
    chapter_id: number;
    chapter_number: number;
    chapter_name: string;
    chapter_name_roman: string;
    text_uthmani: string;
    translation: string;
}

export interface TopicParent {
    topic_id: number;
    name: string;
}

export interface TopicChild {
    topic_id: number;
    name: string;
}

export interface Topic {
    topic_id: number;
    name: string;
    arabic_name: string;
    description: string;
    wiki_link: string;
    ayahs: string;
    related_topics: string;
    parent: TopicParent | null;
    children: TopicChild[];
}

export interface RelatedTopic {
    topic_id: number;
    name: string;
    arabic_name: string;
}

export interface TopicDetailResponse {
    topic: Topic;
    related_topics?: RelatedTopic[];
    verses: {
        data: TopicVerse[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface PaginationState {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface UseTopicDetailReturn {
    // Data
    topic: Topic | null;
    verses: TopicVerse[];
    relatedTopics: RelatedTopic[];
    chapters: ChapterSummary[];

    // State
    loading: boolean;
    loadingVerses: boolean;
    error: string | null;
    pagination: PaginationState;
    currentPage: number;

    // Actions
    refreshTopic: () => Promise<void>;
    handlePageChange: (newPage: number) => void;
    handleTopicClick: (topicId: number) => void;
    handleVerseClick: (chapterNumber: number, verseNumber: number) => void;
    handleChapterSelect: (chapterId: number) => void;
    getVisiblePages: () => number[];
}

/**
 * Hook for managing topic detail page state and data fetching
 *
 * Features:
 * - Fetches topic data with related topics and verses
 * - Handles pagination for verses
 * - Provides navigation handlers
 * - Includes chapter data for sidebar
 *
 * @param topicId - The ID of the topic to fetch
 * @param versesPerPage - Number of verses per page (default: 10)
 *
 * @example
 * ```tsx
 * const {
 *   topic, verses, relatedTopics,
 *   loading, pagination, handlePageChange
 * } = useTopicDetail(topicId);
 *
 * if (loading) return <LoadingSkeleton />;
 * if (!topic) return <NotFound />;
 *
 * return (
 *   <div>
 *     <h1>{topic.name}</h1>
 *     {verses.map(verse => <VerseCard key={verse.id} verse={verse} />)}
 *     <Pagination currentPage={pagination.current_page} onChange={handlePageChange} />
 *   </div>
 * );
 * ```
 */
export function useTopicDetail(
    topicId: number,
    versesPerPage = 10,
): UseTopicDetailReturn {
    const [topic, setTopic] = useState<Topic | null>(null);
    const [verses, setVerses] = useState<TopicVerse[]>([]);
    const [relatedTopics, setRelatedTopics] = useState<RelatedTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingVerses, setLoadingVerses] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationState>({
        current_page: 1,
        last_page: 1,
        per_page: versesPerPage,
        total: 0,
    });
    const { chapters } = useChapters();

    const fetchTopicData = useCallback(
        async (pageNum: number = 1, isInitialLoad = false) => {
            if (!isInitialLoad) {
                setLoadingVerses(true);
            } else {
                setLoading(true);
            }

            setError(null);

            try {
                const response = await api.get<TopicDetailResponse>(
                    `/api/topics/${topicId}?page=${pageNum}`,
                );

                if (isInitialLoad) {
                    setTopic(response.topic);
                    setRelatedTopics(response.related_topics || []);
                }

                setVerses(response.verses.data || []);
                setPagination({
                    current_page: response.verses.current_page,
                    last_page: response.verses.last_page,
                    per_page: response.verses.per_page,
                    total: response.verses.total,
                });
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
                setLoadingVerses(false);
            }
        },
        [topicId],
    );

    useEffect(() => {
        fetchTopicData(1, true);
    }, [fetchTopicData, topicId]);

    const refreshTopic = useCallback(async () => {
        await fetchTopicData(1, true);
    }, [fetchTopicData]);

    const handlePageChange = useCallback(
        (newPage: number) => {
            if (newPage >= 1 && newPage <= pagination.last_page) {
                fetchTopicData(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
        [fetchTopicData, pagination.last_page],
    );

    const handleTopicClick = useCallback((clickedTopicId: number) => {
        router.visit(`/topic/${clickedTopicId}`);
    }, []);

    const handleVerseClick = useCallback(
        (chapterNumber: number, verseNumber: number) => {
            router.visit(`/${chapterNumber}/${verseNumber}`);
        },
        [],
    );

    const handleChapterSelect = useCallback(
        (chapterId: number) => {
            const chapter = chapters.find((item) => item.id === chapterId);
            if (!chapter) {
                return;
            }

            router.visit(`/${chapter.number}`);
        },
        [chapters],
    );

    const getVisiblePages = useCallback(() => {
        const maxVisiblePages = 5;
        const { last_page, current_page } = pagination;

        if (last_page <= maxVisiblePages) {
            return Array.from({ length: last_page }, (_, i) => i + 1);
        }

        if (current_page <= 3) {
            return [1, 2, 3, 4, last_page];
        }

        if (current_page >= last_page - 2) {
            return [1, last_page - 3, last_page - 2, last_page - 1, last_page];
        }

        return [1, current_page - 1, current_page, current_page + 1, last_page];
    }, [pagination]);

    return {
        // Data
        topic,
        verses,
        relatedTopics,
        chapters,

        // State
        loading,
        loadingVerses,
        error,
        pagination,
        currentPage: pagination.current_page,

        // Actions
        refreshTopic,
        handlePageChange,
        handleTopicClick,
        handleVerseClick,
        handleChapterSelect,
        getVisiblePages,
    };
}
