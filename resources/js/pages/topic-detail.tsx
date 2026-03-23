import { VerseCard } from '@/components/quran/verse-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ExternalLink, Tags } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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

interface TopicDetailResponse {
    topic: Topic;
    related_topics?: RelatedTopic[];
    verses: {
        data: Verse[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
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
    const [chapters, setChapters] = useState<Chapter[]>([]);

    const inertiaPage = usePage<{ appUrl?: string; siteName?: string }>();
    const url = inertiaPage.url;
    const appUrl =
        (inertiaPage.props.appUrl as string | undefined) ??
        'https://fromquran.com';
    const siteName =
        (inertiaPage.props.siteName as string | undefined) ??
        'From Quran - Explore everything stemming from Quran.';
    const baseUrl = appUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    const canonicalUrl = `${baseUrl}${path}`;
    const ogImage = `${baseUrl}/og-banner.png`;

    const topicName = topic?.name || 'Topic';
    const rawDescription = topic?.description
        ? topic.description.replace(/<[^>]+>/g, '')
        : '';
    const fallbackDescription = `Explore ayat and resources about ${topicName} in the Quran.`;
    const pageDescription = rawDescription.trim()
        ? `${rawDescription.trim().slice(0, 200)}...`
        : fallbackDescription;
    const pageTitle = `${topicName} - Quran Topic`;
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'topics',
            href: '/topics',
        },
        {
            title: topicName,
            href: `/topic/${topicId}`,
        },
    ];

    const fetchTopicData = useCallback(
        async (pageNum: number = 1) => {
            if (pageNum === 1) {
                setLoading(true);
            } else {
                setLoadingVerses(true);
            }

            setError(null);

            try {
                const response = await fetch(
                    `/api/topics/${topicId}?page=${pageNum}`,
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch topic');
                }

                const data = (await response.json()) as TopicDetailResponse;

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
                setError(
                    err instanceof Error ? err.message : 'An error occurred',
                );
            } finally {
                setLoading(false);
                setLoadingVerses(false);
            }
        },
        [topicId],
    );

    useEffect(() => {
        fetchTopicData(1);

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
    }, [fetchTopicData, topicId]);

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

    const handleChapterSelect = (chapterId: number) => {
        const chapter = chapters.find((ch) => ch.id === chapterId);
        if (!chapter) {
            return;
        }

        router.visit(`/${chapter.number}`);
    };

    const getVisiblePages = () => {
        const maxVisiblePages = 5;

        if (pagination.last_page <= maxVisiblePages) {
            return Array.from(
                { length: pagination.last_page },
                (_, index) => index + 1,
            );
        }

        if (page <= 3) {
            return [1, 2, 3, 4, pagination.last_page];
        }

        if (page >= pagination.last_page - 2) {
            return [
                1,
                pagination.last_page - 3,
                pagination.last_page - 2,
                pagination.last_page - 1,
                pagination.last_page,
            ];
        }

        return [1, page - 1, page, page + 1, pagination.last_page];
    };

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
                <meta property="og:type" content="article" />
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

            <div className="flex h-full flex-col bg-[#fafaf8] px-4 py-5">
                <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 py-4 sm:gap-10 sm:py-6">
                    {loading ? (
                        <div className="space-y-8">
                            <div className="space-y-3 border-b border-slate-200 pb-8">
                                <Skeleton className="h-4 w-20 rounded-full" />
                                <Skeleton className="h-10 w-72 rounded-2xl" />
                                <Skeleton className="h-20 w-full rounded-3xl" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-32 w-full rounded-3xl" />
                                <Skeleton className="h-32 w-full rounded-3xl" />
                                <Skeleton className="h-32 w-full rounded-3xl" />
                            </div>
                        </div>
                    ) : error || !topic ? (
                        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center">
                            <p className="mb-4 text-sm text-red-700">
                                {error || 'Topic not found'}
                            </p>
                            <Button
                                onClick={() => router.visit('/topics')}
                                className="rounded-full px-5"
                            >
                                Browse Topics
                            </Button>
                        </div>
                    ) : (
                        <>
                            <section className="border-b border-slate-200 pb-6 sm:pb-8">
                                <div className="mb-5 flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        onClick={() => window.history.back()}
                                        className="rounded-full px-3 text-slate-600"
                                    >
                                        <ChevronLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={() => router.visit('/topics')}
                                        className="rounded-full border-slate-200 px-4 text-slate-600 shadow-none hover:bg-slate-100 hover:text-slate-900"
                                    >
                                        All Topics
                                    </Button>
                                </div>

                                <div className="max-w-3xl">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Tags className="h-4 w-4" />
                                        <p className="text-xs font-semibold tracking-[0.18em] uppercase">
                                            Topic
                                        </p>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                                            {topic.name}
                                        </h1>
                                        {topic.arabic_name && (
                                            <span className="font-arabic text-2xl text-slate-400 sm:text-3xl">
                                                {topic.arabic_name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        {topic.parent && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!topic.parent) {
                                                        return;
                                                    }

                                                    handleTopicClick(
                                                        topic.parent.topic_id,
                                                    );
                                                }}
                                                className="rounded-full bg-stone-100 px-3 py-1.5 text-sm text-slate-700 ring-1 ring-stone-200 transition-colors hover:bg-stone-200 hover:text-slate-950"
                                            >
                                                Parent: {topic.parent.name}
                                            </button>
                                        )}
                                        <div className="rounded-full bg-amber-50 px-3 py-1.5 text-sm text-amber-800 ring-1 ring-amber-200">
                                            {pagination.total} verses
                                        </div>
                                    </div>

                                    {topic.description && (
                                        <div
                                            className="prose prose-sm mt-5 max-w-none text-slate-600"
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
                                            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-900 hover:text-slate-600"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Read more on Wikipedia
                                        </a>
                                    )}
                                </div>
                            </section>

                            {relatedTopics.length > 0 && (
                                <section>
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                                            Related Topics
                                        </p>
                                        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                                            Explore nearby themes
                                        </h2>
                                    </div>

                                    <div className="flex flex-wrap gap-2.5">
                                        {relatedTopics.map((related) => (
                                            <button
                                                key={related.topic_id}
                                                type="button"
                                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                                                onClick={() =>
                                                    handleTopicClick(
                                                        related.topic_id,
                                                    )
                                                }
                                            >
                                                <span>{related.name}</span>
                                                {related.arabic_name && (
                                                    <span className="font-arabic ml-2 text-slate-400">
                                                        {related.arabic_name}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {topic.children.length > 0 && (
                                <section>
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                                            Sub-topics
                                        </p>
                                        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                                            Narrow the scope
                                        </h2>
                                    </div>

                                    <div className="flex flex-wrap gap-2.5">
                                        {topic.children.map((child) => (
                                            <button
                                                key={child.topic_id}
                                                type="button"
                                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                                                onClick={() =>
                                                    handleTopicClick(
                                                        child.topic_id,
                                                    )
                                                }
                                            >
                                                {child.name}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section className="pt-2">
                                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                                            Verses
                                        </p>
                                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                            Ayat connected to this topic
                                        </h2>
                                    </div>
                                    {pagination.total > 0 && (
                                        <div className="rounded-full bg-white px-3 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200">
                                            Page {pagination.current_page} of{' '}
                                            {pagination.last_page}
                                        </div>
                                    )}
                                </div>

                                {loadingVerses ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-32 w-full rounded-3xl" />
                                        <Skeleton className="h-32 w-full rounded-3xl" />
                                        <Skeleton className="h-32 w-full rounded-3xl" />
                                    </div>
                                ) : verses.length === 0 ? (
                                    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-none">
                                        <p className="text-sm leading-7 text-slate-500">
                                            No verses found for this topic.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-5">
                                            {verses.map((verse) => (
                                                <div
                                                    key={verse.id}
                                                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-none"
                                                >
                                                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4">
                                                        <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600 uppercase">
                                                            {verse.chapter_name_roman ||
                                                                verse.chapter_name}
                                                        </span>
                                                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                                            Ayah{' '}
                                                            {verse.verse_number}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className="cursor-pointer"
                                                        onClick={() =>
                                                            handleVerseClick(
                                                                verse.chapter_number,
                                                                verse.verse_number,
                                                            )
                                                        }
                                                    >
                                                        <VerseCard
                                                            verse={{
                                                                id: verse.id,
                                                                chapterId:
                                                                    verse.chapter_id,
                                                                chapterNumber:
                                                                    verse.chapter_number,
                                                                verseNumber:
                                                                    verse.verse_number,
                                                                text: verse.text_uthmani,
                                                                translations: [
                                                                    {
                                                                        resource_id: 0,
                                                                        text: verse.translation,
                                                                    },
                                                                ],
                                                                juzNumber: 0,
                                                                pageNumber: 0,
                                                            }}
                                                            showTranslation
                                                            hideHeaderActions
                                                            className="border-0 bg-transparent px-5 py-3 shadow-none"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {pagination.last_page > 1 && (
                                            <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="text-sm text-slate-500">
                                                    Showing page {page} of{' '}
                                                    {pagination.last_page}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handlePageChange(
                                                                page - 1,
                                                            )
                                                        }
                                                        disabled={page === 1}
                                                        className="rounded-full shadow-none"
                                                    >
                                                        Previous
                                                    </Button>

                                                    {getVisiblePages().map(
                                                        (
                                                            visiblePage,
                                                            index,
                                                            pages,
                                                        ) => {
                                                            const previousPage =
                                                                pages[
                                                                    index - 1
                                                                ];
                                                            const shouldShowGap =
                                                                previousPage !==
                                                                    undefined &&
                                                                visiblePage -
                                                                    previousPage >
                                                                    1;

                                                            return (
                                                                <div
                                                                    key={
                                                                        visiblePage
                                                                    }
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    {shouldShowGap && (
                                                                        <span className="px-1 text-sm text-slate-400">
                                                                            ...
                                                                        </span>
                                                                    )}
                                                                    <Button
                                                                        variant={
                                                                            visiblePage ===
                                                                            page
                                                                                ? 'default'
                                                                                : 'outline'
                                                                        }
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handlePageChange(
                                                                                visiblePage,
                                                                            )
                                                                        }
                                                                        className="min-w-10 rounded-full shadow-none"
                                                                    >
                                                                        {
                                                                            visiblePage
                                                                        }
                                                                    </Button>
                                                                </div>
                                                            );
                                                        },
                                                    )}

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handlePageChange(
                                                                page + 1,
                                                            )
                                                        }
                                                        disabled={
                                                            page ===
                                                            pagination.last_page
                                                        }
                                                        className="rounded-full shadow-none"
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </section>
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
            onChapterSelect={handleChapterSelect}
            breadcrumbs={breadcrumbs}
        >
            {content}
        </QuranReaderLayout>
    );
}
