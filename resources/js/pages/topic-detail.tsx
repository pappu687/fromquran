import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import QuranReaderLayout from '@/layouts/quran-reader-layout';

interface Verse {
    id: number;
    verse_key: string;
    verse_number: number;
    chapter_id: number;
    chapter_number: number;
    chapter_name: string;
    chapter_name_roman: string;
    text_uthmani: string;
    translation: string;
}

interface Topic {
    topic_id: number;
    name: string;
    arabic_name: string;
    description: string;
    wiki_link: string;
    ayahs: string;
    related_topics: string;
    parent: {
        topic_id: number;
        name: string;
    } | null;
    children: Array<{
        topic_id: number;
        name: string;
    }>;
}

interface RelatedTopic {
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

interface TopicDetailProps {
    topicId: number;
}

export default function TopicDetail({ topicId }: TopicDetailProps) {
    const [topic, setTopic] = useState<Topic | null>(null);
    const [verses, setVerses] = useState<Verse[]>([]);
    const [relatedTopics, setRelatedTopics] = useState<RelatedTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingVerses, setLoadingVerses] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });

    // Fetch chapters for sidebar
    const [chapters, setChapters] = useState<Chapter[]>([]);

    const fetchTopicData = async (pageNum: number = 1) => {
        if (pageNum === 1) {
            setLoading(true);
        } else {
            setLoadingVerses(true);
        }
        setError(null);

        try {
            const response = await fetch(`/api/topics/${topicId}?page=${pageNum}`);
            if (!response.ok) {
                throw new Error('Failed to fetch topic');
            }

            const data = await response.json();

            if (pageNum === 1) {
                setTopic(data.topic);
                setRelatedTopics(data.related_topics || []);
            }

            setVerses(data.verses.data || []);
            setPagination({
                current_page: data.verses.current_page,
                last_page: data.verses.last_page,
                per_page: data.verses.per_page,
                total: data.verses.total,
            });
            setPage(pageNum);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
            setLoadingVerses(false);
        }
    };

    useEffect(() => {
        fetchTopicData(1);

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
    }, [topicId]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.last_page) {
            fetchTopicData(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleTopicClick = (clickedTopicId: number) => {
        router.visit(`/topic/${clickedTopicId}`);
    };

    const handleVerseClick = (chapterNumber: number, verseNumber: number) => {
        router.visit(`/${chapterNumber}/${verseNumber}`);
    };

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
            <Head title={topic ? `${topic.name} - Topics` : 'Topics'} />
            <div className="flex h-full flex-col px-4 py-5">
                <div className="mx-auto h-full w-full max-w-3xl rounded-xl">
                    {loading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-32 w-full" />
                            <div className="space-y-4">
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-32 w-full" />
                            </div>
                        </div>
                    ) : error || !topic ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <p className="mb-4 text-destructive">
                                {error || 'Topic not found'}
                            </p>
                            <Button onClick={() => router.visit('/')}>
                                Go Home
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Back Button */}
                            <Button
                                variant="ghost"
                                onClick={() => window.history.back()}
                                className="mb-6"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>

                            {/* Topic Header */}
                            <div className="mb-8 rounded-lg border bg-card p-6">
                                <div className="mb-4 flex items-center gap-2">
                                    <h1 className="text-2xl font-bold">
                                        {topic.name}
                                    </h1>
                                    {topic.arabic_name && (
                                        <span className="text-xl font-arabic text-muted-foreground">
                                            {topic.arabic_name}
                                        </span>
                                    )}
                                </div>

                                {topic.parent && (
                                    <div className="mb-4">
                                        <span className="text-sm text-muted-foreground">
                                            Parent:{' '}
                                            <button
                                                onClick={() =>
                                                    handleTopicClick(
                                                        topic.parent!.topic_id,
                                                    )
                                                }
                                                className="font-semibold text-primary hover:underline"
                                            >
                                                {topic.parent!.name}
                                            </button>
                                        </span>
                                    </div>
                                )}

                                {topic.description && (
                                    <div
                                        className="prose prose-sm max-w-none mb-4 text-foreground"
                                        dangerouslySetInnerHTML={{
                                            __html: topic.description,
                                        }}
                                    />
                                )}

                                {topic.wiki_link && (
                                    <a
                                        href={`https://${topic.wiki_link}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm text-primary hover:underline"
                                    >
                                        <ExternalLink className="mr-1 h-4 w-4" />
                                        Read more on Wikipedia
                                    </a>
                                )}
                            </div>

                            {/* Related Topics */}
                            {relatedTopics.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="mb-4 text-xl font-semibold">
                                        Related Topics
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {relatedTopics.map((related) => (
                                            <Badge
                                                key={related.topic_id}
                                                variant="secondary"
                                                className={`cursor-pointer ${getRandomColor(
                                                    related.topic_id,
                                                )}`}
                                                onClick={() =>
                                                    handleTopicClick(
                                                        related.topic_id,
                                                    )
                                                }
                                            >
                                                {related.name}
                                                {related.arabic_name && (
                                                    <span className="ml-1 font-arabic">
                                                        ({related.arabic_name})
                                                    </span>
                                                )}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Child Topics */}
                            {topic.children && topic.children.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="mb-4 text-xl font-semibold">
                                        Sub-topics
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {topic.children.map((child) => (
                                            <Badge
                                                key={child.topic_id}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-primary/20"
                                                onClick={() =>
                                                    handleTopicClick(child.topic_id)
                                                }
                                            >
                                                {child.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Separator className="my-6" />

                            {/* Verses */}
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">
                                        Verses ({pagination.total})
                                    </h2>
                                    {pagination.total > 0 && (
                                        <span className="text-sm text-muted-foreground">
                                            Page {pagination.current_page} of{' '}
                                            {pagination.last_page}
                                        </span>
                                    )}
                                </div>

                                {loadingVerses ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-32 w-full" />
                                        <Skeleton className="h-32 w-full" />
                                        <Skeleton className="h-32 w-full" />
                                    </div>
                                ) : verses.length === 0 ? (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <p>No verses found for this topic</p>
                                    </div>
                                ) : (
                                    <>
                                        {verses.map((verse) => (
                                            <div
                                                key={verse.id}
                                                className="mb-4 cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50"
                                                onClick={() =>
                                                    handleVerseClick(
                                                        verse.chapter_number,
                                                        verse.verse_number,
                                                    )
                                                }
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-primary">
                                                        {verse.chapter_name} (
                                                        {verse.chapter_number}:
                                                        {verse.verse_number})
                                                    </span>
                                                </div>
                                                <p className="mb-2 text-right text-sm font-arabic text-foreground">
                                                    {verse.text_uthmani}
                                                </p>
                                                {verse.translation && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {verse.translation}
                                                    </p>
                                                )}
                                            </div>
                                        ))}

                                        {/* Pagination */}
                                        {pagination.last_page > 1 && (
                                            <div className="mt-8 flex items-center justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handlePageChange(page - 1)
                                                    }
                                                    disabled={page === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    Previous
                                                </Button>
                                                <span className="text-sm text-muted-foreground">
                                                    Page {page} of {pagination.last_page}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handlePageChange(page + 1)
                                                    }
                                                    disabled={
                                                        page === pagination.last_page
                                                    }
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
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
