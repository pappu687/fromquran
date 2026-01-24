import { VersesPanel } from '@/components/quran/verses-panel';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import { usePage, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { SharedData } from '@/types';

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
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
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<
        Chapter | undefined
    >();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Mock chapters data - replace with actual API call
    const mockChapters: Chapter[] = [
        {
            id: 1,
            number: 1,
            name: 'الفاتحة',
            englishName: 'Al-Fatihah',
            englishNameTranslation: 'The Opening',
            revelationType: 'Meccan',
            verses: 7,
        },
        {
            id: 2,
            number: 2,
            name: 'البقرة',
            englishName: 'Al-Baqarah',
            englishNameTranslation: 'The Cow',
            revelationType: 'Medinan',
            verses: 286,
        },
        {
            id: 3,
            number: 3,
            name: 'آل عمران',
            englishName: 'Aal-E-Imran',
            englishNameTranslation: 'The Family of Imran',
            revelationType: 'Medinan',
            verses: 200,
        },
        {
            id: 114,
            number: 114,
            name: 'الناس',
            englishName: 'An-Nas',
            englishNameTranslation: 'Mankind',
            revelationType: 'Meccan',
            verses: 6,
        },
    ];

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

        // Update local state immediately (no page reload)
        setSelectedChapter(chapter);

        // Update URL without page reload using browser history API
        const chapterUrlNumber = chapter.number;
        window.history.pushState(
            {},
            '',
            `/read/${chapterUrlNumber}`
        );
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
                    <div className="flex flex-1 flex-col px-4 py-5">
                        <div className="mx-auto h-full w-full max-w-3xl rounded-xl">
                            <VersesPanel
                                chapter={selectedChapter}
                                apiUrl="/api/quran"
                                pageSize={10}
                                showTranslation={true}
                                user={user}
                                fromVerse={fromVerse ?? undefined}
                                toVerse={toVerse ?? undefined}
                            />
                        </div>
                    </div>
                </QuranReaderLayout>
            )}
        </>
    );
}

