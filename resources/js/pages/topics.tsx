import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { Search, Tags } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch chapters for sidebar
    const [chapters, setChapters] = useState<Chapter[]>([]);

    const page = usePage<{ appUrl?: string; siteName?: string }>();
    const url = page.url;
    const appUrl =
        (page.props.appUrl as string | undefined) ?? 'https://fromquran.com';
    const siteName =
        (page.props.siteName as string | undefined) ??
        'From Quran - Explore everything stemming from Quran.';
    const baseUrl = appUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    const canonicalUrl = `${baseUrl}${path}`;
    const ogImage = `${baseUrl}/fromquran-logo.svg`;

    const pageTitle = 'Quran Topics';
    const pageDescription =
        'Browse Quranic topics, themes, and tagged verses organized alphabetically.';

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

    const handleChapterSelect = (chapterId: number) => {
        const chapter = chapters.find((ch) => ch.id === chapterId);
        if (!chapter) return;

        router.visit(`/${chapter.number}`);
    };

    // Filter topics by search query
    const filteredTopics = topics.filter(
        (topic) =>
            topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.arabic_name?.includes(searchQuery),
    );

    // Group topics by first letter (sanitized)
    const groupedTopics = filteredTopics.reduce(
        (acc, topic) => {
            // Remove leading non-alphabetic characters (quotes, dashes, etc)
            const sanitized = topic.name.replace(/^[^a-zA-Z]+/, '');
            let firstLetter = sanitized
                ? sanitized.charAt(0).toUpperCase()
                : '#';

            // Group any remaining numbers or non-A-Z starting topics under '#'
            if (!/^[A-Z]$/.test(firstLetter)) {
                firstLetter = '#';
            }

            if (!acc[firstLetter]) {
                acc[firstLetter] = [];
            }
            acc[firstLetter].push(topic);
            return acc;
        },
        {} as Record<string, Topic[]>,
    );

    // Sort the letters alphabetically, ensuring '#' comes last or first. We'll put it first.
    const sortedLetters = Object.keys(groupedTopics).sort((a, b) => {
        if (a === '#') return -1;
        if (b === '#') return 1;
        return a.localeCompare(b);
    });

    // Sort topics within each letter group
    for (const letter in groupedTopics) {
        groupedTopics[letter].sort((a, b) => a.name.localeCompare(b.name));
    }

    const content = (
        <>
            <Head>
                <title>{`${pageTitle} | From Quran`}</title>
                <meta name="description" content={pageDescription} />
                <meta
                    property="og:title"
                    content={`${pageTitle} | From Quran`}
                />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:site_name" content={siteName} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content={`${pageTitle} | From Quran`}
                />
                <meta name="twitter:description" content={pageDescription} />
                <meta name="twitter:image" content={ogImage} />
            </Head>
            <div className="flex h-full flex-col px-4 py-5">
                <div className="mx-auto h-full w-full max-w-4xl rounded-xl">
                    <div className="mb-8">
                        <div className="mb-2 flex items-center gap-2">
                            <Tags className="h-6 w-6" />
                            <h1 className="text-3xl font-bold">Quran Topics</h1>
                        </div>
                        <p className="text-muted-foreground">
                            Browse all topics mentioned in the Quran, organized
                            alphabetically.
                        </p>
                    </div>

                    {!loading && !error && topics.length > 0 && (
                        <div className="relative mb-8 max-w-md">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Filter topics by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 bg-background pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-8">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-6 w-12" />
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from({ length: 5 }).map(
                                            (_, j) => (
                                                <Skeleton
                                                    key={j}
                                                    className="h-8 w-24"
                                                />
                                            ),
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-destructive">{error}</p>
                        </div>
                    ) : groupedTopics &&
                      Object.keys(groupedTopics).length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-muted-foreground">
                                No topics match your filter.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {sortedLetters.map((letter) => (
                                <div key={letter}>
                                    <h2 className="mb-4 text-2xl font-bold text-primary">
                                        {letter}
                                    </h2>
                                    <div className="flex flex-wrap gap-2.5">
                                        {groupedTopics[letter].map((topic) => (
                                            <Badge
                                                key={topic.topic_id}
                                                variant="outline"
                                                className="cursor-pointer border-border/60 bg-background px-3.5 py-1.5 text-sm font-medium shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                onClick={() =>
                                                    router.visit(
                                                        `/topic/${topic.topic_id}`,
                                                    )
                                                }
                                            >
                                                {topic.name}
                                                {topic.arabic_name && (
                                                    <span className="font-arabic ml-1.5 text-muted-foreground">
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
            onChapterSelect={handleChapterSelect}
        >
            {content}
        </QuranReaderLayout>
    );
}
