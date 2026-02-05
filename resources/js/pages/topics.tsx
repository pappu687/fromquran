import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tags } from 'lucide-react';
import { router } from '@inertiajs/react';
import QuranReaderLayout from '@/layouts/quran-reader-layout';

interface Topic {
    topic_id: number;
    name: string;
    arabic_name: string;
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

export default function Topics() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch chapters for sidebar
    const [chapters, setChapters] = useState<Chapter[]>([]);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const response = await fetch('/api/topics');
                if (response.ok) {
                    const data = await response.json();
                    // Flatten the hierarchical structure to get all topics
                    const allTopics: Topic[] = [];

                    const flattenTopics = (topicList: any[]) => {
                        for (const topic of topicList) {
                            allTopics.push({
                                topic_id: topic.topic_id,
                                name: topic.name,
                                arabic_name: topic.arabic_name,
                            });
                            if (topic.children) {
                                flattenTopics(topic.children);
                            }
                        }
                    };

                    flattenTopics(data);
                    setTopics(allTopics);
                }
            } catch (err) {
                setError('Failed to load topics');
            } finally {
                setLoading(false);
            }
        };

        fetchTopics();

        // Fetch chapters for sidebar
        const fetchChapters = async () => {
            try {
                const response = await fetch('/api/quran/chapters');
                if (response.ok) {
                    const data = await response.json();
                    setChapters(data);
                }
            } catch (err) {
                console.error('Failed to fetch chapters:', err);
            }
        };

        fetchChapters();
    }, []);

    // Group topics by first letter
    const groupedTopics = topics.reduce((acc, topic) => {
        const firstLetter = topic.name.charAt(0).toUpperCase();
        if (!acc[firstLetter]) {
            acc[firstLetter] = [];
        }
        acc[firstLetter].push(topic);
        return acc;
    }, {} as Record<string, Topic[]>);

    // Sort the letters alphabetically
    const sortedLetters = Object.keys(groupedTopics).sort();

    // Sort topics within each letter group
    for (const letter in groupedTopics) {
        groupedTopics[letter].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Get random color for badges
    const getRandomColor = (id: number): string => {
        const colors = [
            'bg-red-100 text-red-800 hover:bg-red-200',
            'bg-blue-100 text-blue-800 hover:bg-blue-200',
            'bg-green-100 text-green-800 hover:bg-green-200',
            'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
            'bg-purple-100 text-purple-800 hover:bg-purple-200',
            'bg-pink-100 text-pink-800 hover:bg-pink-200',
            'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
            'bg-orange-100 text-orange-800 hover:bg-orange-200',
            'bg-teal-100 text-teal-800 hover:bg-teal-200',
            'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
        ];
        return colors[id % colors.length];
    };

    const content = (
        <>
            <Head title="Topics - Quran Topics" />
            <div className="flex h-full flex-col px-4 py-5">
                <div className="mx-auto h-full w-full max-w-4xl rounded-xl">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <Tags className="h-6 w-6" />
                            <h1 className="text-3xl font-bold">Quran Topics</h1>
                        </div>
                        <p className="text-muted-foreground">
                            Browse all topics mentioned in the Quran, organized
                            alphabetically.
                        </p>
                    </div>

                    {loading ? (
                        <div className="space-y-8">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-6 w-12" />
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <Skeleton
                                                key={j}
                                                className="h-8 w-24"
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-destructive">{error}</p>
                        </div>
                    ) : topics.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-muted-foreground">
                                No topics available
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {sortedLetters.map((letter) => (
                                <div key={letter}>
                                    <h2 className="mb-4 text-2xl font-bold text-primary">
                                        {letter}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {groupedTopics[letter].map((topic) => (
                                            <Badge
                                                key={topic.topic_id}
                                                variant="secondary"
                                                className={`cursor-pointer ${getRandomColor(
                                                    topic.topic_id,
                                                )} text-sm px-3 py-1`}
                                                onClick={() =>
                                                    router.visit(
                                                        `/topic/${topic.topic_id}`,
                                                    )
                                                }
                                            >
                                                {topic.name}
                                                {topic.arabic_name && (
                                                    <span className="ml-1 font-arabic">
                                                        ({topic.arabic_name})
                                                    </span>
                                                )}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Topic Count */}
                    {!loading && !error && topics.length > 0 && (
                        <div className="mt-12 text-center text-sm text-muted-foreground">
                            Total Topics: {topics.length}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    return (
        <QuranReaderLayout
            chapters={chapters}
            selectedChapter={undefined}
            onChapterSelect={() => {}}
        >
            {content}
        </QuranReaderLayout>
    );
}
