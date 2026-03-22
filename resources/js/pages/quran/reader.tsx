import { VersesPanel } from '@/components/quran/verses-panel';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import { type ChapterSummary, type PaginatedVersesResponse } from '@/types/quran';
import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

interface QuranReaderProps {
    chapterNumber?: number;
    fromVerse?: number | null;
    toVerse?: number | null;
    chapter?: ChapterSummary; // Chapter provided by SSR
    chapters?: ChapterSummary[]; // Chapters provided by SSR for sidebar
    initialVerses?: PaginatedVersesResponse;
}

export default function QuranReader({
    chapterNumber,
    fromVerse,
    toVerse,
    chapter: initialChapter,
    chapters: initialChapters,
    initialVerses,
}: QuranReaderProps) {
    const [chapters, setChapters] = useState<ChapterSummary[]>(
        initialChapters ?? [],
    );
    const [selectedChapter, setSelectedChapter] = useState<
        ChapterSummary | undefined
    >(
        initialChapter,
    );
    const [loading, setLoading] = useState(!initialChapter);
    const [error, setError] = useState<string | null>(null);
    const [currentAyah, setCurrentAyah] = useState(fromVerse ?? 1);
    const [jumpToAyah, setJumpToAyah] = useState<
        ((ayahNumber: number) => Promise<boolean>) | undefined
    >(undefined);

    // Dynamic Title and Description for SEO
    // Use romanName (e.g. At-Tawbah) if available, otherwise fallback to englishName (e.g. The Repentance)
    const displayName =
        selectedChapter?.romanName || selectedChapter?.englishName || '';

    let pageTitle: string;
    let pageDescription: string;

    if (selectedChapter && fromVerse != null && toVerse != null) {
        const versePart =
            fromVerse === toVerse ? `${fromVerse}` : `${fromVerse}-${toVerse}`;
        pageTitle = `Quran ${selectedChapter.number}:${versePart}`;
        pageDescription = `Read Quran ${selectedChapter.number}:${versePart} from Surah ${displayName || selectedChapter.name} with translation and related tools on From Quran.`;
    } else if (selectedChapter) {
        pageTitle = `Surah ${displayName} (${selectedChapter.number})`;
        pageDescription = `Read Surah ${displayName} (${selectedChapter.name}) with translation. This chapter has ${selectedChapter.verses} verses and was revealed in ${selectedChapter.revelationType}.`;
    } else {
        pageTitle = 'Quran Reader';
        pageDescription =
            'Read the Holy Quran with translations and research tools.';
    }

    // Optional start-verse query param to continue reading from a specific verse
    const page = usePage<{ appUrl?: string; siteName?: string }>();
    const url = page.url;
    const searchParams = new URLSearchParams(url.split('?')[1] ?? '');
    const startVerseParam = searchParams.get('start-verse');
    const startFromVerse = startVerseParam
        ? Number(startVerseParam) || undefined
        : undefined;

    const appUrl =
        (page.props.appUrl as string | undefined) ?? 'https://fromquran.com';
    const siteName =
        (page.props.siteName as string | undefined) ??
        'From Quran - Explore everything stemming from Quran.';
    const baseUrl = appUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    const canonicalUrl = `${baseUrl}${path}`;
    const ogImage = `${baseUrl}/og-banner.png`;
    const fullTitle = `${pageTitle} | From Quran`;

    useEffect(() => {
        // If chapters were provided by the server, use them and avoid a client refetch
        if (initialChapters && initialChapters.length) {
            if (!initialChapter) {
                setLoading(false);
            }
            return;
        }

        // Fallback: fetch chapters from API (needed for the dropdown/sidebar)
        const fetchChapters = async () => {
            try {
                const response = await fetch('/api/quran/chapters');
                const data = (await response.json()) as ChapterSummary[];
                setChapters(data);
                if (!initialChapter) {
                    setLoading(false);
                }
            } catch {
                if (!initialChapter) {
                    setError('Failed to load chapters');
                    setLoading(false);
                }
            }
        };

        fetchChapters();
    }, [initialChapter, initialChapters]);

    // Sync selected chapter with server-provided chapterNumber prop (for navigation)
    useEffect(() => {
        if (!chapters.length) return;

        if (chapterNumber) {
            const byNumber = chapters.find((ch) => ch.number === chapterNumber);
            const byId = chapters.find((ch) => ch.id === chapterNumber);
            setSelectedChapter(byNumber ?? byId ?? chapters[0]);
        } else if (!selectedChapter) {
            setSelectedChapter(chapters[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chapters, chapterNumber]);

    useEffect(() => {
        setCurrentAyah(fromVerse ?? 1);
    }, [chapterNumber, fromVerse, toVerse]);

    const handleChapterSelect = (chapterId: number) => {
        const chapter = chapters.find((ch) => ch.id === chapterId);
        if (!chapter) return;

        // Update local state immediately for instant feedback
        setSelectedChapter(chapter);

        // Inertia visit with preserved state, so the sidebar
        // and other local UI state don't remount between chapters.
        // Server props still update (/{chapterNumber} never sets
        // fromVerse/toVerse, so they become undefined when navigating
        // away from a range like /49/7).
        router.visit(`/${chapter.number}`, {
            preserveScroll: false,
            preserveState: true,
        });
    };

    const handleJumpHandlerChange = useCallback(
        (handler: ((ayahNumber: number) => Promise<boolean>) | undefined) => {
            setJumpToAyah(() => handler);
        },
        [],
    );

    if (loading && !selectedChapter) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground">
                        Loading Quran Reader...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>{fullTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta property="og:title" content={fullTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta
                    property="og:type"
                    content={fromVerse != null ? 'article' : 'article'}
                />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:site_name" content={siteName} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={fullTitle} />
                <meta name="twitter:description" content={pageDescription} />
                <meta name="twitter:image" content={ogImage} />
            </Head>
            {error && !selectedChapter ? (
                <div className="flex h-screen items-center justify-center">
                    <div className="text-center">
                        <p className="mb-4 text-destructive">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            ) : (
                <QuranReaderLayout
                    chapters={chapters}
                    selectedChapter={selectedChapter?.id}
                    onChapterSelect={handleChapterSelect}
                    currentAyah={currentAyah}
                    onJumpToAyah={jumpToAyah}
                >
                    <div className="flex flex-1 flex-col px-0 py-5 md:px-4">
                        <div className="mx-auto h-full w-full max-w-3xl rounded-xl">
                            <VersesPanel
                                chapter={selectedChapter}
                                initialVerses={initialVerses}
                                apiUrl="/api/quran"
                                pageSize={10}
                                showTranslation={true}
                                fromVerse={fromVerse ?? undefined}
                                toVerse={toVerse ?? undefined}
                                startFromVerse={startFromVerse}
                                onCurrentAyahChange={setCurrentAyah}
                                onJumpHandlerChange={handleJumpHandlerChange}
                            />
                        </div>
                    </div>
                </QuranReaderLayout>
            )}
        </>
    );
}
