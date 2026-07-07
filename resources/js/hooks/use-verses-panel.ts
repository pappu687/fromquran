import { useAuth } from '@/contexts/auth-context';
import { useReaderSettings } from '@/contexts/reader-settings-context';
import {
    type BookmarkListItem,
    type ChapterSummary,
    type PaginatedVersesResponse,
    type VerseListItem,
} from '@/types/quran';
import { useCallback, useEffect, useRef, useState } from 'react';

interface VersesRequestOptions {
    chapterId: number;
    apiUrl: string;
    pageNum: number;
    pageSize: number;
    selectedEdition: string;
    translationIds: number[];
    fromVerse?: number;
    toVerse?: number;
}

const versesPageCache = new Map<string, PaginatedVersesResponse>();
const pendingVersesRequests = new Map<string, Promise<PaginatedVersesResponse>>();

const buildVersesRequestKey = ({
    chapterId,
    apiUrl,
    pageNum,
    pageSize,
    selectedEdition,
    translationIds,
    fromVerse,
    toVerse,
}: VersesRequestOptions) =>
    [
        apiUrl,
        chapterId,
        pageNum,
        pageSize,
        selectedEdition,
        translationIds.join(','),
        fromVerse ?? '',
        toVerse ?? '',
    ].join('|');

const requestVersesPage = async (
    options: VersesRequestOptions,
): Promise<PaginatedVersesResponse> => {
    const cacheKey = buildVersesRequestKey(options);
    const cachedResponse = versesPageCache.get(cacheKey);
    if (cachedResponse) {
        return cachedResponse;
    }

    const pendingResponse = pendingVersesRequests.get(cacheKey);
    if (pendingResponse) {
        return pendingResponse;
    }

    const requestPromise = (async () => {
        const params = new URLSearchParams({
            page: String(options.pageNum),
            limit: String(options.pageSize),
            edition: options.selectedEdition,
        });

        options.translationIds.forEach((id) => {
            params.append('translations[]', String(id));
        });

        if (options.fromVerse && options.toVerse) {
            params.set('from', String(options.fromVerse));
            params.set('to', String(options.toVerse));
        }

        const response = await fetch(
            `${options.apiUrl}/chapters/${options.chapterId}/verses?${params.toString()}`,
        );

        if (!response.ok) {
            throw new Error('Failed to fetch verses');
        }

        const data = (await response.json()) as PaginatedVersesResponse;
        versesPageCache.set(cacheKey, data);
        return data;
    })();

    pendingVersesRequests.set(cacheKey, requestPromise);

    try {
        return await requestPromise;
    } finally {
        pendingVersesRequests.delete(cacheKey);
    }
};

export const prefetchVersesPage = (options: VersesRequestOptions) => {
    void requestVersesPage(options).catch(() => undefined);
};

interface UseVersesPanelOptions {
    chapter?: ChapterSummary;
    initialVerses?: PaginatedVersesResponse;
    apiUrl?: string;
    pageSize?: number;
    fromVerse?: number;
    toVerse?: number;
    startFromVerse?: number;
    chapters?: ChapterSummary[];
    onChapterChange?: (chapter: ChapterSummary) => void;
}

interface UseVersesPanelReturn {
    // State
    verses: VerseListItem[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    activeChapter: ChapterSummary | undefined;
    autoAdvancedChapterId: number | null;
    bookmarkedVerses: Set<string>;
    isAutoScroll: boolean;
    selectedEdition: string;
    showSearch: boolean;
    showLoginAlert: boolean;
    showErrorAlert: boolean;
    errorAlertMessage: string;
    showSuccessAlert: boolean;
    successAlertMessage: string;

    // Actions
    loadMore: () => void;
    handleBookmarkToggle: (verse: VerseListItem) => void;
    handleCopy: (verseId: number, text: string) => Promise<void>;
    handlePlayAudio: (audioUrl: string) => void;
    toggleAutoScroll: () => void;
    setShowLoginAlert: (show: boolean) => void;
    setShowErrorAlert: (show: boolean) => void;
    setShowSuccessAlert: (show: boolean) => void;
    setSelectedEdition: (edition: string) => void;
    setShowSearch: (show: boolean) => void;
    retry: () => void;
    clearAutoAdvanceChapter: () => void;
    hasNextChapter: boolean;
    goToNextChapter: () => void;
}

export const useVersesPanel = ({
    chapter,
    initialVerses,
    apiUrl = '/api/quran',
    pageSize = 10,
    fromVerse,
    toVerse,
    startFromVerse,
    chapters,
    onChapterChange,
}: UseVersesPanelOptions): UseVersesPanelReturn => {
    const { user } = useAuth();
    const hasScrolledToStartRef = useRef(false);
    const currentChapterIdRef = useRef<number | null>(chapter?.id || null);
    const lastStartVerseRef = useRef<number | null>(startFromVerse ?? null);
    const isInternalChangeRef = useRef(false);

    const { settings } = useReaderSettings();
    const lastTranslationIdsRef = useRef(settings.selectedTranslations.join(','));
    // Keep a stable ref so fetchVerses can read the latest translations
    // without needing them as a useCallback dependency.
    // Updated synchronously during render so the reset effect always reads
    // the latest value without itself depending on the array.
    const selectedTranslationsRef = useRef(settings.selectedTranslations);
    selectedTranslationsRef.current = settings.selectedTranslations;
    // A stable primitive we CAN safely include in useEffect deps instead of
    // the array (which gets a new reference every render).
    const translationIds = settings.selectedTranslations.join(',');

    // Core state
    const [verses, setVerses] = useState<VerseListItem[]>(
        initialVerses?.data || [],
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [chapterHasMore, setChapterHasMore] = useState(
        initialVerses?.has_more ?? true,
    );
    const [hasMore, setHasMore] = useState(initialVerses?.has_more ?? true);
    const [activeChapter, setActiveChapter] = useState(chapter);
    const [autoAdvancedChapterId, setAutoAdvancedChapterId] = useState<
        number | null
    >(null);

    // User interaction state
    const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(
        new Set(),
    );
    const [isAutoScroll, setIsAutoScroll] = useState(false);
    const [selectedEdition, setSelectedEdition] = useState('en.sahih');
    const [showSearch, setShowSearch] = useState(false);

    // Alert state
    const [showLoginAlert, setShowLoginAlert] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [errorAlertMessage, setErrorAlertMessage] = useState('');
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [successAlertMessage, setSuccessAlertMessage] = useState('');

    const fetchVerses = useCallback(
        async (
            targetChapter: ChapterSummary,
            pageNum: number,
            reset = false,
        ) => {
            setLoading(true);
            setError(null);

            try {
                const currentTranslations = selectedTranslationsRef.current;
                const shouldPassRange =
                    fromVerse &&
                    toVerse &&
                    targetChapter.id === chapter?.id;

                const data = await requestVersesPage({
                    chapterId: targetChapter.id,
                    apiUrl,
                    pageNum,
                    pageSize,
                    selectedEdition,
                    translationIds: currentTranslations,
                    fromVerse: shouldPassRange ? fromVerse : undefined,
                    toVerse: shouldPassRange ? toVerse : undefined,
                });

                if (reset) {
                    setVerses(data.data || []);
                } else {
                    setVerses((prev) => [...prev, ...(data.data || [])]);
                }

                const hasMorePages = data.data?.length === pageSize;
                setChapterHasMore(hasMorePages);
                setHasMore(hasMorePages);
                setPage(pageNum);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'An error occurred',
                );
            } finally {
                setLoading(false);
            }
        },
        [chapter?.id, apiUrl, pageSize, selectedEdition, fromVerse, toVerse],
    );

    // Store fetchVerses in a ref so the reset effect can call the latest
    // version without including it in the dep array (which would add an
    // extra scheduling cycle every time chapter changes).
    const fetchVersesRef = useRef(fetchVerses);
    fetchVersesRef.current = fetchVerses;

    // Reset state when chapter or translations change
    useEffect(() => {
        if (!chapter) return;

        // Reset if translations or chapter changes
        const currentTranslationIds = selectedTranslationsRef.current.join(',');
        const startVerseChanged =
            (startFromVerse ?? null) !== lastStartVerseRef.current;
        if (
            chapter.id !== currentChapterIdRef.current ||
            lastTranslationIdsRef.current !== currentTranslationIds ||
            startVerseChanged
        ) {
            if (isInternalChangeRef.current) {
                // This is our own internal chapter advance being reflected back
                // through the prop. Clear the flag so future external changes
                // still trigger a reset, and always start from page 1.
                isInternalChangeRef.current = false;
                currentChapterIdRef.current = chapter.id;
                lastTranslationIdsRef.current = currentTranslationIds;
                lastStartVerseRef.current = null;
                setActiveChapter(chapter);
                setVerses([]);
                setChapterHasMore(true);
                setHasMore(true);
                hasScrolledToStartRef.current = false;
                setPage(1);
                fetchVersesRef.current(chapter, 1, true);
            } else {
                setAutoAdvancedChapterId(null);
                currentChapterIdRef.current = chapter.id;
                lastTranslationIdsRef.current = currentTranslationIds;
                lastStartVerseRef.current = startFromVerse ?? null;
                setActiveChapter(chapter);
                setVerses([]);
                setChapterHasMore(true);
                setHasMore(true);
                hasScrolledToStartRef.current = false;

                const initialPage =
                    startFromVerse && !fromVerse && !toVerse
                        ? Math.max(1, Math.ceil(startFromVerse / pageSize))
                        : 1;

                setPage(initialPage);
                fetchVersesRef.current(chapter, initialPage, true);
            }
        }
    }, [
        chapter,
        chapter?.id,
        translationIds,
        startFromVerse,
        fromVerse,
        toVerse,
        pageSize,
    ]);

    // Auto-scroll to the requested start verse
    useEffect(() => {
        if (
            !chapter ||
            !startFromVerse ||
            verses.length === 0 ||
            hasScrolledToStartRef.current
        ) {
            return;
        }

        const el = document.getElementById(
            `verse-${chapter.id}-${startFromVerse}`,
        );

        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            hasScrolledToStartRef.current = true;
        }
    }, [chapter, chapter?.id, startFromVerse, verses]);

    const loadUserBookmarks = useCallback(async () => {
        if (!user || !activeChapter) return;

        try {
            const response = await fetch(
                `/api/bookmarks?chapter_id=${activeChapter.id}&edition=${selectedEdition}`,
            );

            if (response.ok) {
                const data = (await response.json()) as {
                    data: BookmarkListItem[];
                };
                const bookmarkedIds = new Set<string>(
                    data.data.map((bookmark) => String(bookmark.verse_id)),
                );
                setBookmarkedVerses(bookmarkedIds);
            }
        } catch (err) {
            console.error('Failed to load bookmarks:', err);
        }
    }, [user, activeChapter, selectedEdition]);

    // Load user bookmarks if authenticated
    useEffect(() => {
        if (user && activeChapter) {
            loadUserBookmarks();
        }
    }, [user, activeChapter, selectedEdition, loadUserBookmarks]);

    const hasNextChapter = activeChapter ? activeChapter.number < 114 : false;

    const goToNextChapter = useCallback(() => {
        if (chapters && chapters.length > 0 && activeChapter) {
            const nextChapter = chapters.find(
                (c) => c.number === activeChapter.number + 1,
            );
            if (nextChapter && nextChapter.number <= 114) {
                isInternalChangeRef.current = true;
                setAutoAdvancedChapterId(nextChapter.id);
                setActiveChapter(nextChapter);
                setPage(1);
                setChapterHasMore(true);
                setHasMore(true);
                onChapterChange?.(nextChapter);
                fetchVerses(nextChapter, 1);
            }
        }
    }, [activeChapter, chapters, fetchVerses, onChapterChange]);

    const loadMore = useCallback(() => {
        if (loading || !activeChapter) {
            return;
        }

        if (chapterHasMore) {
            fetchVerses(activeChapter, page + 1);
        }
    }, [
        loading,
        chapterHasMore,
        activeChapter,
        page,
        fetchVerses,
    ]);

    const handleBookmarkToggle = useCallback(
        async (verse: VerseListItem) => {
            if (!user) {
                setShowLoginAlert(true);
                return;
            }

            const verseId = verse.id.toString();
            const isCurrentlyBookmarked = bookmarkedVerses.has(verseId);

            // Get CSRF token
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            try {
                if (isCurrentlyBookmarked) {
                    // Remove bookmark
                    const checkResponse = await fetch(
                        `/api/bookmarks/check?verse_id=${verseId}&edition=${selectedEdition}`,
                        {
                            headers: {
                                Accept: 'application/json',
                                'X-CSRF-TOKEN': csrfToken || '',
                            },
                        },
                    );

                    if (!checkResponse.ok) {
                        throw new Error('Failed to check bookmark status');
                    }

                    const checkData = await checkResponse.json();

                    if (checkData.bookmark) {
                        const deleteResponse = await fetch(
                            `/api/bookmarks/${checkData.bookmark.id}`,
                            {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Accept: 'application/json',
                                    'X-CSRF-TOKEN': csrfToken || '',
                                },
                            },
                        );

                        if (!deleteResponse.ok) {
                            throw new Error('Failed to remove bookmark');
                        }

                        setBookmarkedVerses((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(verseId);
                            return newSet;
                        });

                        setSuccessAlertMessage('Bookmark removed successfully');
                        setShowSuccessAlert(true);
                    }
                } else {
                    // Add bookmark
                    const addResponse = await fetch('/api/bookmarks', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-CSRF-TOKEN': csrfToken || '',
                        },
                        body: JSON.stringify({
                            chapter_id: activeChapter?.id,
                            verse_number: verse.verseNumber,
                            verse_id: verseId,
                            edition: selectedEdition,
                        }),
                    });

                    if (!addResponse.ok) {
                        const errorData = await addResponse.json();
                        throw new Error(
                            errorData.message || 'Failed to add bookmark',
                        );
                    }

                    setBookmarkedVerses((prev) => {
                        const newSet = new Set(prev);
                        newSet.add(verseId);
                        return newSet;
                    });

                    setSuccessAlertMessage('Added to bookmark successfully');
                    setShowSuccessAlert(true);
                }
            } catch (err) {
                console.error('Failed to toggle bookmark:', err);
                setErrorAlertMessage(
                    err instanceof Error
                        ? err.message
                        : 'Failed to update bookmark. Please try again.',
                );
                setShowErrorAlert(true);
            }
        },
        [user, bookmarkedVerses, activeChapter, selectedEdition],
    );

    const handleCopy = useCallback(async (verseId: number, text: string) => {
        await navigator.clipboard.writeText(text);
    }, []);

    const handlePlayAudio = useCallback((audioUrl: string) => {
        const audio = new Audio(audioUrl);
        audio.play().catch(console.error);
    }, []);

    const toggleAutoScroll = useCallback(() => {
        setIsAutoScroll((prev) => !prev);
    }, []);

    const retry = useCallback(() => {
        if (!activeChapter) return;
        fetchVerses(activeChapter, 1, true);
    }, [activeChapter, fetchVerses]);

    const clearAutoAdvanceChapter = useCallback(() => {
        setAutoAdvancedChapterId(null);
    }, []);

    return {
        // State
        verses,
        loading,
        error,
        hasMore,
        activeChapter,
        autoAdvancedChapterId,
        bookmarkedVerses,
        isAutoScroll,
        selectedEdition,
        showSearch,
        showLoginAlert,
        showErrorAlert,
        errorAlertMessage,
        showSuccessAlert,
        successAlertMessage,

        // Actions
        loadMore,
        handleBookmarkToggle,
        handleCopy,
        handlePlayAudio,
        toggleAutoScroll,
        setShowLoginAlert,
        setShowErrorAlert,
        setShowSuccessAlert,
        setSelectedEdition,
        setShowSearch,
        retry,
        clearAutoAdvanceChapter,
        hasNextChapter,
        goToNextChapter,
    };
};
