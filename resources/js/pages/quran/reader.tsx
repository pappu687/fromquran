import { VersesPanel } from '@/components/quran/verses-panel';
import { useChapters } from '@/hooks';
import { useReaderSettings } from '@/contexts/reader-settings-context';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import {
    type ChapterSummary,
    type PaginatedVersesResponse,
} from '@/types/quran';
import { Head, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { prefetchVersesPage } from '@/hooks/use-verses-panel';

interface QuranReaderProps {
    chapterNumber?: number;
    fromVerse?: number | null;
    toVerse?: number | null;
    chapter?: ChapterSummary;
    initialVerses?: PaginatedVersesResponse;
}

const parseReaderLocation = (pathname: string, search: string) => {
    const normalizedPath = pathname.replace(/^\/+|\/+$/g, '');
    const segments = normalizedPath ? normalizedPath.split('/') : [];

    if (segments.length === 0 || !/^\d+$/.test(segments[0] ?? '')) {
        return null;
    }

    const parsedChapterNumber = Number.parseInt(segments[0], 10);
    let parsedFromVerse: number | undefined;
    let parsedToVerse: number | undefined;

    if (segments[1]) {
        const rangeMatch = segments[1].match(/^(\d+)(?:-(\d+))?$/);
        if (rangeMatch) {
            parsedFromVerse = Number.parseInt(rangeMatch[1], 10);
            parsedToVerse = Number.parseInt(
                rangeMatch[2] ?? rangeMatch[1],
                10,
            );
        }
    }

    const searchParams = new URLSearchParams(search);
    const startVerse = searchParams.get('start-verse');

    return {
        chapterNumber: parsedChapterNumber,
        fromVerse: parsedFromVerse,
        toVerse: parsedToVerse,
        startFromVerse: startVerse
            ? Number.parseInt(startVerse, 10) || undefined
            : undefined,
    };
};

export default function QuranReader({
    chapterNumber,
    fromVerse,
    toVerse,
    chapter: initialChapter,
    initialVerses,
}: QuranReaderProps) {
    const { chapters, getChapterById, getChapterByNumber } = useChapters();
    const { settings } = useReaderSettings();
    const [activeChapterNumber, setActiveChapterNumber] = useState<
        number | undefined
    >(chapterNumber ?? initialChapter?.number);
    const [activeFromVerse, setActiveFromVerse] = useState<number | undefined>(
        fromVerse ?? undefined,
    );
    const [activeToVerse, setActiveToVerse] = useState<number | undefined>(
        toVerse ?? undefined,
    );
    const [selectedChapter, setSelectedChapter] = useState<
        ChapterSummary | undefined
    >(initialChapter);
    const [loading, setLoading] = useState(!initialChapter);
    const [error, setError] = useState<string | null>(null);
    const [currentAyah, setCurrentAyah] = useState(fromVerse ?? 1);
    const [jumpToAyah, setJumpToAyah] = useState<
        ((ayahNumber: number) => Promise<boolean>) | undefined
    >(undefined);

    const page = usePage<{ appUrl?: string; siteName?: string }>();
    const url = page.url;
    const searchParams = new URLSearchParams(url.split('?')[1] ?? '');
    const startVerseParam = searchParams.get('start-verse');
    const startFromVerse = startVerseParam
        ? Number(startVerseParam) || undefined
        : undefined;
    const [activeStartFromVerse, setActiveStartFromVerse] = useState<
        number | undefined
    >(startFromVerse);

    useEffect(() => {
        setActiveChapterNumber(chapterNumber ?? initialChapter?.number);
        setActiveFromVerse(fromVerse ?? undefined);
        setActiveToVerse(toVerse ?? undefined);
        setActiveStartFromVerse(startFromVerse);
    }, [chapterNumber, fromVerse, toVerse, startFromVerse, initialChapter?.number]);

    useEffect(() => {
        if (chapters.length > 0 && !initialChapter) {
            setLoading(false);
        }
    }, [chapters.length, initialChapter]);

    useEffect(() => {
        const handlePopState = () => {
            const parsed = parseReaderLocation(
                window.location.pathname,
                window.location.search,
            );

            if (!parsed) {
                window.location.reload();
                return;
            }

            setActiveChapterNumber(parsed.chapterNumber);
            setActiveFromVerse(parsed.fromVerse);
            setActiveToVerse(parsed.toVerse);
            setActiveStartFromVerse(parsed.startFromVerse);
            setCurrentAyah(parsed.fromVerse ?? parsed.startFromVerse ?? 1);
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    useEffect(() => {
        if (!chapters.length) return;

        const targetChapterNumber =
            activeChapterNumber ?? chapterNumber ?? initialChapter?.number;

        if (targetChapterNumber) {
            const nextChapter =
                getChapterByNumber(targetChapterNumber) ?? chapters[0];
            setSelectedChapter(nextChapter);
        } else if (!selectedChapter) {
            setSelectedChapter(chapters[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        chapters,
        activeChapterNumber,
        chapterNumber,
        initialChapter,
        getChapterByNumber,
    ]);

    useEffect(() => {
        setCurrentAyah(activeFromVerse ?? activeStartFromVerse ?? 1);
    }, [
        activeChapterNumber,
        activeFromVerse,
        activeToVerse,
        activeStartFromVerse,
    ]);

    const handleChapterSelect = (chapterId: number) => {
        const nextChapter = getChapterById(chapterId);
        if (!nextChapter) return;

        prefetchVersesPage({
            chapterId: nextChapter.id,
            apiUrl: '/api/quran',
            pageNum: 1,
            pageSize: 10,
            selectedEdition: 'en.sahih',
            translationIds: settings.selectedTranslations,
        });

        setActiveChapterNumber(nextChapter.number);
        setActiveFromVerse(undefined);
        setActiveToVerse(undefined);
        setActiveStartFromVerse(undefined);
        setSelectedChapter(nextChapter);
        setCurrentAyah(1);
        window.history.pushState({}, '', `/${nextChapter.number}`);
        window.scrollTo({ top: 0, behavior: 'auto' });
    };

    const handleJumpHandlerChange = useCallback(
        (handler: ((ayahNumber: number) => Promise<boolean>) | undefined) => {
            setJumpToAyah(() => handler);
        },
        [],
    );

    const displayName =
        selectedChapter?.romanName || selectedChapter?.englishName || '';

    let pageTitle: string;
    let pageDescription: string;

    if (selectedChapter && activeFromVerse != null && activeToVerse != null) {
        const versePart =
            activeFromVerse === activeToVerse
                ? `${activeFromVerse}`
                : `${activeFromVerse}-${activeToVerse}`;
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
                    content={activeFromVerse != null ? 'article' : 'article'}
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
                                fromVerse={activeFromVerse}
                                toVerse={activeToVerse}
                                startFromVerse={activeStartFromVerse}
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
