import { useState, useEffect } from 'react';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import { ChaptersPanel } from '@/components/quran/chapters-panel';
import { VersesPanel } from '@/components/quran/verses-panel';

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: 'Meccan' | 'Medinan';
    verses: number;
}

export default function QuranReader() {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | undefined>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Mock chapters data - replace with actual API call
    const mockChapters: Chapter[] = [
        {
            id: 1,
            number: 1,
            name: "الفاتحة",
            englishName: "Al-Fatihah",
            englishNameTranslation: "The Opening",
            revelationType: "Meccan",
            verses: 7
        },
        {
            id: 2,
            number: 2,
            name: "البقرة",
            englishName: "Al-Baqarah",
            englishNameTranslation: "The Cow",
            revelationType: "Medinan",
            verses: 286
        },
        {
            id: 3,
            number: 3,
            name: "آل عمران",
            englishName: "Aal-E-Imran",
            englishNameTranslation: "The Family of Imran",
            revelationType: "Medinan",
            verses: 200
        },
        {
            id: 114,
            number: 114,
            name: "الناس",
            englishName: "An-Nas",
            englishNameTranslation: "Mankind",
            revelationType: "Meccan",
            verses: 6
        }
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

    const handleChapterSelect = (chapterId: number) => {
        const chapter = chapters.find(ch => ch.id === chapterId);
        setSelectedChapter(chapter);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading Quran Reader...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-destructive mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <QuranReaderLayout
            chaptersPanel={
                <ChaptersPanel
                    chapters={chapters}
                    selectedChapter={selectedChapter?.id}
                    onChapterSelect={handleChapterSelect}
                />
            }
        >
            <VersesPanel
                chapter={selectedChapter}
                apiUrl="/api/quran"
                pageSize={10}
                showTranslation={true}
            />
        </QuranReaderLayout>
    );
}