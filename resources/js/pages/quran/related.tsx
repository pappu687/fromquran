import { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Tags, ChevronLeft, ChevronRight } from 'lucide-react';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import type { SharedData } from '@/types';
import { VerseCard } from '@/components/quran/verse-card';

interface ResourceType {
    id: number;
    slug: string;
    name: string;
}

interface Resource {
    id: number;
    resource_type_id: number;
    resource_url: string;
    comment: string | null;
    is_truncated?: boolean;
    resource_type: ResourceType;
    user: {
        name: string;
    };
}

interface SimilarVerse {
    id: number;
    verse_key: string;
    verse_number: number;
    chapter_id: number;
    chapter_number: number;
    chapter_name: string;
    chapter_name_roman: string;
    text_uthmani: string;
    translation: string;
    translation_resource: string;
    matched_words_count: number;
    coverage: number;
    score: number;
    match_words_range: number[][];
}

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

interface MainVerse {
    id: number;
    chapterId: number;
    chapterNumber?: number;
    verseNumber: number;
    text: string;
    translation?: string;
    audioUrl?: string;
    juzNumber: number;
    pageNumber: number;
    hasResources?: boolean;
    resourceCount?: number;
}

interface RelatedPageProps {
    chapterNumber: number;
    verseNumber: number;
    verseId: number;
    previousVerse: {
        chapterNumber: number;
        verseNumber: number;
    } | null;
    nextVerse: {
        chapterNumber: number;
        verseNumber: number;
    } | null;
}

export default function RelatedPage({
    chapterNumber,
    verseNumber,
    verseId,
    previousVerse,
    nextVerse,
}: RelatedPageProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;

    const [resources, setResources] = useState<Resource[]>([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [loadingFull, setLoadingFull] = useState(false);
    const [selectedComment, setSelectedComment] = useState<string | null>(null);
    const [similarVerses, setSimilarVerses] = useState<SimilarVerse[]>([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [mainVerse, setMainVerse] = useState<MainVerse | null>(null);
    const [loadingMainVerse, setLoadingMainVerse] = useState(false);

    useEffect(() => {
        const fetchChapters = async () => {
            try {
                const response = await fetch('/api/quran/chapters');
                if (!response.ok) {
                    throw new Error('Failed to load chapters');
                }
                const data = await response.json();
                setChapters(data);
            } catch (err) {
                console.error('Failed to fetch chapters:', err);
            }
        };

        fetchChapters();
    }, []);

    useEffect(() => {
        const fetchMainVerse = async () => {
            if (!chapters.length) return;

            const chapter = chapters.find((ch) => ch.number === chapterNumber);
            if (!chapter) return;

            setLoadingMainVerse(true);
            try {
                const params = new URLSearchParams({
                    page: '1',
                    limit: '1',
                    edition: 'en.sahih',
                    from: String(verseNumber),
                    to: String(verseNumber),
                });

                const response = await fetch(
                    `/api/quran/chapters/${chapter.id}/verses?${params.toString()}`,
                );

                if (!response.ok) {
                    throw new Error('Failed to load verse');
                }

                const data = await response.json();
                const verse = data.data?.[0];
                if (verse) {
                    setMainVerse({
                        ...verse,
                        chapterNumber,
                    });
                }
            } catch (err) {
                console.error('Failed to load main verse:', err);
            } finally {
                setLoadingMainVerse(false);
            }
        };

        fetchMainVerse();
    }, [chapters, chapterNumber, verseNumber]);

    useEffect(() => {
        const fetchAll = async () => {
            setError(null);
            await Promise.all([fetchResources(), fetchSimilarVerses(), fetchTopics()]);
        };

        fetchAll();
    }, [verseId]);

    const fetchResources = async () => {
        setLoadingResources(true);
        try {
            // For the dedicated related page, we want all resources,
            // so we pass a high limit value.
            const response = await fetch(
                `/api/verses/${verseId}/resources?limit=1000`,
            );
            if (!response.ok) {
                throw new Error('Failed to fetch resources');
            }
            const data = await response.json();
            setResources(data.data || []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load related resources.',
            );
        } finally {
            setLoadingResources(false);
        }
    };

    const fetchSimilarVerses = async () => {
        setLoadingSimilar(true);
        try {
            const response = await fetch(`/api/verses/${verseId}/similar`);
            if (!response.ok) {
                throw new Error('Failed to fetch similar verses');
            }
            const data = await response.json();
            setSimilarVerses(data.data || []);
        } catch (err) {
            console.error('Failed to fetch similar verses:', err);
        } finally {
            setLoadingSimilar(false);
        }
    };

    const fetchTopics = async () => {
        setLoadingTopics(true);
        try {
            const response = await fetch(`/api/verses/${verseId}/topics`);
            if (!response.ok) {
                throw new Error('Failed to fetch topics');
            }
            const data = await response.json();
            setTopics(data.data || []);
        } catch (err) {
            console.error('Failed to fetch topics:', err);
        } finally {
            setLoadingTopics(false);
        }
    };

    const handleSeeMore = async (resourceId: number) => {
        setLoadingFull(true);
        try {
            const response = await fetch(`/api/resources/${resourceId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch full resource');
            }
            const data = await response.json();
            setSelectedComment(data.data.comment);
        } catch (err) {
            console.error('Failed to fetch full resource:', err);
        } finally {
            setLoadingFull(false);
        }
    };

    const handleVerseNavigate = (targetChapter: number, targetVerse: number) => {
        router.visit(`/related/${targetChapter}/${targetVerse}`);
    };

    const handleOpenInReader = () => {
        router.visit(`/${chapterNumber}/${verseNumber}`);
    };

    const handleTopicClick = (topicId: number) => {
        router.visit(`/topic/${topicId}`);
    };

    const formatMatchRange = (range: number[][]): string => {
        if (!range || range.length === 0) return '';
        return range.map((r) => `words ${r[0]}-${r[1]}`).join(', ');
    };

    const groupedResources = resources.reduce(
        (acc, resource) => {
            const type = resource.resource_type?.name ?? 'Other';
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(resource);
            return acc;
        },
        {} as Record<string, Resource[]>,
    );

    const handleChapterSelect = (chapterId: number) => {
        const chapter = chapters.find((ch) => ch.id === chapterId);
        if (!chapter) return;

        router.visit(`/${chapter.number}`, {
            method: 'get',
            preserveState: true,
            preserveScroll: true,
        });
    };

    const selectedChapterId =
        chapters.find((ch) => ch.number === chapterNumber)?.id ??
        chapters.find((ch) => ch.id === chapterNumber)?.id;

    const content = (
        <>
            <div className="flex h-full flex-col px-4 py-5">
                <div className="mx-auto h-full w-full max-w-3xl rounded-xl">
                    {/* Top navigation */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.history.back()}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Back
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenInReader}
                            >
                                Open in Reader ({chapterNumber}:{verseNumber})
                            </Button>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-0.5"
                                disabled={!previousVerse}
                                onClick={() =>
                                    previousVerse &&
                                    handleVerseNavigate(
                                        previousVerse.chapterNumber,
                                        previousVerse.verseNumber,
                                    )
                                }
                            >
                                <ChevronLeft className="mr-0.5" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!nextVerse}
                                onClick={() =>
                                    nextVerse &&
                                    handleVerseNavigate(
                                        nextVerse.chapterNumber,
                                        nextVerse.verseNumber,
                                    )
                                }
                            >
                                Next
                                <ChevronRight className="ml-0.5" />
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
                            <p>{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setError(null);
                                    fetchResources();
                                    fetchSimilarVerses();
                                    fetchTopics();
                                }}
                                className="mt-2"
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {/* Main verse (using shared VerseCard) */}
                    <section className="mb-6">
                        {loadingMainVerse ? (
                            <div className="space-y-3 rounded-lg border bg-card p-4">
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-5 w-3/4" />
                            </div>
                        ) : mainVerse ? (
                            <VerseCard
                                className="p-3 bg-white/70 border-2"
                                verse={mainVerse}
                                showTranslation
                                hideHeaderActions
                            />
                        ) : null}
                    </section>

                    {/* Resources */}
                    <section className="mb-8">
                        <div className="mb-4 flex items-center justify-between">
                            <h1 className="text-xl font-semibold">
                                Related Resources ({chapterNumber}:{verseNumber})
                            </h1>
                            <span className="text-sm text-muted-foreground">
                                {resources.length} resource
                                {resources.length === 1 ? '' : 's'}
                            </span>
                        </div>

                        {loadingResources ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : resources.length === 0 ? (
                            <div className="flex h-40 items-center justify-center text-center">
                                <p className="text-muted-foreground">
                                    No resources available yet for this verse.
                                </p>
                            </div>
                        ) : (
                            <Accordion
                                type="single"
                                collapsible
                                defaultValue={Object.keys(groupedResources)[0]}
                                className="w-full"
                            >
                                {Object.entries(groupedResources).map(
                                    ([type, typeResources]) => (
                                        <AccordionItem key={type} value={type}>
                                            <AccordionTrigger>
                                                {type} ({typeResources.length})
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div
                                                    className="space-y-4 overflow-y-auto pr-2"
                                                    style={{ maxHeight: '500px' }}
                                                >
                                                    {typeResources.map((resource) => (
                                                        <div
                                                            key={resource.id}
                                                            className="rounded-lg border p-3 bg-white/70"
                                                        >
                                                            <a
                                                                href={
                                                                    resource.resource_url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="group mb-2 flex items-start gap-2 text-sm font-medium text-primary hover:underline"
                                                            >
                                                                <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                                                <span className="break-all">
                                                                    {
                                                                        resource.resource_url
                                                                    }
                                                                </span>
                                                            </a>
                                                            {resource.comment && (
                                                                <div className="mt-2 text-sm text-muted-foreground">
                                                                    <div
                                                                        className="whitespace-pre-wrap"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: resource.comment,
                                                                        }}
                                                                    />
                                                                    {resource.is_truncated && (
                                                                        <Button
                                                                            variant="link"
                                                                            className="ml-1 h-auto p-0 px-1 font-normal text-primary"
                                                                            disabled={
                                                                                loadingFull
                                                                            }
                                                                            onClick={() =>
                                                                                handleSeeMore(
                                                                                    resource.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            {loadingFull
                                                                                ? 'Loading...'
                                                                                : 'See more'}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <p className="mt-2 text-xs text-muted-foreground">
                                                                Submitted by{' '}
                                                                {
                                                                    resource.user
                                                                        ?.name
                                                                }
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ),
                                )}
                            </Accordion>
                        )}
                    </section>

                    {/* Topics (only show if loading or there are any) */}
                    {(loadingTopics || topics.length > 0) && (
                        <>
                            <Separator className="my-6" />
                            <section className="mb-8">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">
                                        Topics
                                    </h2>
                                    {loadingTopics && (
                                        <span className="text-sm text-muted-foreground">
                                            Loading topics...
                                        </span>
                                    )}
                                </div>
                                {loadingTopics ? (
                                    <Skeleton className="h-10 w-full" />
                                ) : (
                                    <div className="flex flex-wrap gap-2 p-2">
                                        {topics.map((topic) => (
                                            <Badge
                                                key={topic.topic_id}
                                                variant="secondary"
                                                className="cursor-pointer bg-amber-400/20 border-amber-500/50"
                                                onClick={() =>
                                                    handleTopicClick(
                                                        topic.topic_id,
                                                    )
                                                }
                                            >
                                                <Tags className="mr-1 h-3 w-3" />
                                                {topic.name}
                                                {topic.arabic_name && (
                                                    <span className="ml-1 font-arabic text-xs">
                                                        ({topic.arabic_name})
                                                    </span>
                                                )}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {/* Related Verses (only show if loading or there are any) */}
                    {(loadingSimilar || similarVerses.length > 0) && (
                        <>
                            <Separator className="my-6" />
                            <section className="mb-10">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">
                                        Related Verses
                                    </h2>
                                    {loadingSimilar && (
                                        <span className="text-sm text-muted-foreground">
                                            Loading related verses...
                                        </span>
                                    )}
                                </div>
                                {loadingSimilar ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                    </div>
                                ) : (
                                    <div
                                        className="space-y-4 overflow-y-auto pr-2"
                                        style={{ maxHeight: '500px' }}
                                    >
                                        {similarVerses.map((similar) => (
                                            <div
                                                key={similar.id}
                                                className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                                onClick={() =>
                                                    router.visit(
                                                        `/${similar.chapter_number}/${similar.verse_number}`,
                                                    )
                                                }
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-primary">
                                                        {similar.chapter_name} (
                                                        {similar.chapter_number}:
                                                        {similar.verse_number})
                                                    </span>
                                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                                        <span>
                                                            Score:{' '}
                                                            {similar.score}
                                                        </span>
                                                        <span>
                                                            Coverage:{' '}
                                                            {similar.coverage}%
                                                        </span>
                                                        <span>
                                                            Words:{' '}
                                                            {
                                                                similar.matched_words_count
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                <VerseCard
                                                    verse={{
                                                        id: similar.id,
                                                        chapterId:
                                                            similar.chapter_id,
                                                        chapterNumber:
                                                            similar.chapter_number,
                                                        verseNumber:
                                                            similar.verse_number,
                                                        text: similar.text_uthmani,
                                                        translation:
                                                            similar.translation,
                                                        juzNumber: 0,
                                                        pageNumber: 0,
                                                    }}
                                                    showTranslation
                                                    hideHeaderActions
                                                    className="bg-transparent border-0 shadow-none px-0 pt-0"
                                                />

                                                {similar.match_words_range &&
                                                    similar.match_words_range
                                                        .length > 0 && (
                                                        <p className="mt-2 text-xs text-muted-foreground">
                                                            Match:{' '}
                                                            {formatMatchRange(
                                                                similar.match_words_range,
                                                            )}
                                                        </p>
                                                    )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {/* Bottom navigation */}
                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!previousVerse}
                            onClick={() =>
                                previousVerse &&
                                handleVerseNavigate(
                                    previousVerse.chapterNumber,
                                    previousVerse.verseNumber,
                                )
                            }
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!nextVerse}
                            onClick={() =>
                                nextVerse &&
                                handleVerseNavigate(
                                    nextVerse.chapterNumber,
                                    nextVerse.verseNumber,
                                )
                            }
                        >
                            Next
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Full comment dialog */}
            <Dialog
                open={!!selectedComment}
                onOpenChange={(open) => !open && setSelectedComment(null)}
            >
                <DialogContent className="max-w-[80rem]">
                    <DialogHeader>
                        <DialogTitle>Full Description</DialogTitle>
                    </DialogHeader>
                    <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
                        <div
                            className="text-sm whitespace-pre-wrap text-foreground"
                            dangerouslySetInnerHTML={{
                                __html: selectedComment || '',
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedComment(null)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );

    return (
        <>
            <Head title={`Related Resources (${chapterNumber}:${verseNumber})`} />
            <QuranReaderLayout
                chapters={chapters}
                selectedChapter={selectedChapterId}
                onChapterSelect={handleChapterSelect}
            >
                {content}
            </QuranReaderLayout>
        </>
    );
}

