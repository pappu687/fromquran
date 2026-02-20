import { VersesPanel } from '@/components/quran/verses-panel';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import { usePage, Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { SharedData } from '@/types';

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
}

export default function QuranReader({
    chapterNumber,
    fromVerse,
    toVerse,
}: QuranReaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const user = auth?.user;
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<
        Chapter | undefined
    >();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Optional start-verse query param to continue reading from a specific verse
    const searchParams = new URLSearchParams(
        page.url.split('?')[1] ?? '',
    );
    const startVerseParam = searchParams.get('start-verse');
    const startFromVerse = startVerseParam
        ? Number(startVerseParam) || undefined
        : undefined;    

    useEffect(() => {
        // Fetch chapters from API
        const fetchChapters = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/quran/chapters');
                const data = await response.json();
                setChapters(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load chapters');
                setLoading(false);
            }
        };

        fetchChapters();
    }, []);

    // Sync selected chapter with server-provided chapterNumber prop
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

        // Update the local state immediately for instant feedback
        setSelectedChapter(chapter);

        // Use Inertia router to update the URL without full page refresh
        router.visit(`/${chapter.number}`, {
            method: 'get',
            preserveState: true, // Keep React state for smooth navigation
            preserveScroll: true, // Keep scroll position
            only: [], // Don't request any specific props - use existing data
        });
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full"></div>
                    <p className="text-muted-foreground">
                        Loading Quran Reader...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title="From Quran" />
            {error ? (
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
                                apiUrl="/api/quran"
                                pageSize={10}
                                showTranslation={true}
                                user={user}
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

