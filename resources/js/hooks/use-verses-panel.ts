import { useAuth } from '@/contexts/auth-context';
import { useReaderSettings } from '@/contexts/reader-settings-context';
import {
    type BookmarkListItem,
    type ChapterSummary,
    type PaginatedVersesResponse,
    type VerseListItem,
} from '@/types/quran';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVersesPanelOptions {
    chapter?: ChapterSummary;
    initialVerses?: PaginatedVersesResponse;
    apiUrl?: string;
    pageSize?: number;
    fromVerse?: number;
    toVerse?: number;
    startFromVerse?: number;
}

interface UseVersesPanelReturn {
    // State
    verses: VerseListItem[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
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
}

export const useVersesPanel = ({
    chapter,
    initialVerses,
    apiUrl = '/api/quran',
    pageSize = 10,
    fromVerse,
    toVerse,
    startFromVerse,
}: UseVersesPanelOptions): UseVersesPanelReturn => {
    const { user } = useAuth();
    const hasScrolledToStartRef = useRef(false);
    const currentChapterIdRef = useRef<number | null>(chapter?.id || null);
    const lastTranslationIdsRef = useRef('');
    const lastStartVerseRef = useRef<number | null>(startFromVerse ?? null);

    // Core state
    const [verses, setVerses] = useState<VerseListItem[]>(
        initialVerses?.data || [],
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialVerses?.has_more ?? true);

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

    const { settings } = useReaderSettings();

    const fetchVerses = useCallback(
        async (pageNum: number, reset = false) => {
            if (!chapter) return;

            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    page: String(pageNum),
                    limit: String(pageSize),
                    edition: selectedEdition,
                });

                if (settings && settings.selectedTranslations && settings.selectedTranslations.length > 0) {
                    settings.selectedTranslations.forEach((id) => {
                        params.append('translations[]', String(id));
                    });
                }

                if (fromVerse && toVerse) {
                    params.set('from', String(fromVerse));
                    params.set('to', String(toVerse));
                }

                const response = await fetch(
                    `${apiUrl}/chapters/${chapter.id}/verses?${params.toString()}`,
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch verses');
                }

                const data = (await response.json()) as PaginatedVersesResponse;

                if (reset) {
                    setVerses(data.data || []);
                } else {
                    setVerses((prev) => [...prev, ...(data.data || [])]);
                }

                setHasMore(data.data?.length === pageSize);
                setPage(pageNum);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'An error occurred',
                );
            } finally {
                setLoading(false);
            }
        },
        [chapter, apiUrl, pageSize, selectedEdition, fromVerse, toVerse, settings.selectedTranslations],
    );

    // Reset state when chapter or translations change
    useEffect(() => {
        if (!chapter) return;

        // Reset if translations or chapter changes
        const currentTranslationIds = settings.selectedTranslations.join(',');
        const startVerseChanged =
            (startFromVerse ?? null) !== lastStartVerseRef.current;
        if (
            chapter.id !== currentChapterIdRef.current ||
            lastTranslationIdsRef.current !== currentTranslationIds ||
            startVerseChanged
        ) {
            currentChapterIdRef.current = chapter.id;
            lastTranslationIdsRef.current = currentTranslationIds;
            lastStartVerseRef.current = startFromVerse ?? null;
            setVerses([]);
            setHasMore(true);
            hasScrolledToStartRef.current = false;

            const initialPage =
                startFromVerse && !fromVerse && !toVerse
                    ? Math.max(1, Math.ceil(startFromVerse / pageSize))
                    : 1;

            setPage(initialPage);
            fetchVerses(initialPage, true);
        }
    }, [
        chapter?.id,
        settings.selectedTranslations,
        initialVerses,
        fetchVerses,
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
    }, [chapter?.id, startFromVerse, verses]);

    // Load user bookmarks if authenticated
    useEffect(() => {
        if (user && chapter) {
            loadUserBookmarks();
        }
    }, [user, chapter, selectedEdition]);

    const loadUserBookmarks = async () => {
        if (!user || !chapter) return;

        try {
            const response = await fetch(
                `/api/bookmarks?chapter_id=${chapter.id}&edition=${selectedEdition}`,
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
    };

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchVerses(page + 1);
        }
    }, [loading, hasMore, page, fetchVerses]);

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
                            chapter_id: chapter?.id,
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
        [user, bookmarkedVerses, chapter, selectedEdition],
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
        fetchVerses(1, true);
    }, [fetchVerses]);

    return {
        // State
        verses,
        loading,
        error,
        hasMore,
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
    };
};
