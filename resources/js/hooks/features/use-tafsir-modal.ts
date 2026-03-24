/**
 * useTafsirModal Hook
 *
 * Manages tafsir modal state and data fetching.
 * Handles tafseer books, chapters, verses, and tafsir data.
 *
 * @example
 * ```typescript
 * const {
 *   tafseerBooks,
 *   selectedBookSlug,
 *   tafsirData,
 *   isLoadingBooks,
 *   isLoadingTafsir,
 *   error,
 *   currentVerse,
 *   isTransitioning,
 *   isNavigating,
 *   chapters,
 *   mainVerse,
 *   loadingMainVerse,
 *   setSelectedBookSlug,
 *   setCurrentVerse,
 *   handleNextVerse,
 *   handlePrevVerse,
 *   fetchTafsir,
 *   refresh,
 * } = useTafsirModal({
 *   open,
 *   chapterId,
 *   verseNumber,
 *   totalVerses,
 * });
 * ```
 */

import { useCallback, useEffect, useState } from 'react';

interface TafseerBook {
    id: number;
    name: string;
    slug: string;
    description: string;
}

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: 'Meccan' | 'Medinan';
    verses: number;
}

interface MainVerse {
    id: number;
    chapterId: number;
    chapterNumber?: number;
    verseNumber: number;
    text: string;
    translation?: string;
    audioUrl?: string;
    juzNumber: number;
    pageNumber: number;
}

interface TafsirData {
    tafsirId: number;
    bookName: string;
    bookSlug: string;
    ayahKey: string;
    text: string;
    fromAyah?: string;
    toAyah?: string;
    ayahKeys: string[];
    chapterId: number;
    verseNumber: number;
}

interface CurrentVerse {
    chapterId: number;
    verseNumber: number;
}

interface UseTafsirModalOptions {
    open: boolean;
    chapterId: number;
    verseNumber: number;
    totalVerses?: number;
}

interface UseTafsirModalReturn {
    // Data
    tafseerBooks: TafseerBook[];
    chapters: Chapter[];
    mainVerse: MainVerse | null;
    tafsirData: TafsirData | null;
    previousTafsirData: TafsirData | null;

    // State
    isLoadingBooks: boolean;
    isLoadingTafsir: boolean;
    loadingMainVerse: boolean;
    error: string | null;
    isTransitioning: boolean;
    isNavigating: boolean;

    // Current state
    currentVerse: CurrentVerse;
    selectedBookSlug: string;

    // Actions
    setSelectedBookSlug: (slug: string) => void;
    setCurrentVerse: (verse: CurrentVerse) => void;
    handleNextVerse: () => void;
    handlePrevVerse: () => void;
    handleBookChange: (slug: string) => void;
    fetchTafsir: () => Promise<void>;
    refresh: () => Promise<void>;
}

export function useTafsirModal({
    open,
    chapterId,
    verseNumber,
    totalVerses = 1,
}: UseTafsirModalOptions): UseTafsirModalReturn {
    const [tafseerBooks, setTafseerBooks] = useState<TafseerBook[]>([]);
    const [selectedBookSlug, setSelectedBookSlug] = useState<string>(
        'en-ibn-katheer',
    );
    const [tafsirData, setTafsirData] = useState<TafsirData | null>(null);
    const [previousTafsirData, setPreviousTafsirData] =
        useState<TafsirData | null>(null);
    const [isLoadingBooks, setIsLoadingBooks] = useState(false);
    const [isLoadingTafsir, setIsLoadingTafsir] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentVerse, setCurrentVerse] = useState<CurrentVerse>({
        chapterId,
        verseNumber,
    });
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [mainVerse, setMainVerse] = useState<MainVerse | null>(null);
    const [loadingMainVerse, setLoadingMainVerse] = useState(false);

    // Fetch tafseer books when modal opens
    useEffect(() => {
        if (open && tafseerBooks.length === 0) {
            fetchTafseerBooks();
        }
    }, [open]);

    // Fetch chapters when modal opens
    useEffect(() => {
        if (open && chapters.length === 0) {
            fetchChapters();
        }
    }, [open]);

    // Fetch main verse when chapters are loaded
    useEffect(() => {
        if (open && chapters.length > 0) {
            fetchMainVerse();
        }
    }, [chapters, currentVerse, open]);

    // Fetch tafsir when selected book or verse changes
    useEffect(() => {
        if (open && selectedBookSlug) {
            fetchTafsir();
        }
    }, [selectedBookSlug, currentVerse, open]);

    const fetchTafseerBooks = useCallback(async () => {
        setIsLoadingBooks(true);
        setError(null);
        try {
            const response = await fetch('/api/quran/tafseer-books');
            if (response.ok) {
                const data = await response.json();
                setTafseerBooks(data);
            } else {
                setError('Failed to fetch tafseer books');
            }
        } catch (err) {
            console.error('Failed to fetch tafseer books:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsLoadingBooks(false);
        }
    }, []);

    const fetchChapters = useCallback(async () => {
        try {
            const response = await fetch('/api/quran/chapters');
            if (!response.ok) {
                throw new Error('Failed to load chapters');
            }
            const data = await response.json();
            setChapters(data);
        } catch (err) {
            console.error('Failed to fetch chapters:', err);
        }
    }, []);

    const fetchMainVerse = useCallback(async () => {
        if (!chapters.length) return;

        const chapter = chapters.find((ch) => ch.id === currentVerse.chapterId);
        if (!chapter) return;

        setLoadingMainVerse(true);
        try {
            const params = new URLSearchParams({
                page: '1',
                limit: '1',
                edition: 'en.sahih',
                from: String(currentVerse.verseNumber),
                to: String(currentVerse.verseNumber),
            });

            const response = await fetch(
                `/api/quran/chapters/${chapter.id}/verses?${params.toString()}`,
            );

            if (!response.ok) {
                throw new Error('Failed to load verse');
            }

            const data = await response.json();
            const verse = data.data?.[0];
            if (verse) {
                setMainVerse({
                    ...verse,
                    chapterNumber: chapter.number,
                });
            }
        } catch (err) {
            console.error('Failed to load main verse:', err);
        } finally {
            setLoadingMainVerse(false);
        }
    }, [chapters, currentVerse]);

    const fetchTafsir = useCallback(async () => {
        // Keep previous content visible during loading
        if (tafsirData) {
            setPreviousTafsirData(tafsirData);
        }
        setIsLoadingTafsir(true);
        setIsTransitioning(true);
        setError(null);
        try {
            const response = await fetch(
                `/api/quran/tafsir/${currentVerse.chapterId}/${currentVerse.verseNumber}?tafsir=${selectedBookSlug}`,
            );
            if (response.ok) {
                const data = await response.json();
                setTafsirData(data);
            } else if (response.status === 404) {
                setTafsirData(null);
                setError('No tafsir found for this verse in the selected book.');
            } else {
                setError('Failed to fetch tafsir');
            }
        } catch (err) {
            console.error('Failed to fetch tafsir:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsLoadingTafsir(false);
            setIsTransitioning(false);
            setIsNavigating(false);
        }
    }, [currentVerse, selectedBookSlug, tafsirData]);

    const handleNextVerse = useCallback(() => {
        if (isNavigating || isLoadingTafsir) return;

        // If current tafsir spans multiple verses, jump to the verse after the range
        if (tafsirData?.toAyah) {
            const [, toVerseNum] = tafsirData.toAyah.split(':').map(Number);
            const nextVerse = toVerseNum + 1;
            if (nextVerse <= totalVerses) {
                setIsNavigating(true);
                setCurrentVerse({
                    ...currentVerse,
                    verseNumber: nextVerse,
                });
            }
        } else if (currentVerse.verseNumber + 1 <= totalVerses) {
            setIsNavigating(true);
            setCurrentVerse({
                ...currentVerse,
                verseNumber: currentVerse.verseNumber + 1,
            });
        }
    }, [currentVerse, isNavigating, isLoadingTafsir, tafsirData, totalVerses]);

    const handlePrevVerse = useCallback(() => {
        if (isNavigating || isLoadingTafsir) return;

        // If current tafsir spans multiple verses, jump to the verse before the range
        if (tafsirData?.fromAyah) {
            const [, fromVerseNum] = tafsirData.fromAyah.split(':').map(Number);
            const prevVerse = fromVerseNum - 1;
            if (prevVerse >= 1) {
                setIsNavigating(true);
                setCurrentVerse({
                    ...currentVerse,
                    verseNumber: prevVerse,
                });
            }
        } else if (currentVerse.verseNumber - 1 >= 1) {
            setIsNavigating(true);
            setCurrentVerse({
                ...currentVerse,
                verseNumber: currentVerse.verseNumber - 1,
            });
        }
    }, [currentVerse, isNavigating, isLoadingTafsir, tafsirData]);

    const handleBookChange = useCallback(
        (slug: string) => {
            setSelectedBookSlug(slug);
        },
        [],
    );

    const refresh = useCallback(async () => {
        await fetchTafsir();
    }, [fetchTafsir]);

    return {
        // Data
        tafseerBooks,
        chapters,
        mainVerse,
        tafsirData,
        previousTafsirData,

        // State
        isLoadingBooks,
        isLoadingTafsir,
        loadingMainVerse,
        error,
        isTransitioning,
        isNavigating,

        // Current state
        currentVerse,
        selectedBookSlug,

        // Actions
        setSelectedBookSlug,
        setCurrentVerse,
        handleNextVerse,
        handlePrevVerse,
        handleBookChange,
        fetchTafsir,
        refresh,
    };
}
