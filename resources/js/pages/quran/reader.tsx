import { VersesPanel } from '@/components/quran/verses-panel';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    romanName?: string;
    englishNameTranslation: string;
    revelationType: 'Meccan' | 'Medinan';
    verses: number;
}

interface QuranReaderProps {
    chapterNumber?: number;
    fromVerse?: number | null;
    toVerse?: number | null;
    chapter?: Chapter; // Chapter provided by SSR
    initialVerses?: {
        data: any[];
        total: number;
        has_more: boolean;
    };
}

export default function QuranReader({
    chapterNumber,
    fromVerse,
    toVerse,
    chapter: initialChapter,
    initialVerses,
}: QuranReaderProps) {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<
        Chapter | undefined
    >(initialChapter);
    const [loading, setLoading] = useState(!initialChapter);
    const [error, setError] = useState<string | null>(null);

    // Dynamic Title and Description for SEO
    // Use romanName (e.g. At-Tawbah) if available, otherwise fallback to englishName (e.g. The Repentance)
    const displayName = selectedChapter?.romanName || selectedChapter?.englishName || '';
    const pageTitle = displayName
        ? `Surah ${displayName} (${selectedChapter?.number})`
        : 'Quran Reader';

    const pageDescription = selectedChapter
        ? `Read Surah ${displayName} (${selectedChapter.name}) with translation. This chapter has ${selectedChapter.verses} verses and was revealed in ${selectedChapter.revelationType}.`
        : 'Read the Holy Quran with translations and research tools.';

    // Optional start-verse query param to continue reading from a specific verse
    const page = usePage();
    const url = page.url;
    const searchParams = new URLSearchParams(url.split('?')[1] ?? '');
    const startVerseParam = searchParams.get('start-verse');
    const startFromVerse = startVerseParam
        ? Number(startVerseParam) || undefined
        : undefined;

    useEffect(() => {
        // Fetch chapters from API (needed for the dropdown/sidebar)
        const fetchChapters = async () => {
            try {
                const response = await fetch('/api/quran/chapters');
                const data = await response.json();
                setChapters(data);
                if (!initialChapter) {
                    setLoading(false);
                }
            } catch (err) {
                if (!initialChapter) {
                    setError('Failed to load chapters');
                    setLoading(false);
                }
            }
        };

        fetchChapters();
    }, [initialChapter]);

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

    const handleChapterSelect = (chapterId: number) => {
        const chapter = chapters.find((ch) => ch.id === chapterId);
        if (!chapter) return;

        // Update local state immediately for instant feedback
        setSelectedChapter(chapter);

        // Use Inertia router to update URL
        router.visit(`/${chapter.number}`, {
            method: 'get',
            preserveState: true,
            preserveScroll: true,
            only: ['chapterNumber', 'chapter'], // Request these props for the new chapter
        });
    };

    if (loading && !selectedChapter) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
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
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
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
                            />
                        </div>
                    </div>
                </QuranReaderLayout>
            )}
        </>
    );
}
