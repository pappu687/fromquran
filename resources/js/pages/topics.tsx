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

interface TopicNode {
    topic_id: number;
    name: string;
    arabic_name: string;
    children?: TopicNode[];
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
    const ogImage = `${baseUrl}/og-banner.png`;

    const pageTitle = 'Quran Topics';
    const pageDescription =
        'Browse Quranic topics, themes, and tagged verses organized alphabetically.';

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const response = await fetch('/api/topics');
                if (!response.ok) {
                    throw new Error('Failed to load topics');
                }

                const data = (await response.json()) as TopicNode[];
                const allTopics: Topic[] = [];

                const flattenTopics = (topicList: TopicNode[]) => {
                    for (const topic of topicList) {
                        allTopics.push({
                            topic_id: topic.topic_id,
                            name: topic.name,
                            arabic_name: topic.arabic_name,
                        });

                        if (topic.children?.length) {
                            flattenTopics(topic.children);
                        }
                    }
                };

                flattenTopics(data);
                setTopics(allTopics);
                setError(null);
            } catch {
                setError('Failed to load topics');
            } finally {
                setLoading(false);
            }
        };

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

        fetchTopics();
        fetchChapters();
    }, []);

    const handleChapterSelect = (chapterId: number) => {
        const chapter = chapters.find((item) => item.id === chapterId);
        if (!chapter) {
            return;
        }

        router.visit(`/${chapter.number}`);
    };

    const filteredTopics = topics.filter(
        (topic) =>
            topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.arabic_name?.includes(searchQuery),
    );

    const groupedTopics = filteredTopics.reduce(
        (acc, topic) => {
            const sanitized = topic.name.replace(/^[^a-zA-Z]+/, '');
            const firstLetter = sanitized
                ? sanitized.charAt(0).toUpperCase()
                : '';

            if (!/^[A-Z]$/.test(firstLetter)) {
                return acc;
            }

            if (!acc[firstLetter]) {
                acc[firstLetter] = [];
            }

            acc[firstLetter].push(topic);
            return acc;
        },
        {} as Record<string, Topic[]>,
    );

    const sortedLetters = Object.keys(groupedTopics).sort((a, b) =>
        a.localeCompare(b),
    );

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

            <div className="flex h-full flex-col bg-[#fafaf8] px-4 py-5">
                <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 py-4 sm:gap-10 sm:py-6">
                    <section className="border-b border-slate-200 pb-6 sm:pb-8">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Tags className="h-4 w-4" />
                                <p className="text-xs font-semibold tracking-[0.18em] uppercase">
                                    Quran Topics
                                </p>
                            </div>
                            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                                Browse themes and topics
                            </h1>
                            <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
                                Explore Quranic topics organized alphabetically
                                and jump directly into a tagged topic detail
                                page.
                            </p>
                        </div>

                        {!loading && !error && topics.length > 0 && (
                            <div className="relative mt-6 max-w-3xl sm:mt-7">
                                <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Filter topics by name or Arabic"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="h-12 rounded-full border-slate-200 bg-white pr-4 pl-11 text-base shadow-none focus-visible:ring-1 focus-visible:ring-slate-900"
                                />
                            </div>
                        )}
                    </section>

                    {loading ? (
                        <div className="space-y-8">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="space-y-3">
                                    <Skeleton className="h-6 w-10 rounded-full" />
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from({ length: 6 }).map(
                                            (_, itemIndex) => (
                                                <Skeleton
                                                    key={itemIndex}
                                                    className="h-10 w-28 rounded-full"
                                                />
                                            ),
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-700">
                            {error}
                        </div>
                    ) : sortedLetters.length === 0 ? (
                        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-none">
                            <p className="text-sm leading-7 text-slate-500">
                                No topics match your filter.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {sortedLetters.map((letter) => (
                                <section
                                    key={letter}
                                    className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0"
                                >
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                                            {letter}
                                        </div>
                                        <div className="h-px flex-1 bg-slate-200" />
                                    </div>

                                    <div className="flex flex-wrap gap-2.5">
                                        {groupedTopics[letter].map((topic) => (
                                            <button
                                                key={topic.topic_id}
                                                type="button"
                                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-left text-sm font-medium text-slate-700 shadow-none transition-colors hover:border-slate-300 hover:text-slate-950"
                                                onClick={() =>
                                                    router.visit(
                                                        `/topic/${topic.topic_id}`,
                                                    )
                                                }
                                            >
                                                <span>{topic.name}</span>
                                                {topic.arabic_name && (
                                                    <span className="font-arabic ml-2 text-slate-400">
                                                        {topic.arabic_name}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}

                    {!loading && !error && topics.length > 0 && (
                        <div className="border-t border-slate-200 pt-5 text-sm text-slate-500">
                            Total topics: {topics.length}
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
