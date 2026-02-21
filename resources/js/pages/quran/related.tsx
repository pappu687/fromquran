import { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Tags, ChevronLeft, ChevronRight, Globe, Calendar, BookOpen, Scale, Play, FileText, Video } from 'lucide-react';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import type { SharedData } from '@/types';
import { VerseCard } from '@/components/quran/verse-card';

interface ResourceType {
    id: number;
    slug: string;
    name: string;
}

interface Resource {
    id: string | number;
    resource_type_id?: number;
    resource_url: string;
    resource_title: string | null;
    comment: string | null;
    is_truncated?: boolean;
    resource_type: ResourceType;
    user: {
        name: string;
    };
    created_at?: string;
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
    const [selectedResource, setSelectedResource] = useState<{
        title: string | null;
        url: string | null;
        comment: string;
    } | null>(null);
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

    const handleSeeMore = async (resourceId: string | number) => {
        setLoadingFull(true);
        try {
            const response = await fetch(`/api/resources/${resourceId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch full resource');
            }
            const data = await response.json();
            setSelectedResource({
                title: data.data.title || 'Full Description',
                url: data.data.url || null,
                comment: data.data.comment,
            });
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

    const getResourceHighlight = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('fatwa'))
            return {
                color: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-100 dark:bg-amber-900/30',
                icon: Scale,
            };
        if (lowerType.includes('tafsir'))
            return {
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                icon: BookOpen,
            };
        if (lowerType.includes('video'))
            return {
                color: 'text-red-600 dark:text-red-400',
                bg: 'bg-red-100 dark:bg-red-900/30',
                icon: Video,
            };
        if (lowerType.includes('audio'))
            return {
                color: 'text-blue-600 dark:text-blue-400',
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                icon: Play,
            };
        return { color: 'text-primary', bg: 'bg-primary/10', icon: FileText };
    };

    const getDomainName = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch (e) {
            return 'Source';
        }
    };

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
                                                            className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/50"
                                                        >
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1 space-y-1">
                                                                    <a
                                                                        href={resource.resource_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-2 text-base font-semibold text-foreground decoration-primary/30 underline-offset-4 hover:underline group-hover:text-primary transition-colors"
                                                                    >
                                                                        <span className="line-clamp-2">
                                                                            {resource.resource_title || resource.resource_url}
                                                                        </span>
                                                                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                                    </a>
                                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                        <span className="flex items-center gap-1 font-medium bg-muted px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                                                                            <Globe className="h-3 w-3" />
                                                                            {getDomainName(resource.resource_url)}
                                                                        </span>
                                                                        {resource.created_at && (
                                                                            <span className="flex items-center gap-1 font-sans">
                                                                                <Calendar className="h-3 w-3" />
                                                                                {new Date(resource.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {resource.comment && (
                                                                <div className="relative">
                                                                    <div
                                                                        className={`text-sm leading-relaxed text-muted-foreground/90 ${!selectedResource ? 'line-clamp-3' : ''}`}
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: resource.comment,
                                                                        }}
                                                                    />
                                                                    {resource.is_truncated && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="mt-2 h-7 bg-muted/30 px-2 text-xs font-medium text-primary hover:bg-muted"
                                                                            disabled={loadingFull}
                                                                            onClick={() => handleSeeMore(resource.id)}
                                                                        >
                                                                            {loadingFull ? 'Loading...' : 'Read Full Answer'}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="flex items-center justify-between border-t pt-3 mt-1">
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                                                        {resource.user?.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span>{resource.user?.name}</span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Badge variant="outline" className="h-5 text-[10px] font-normal border-dashed opacity-60">
                                                                        Verified
                                                                    </Badge>
                                                                </div>
                                                            </div>
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
                open={!!selectedResource}
                onOpenChange={(open) => !open && setSelectedResource(null)}
            >
                <DialogContent className="max-w-[80rem]">
                    <DialogHeader className="flex flex-row items-center justify-between gap-4 pr-8">
                        <DialogTitle className="flex-1 leading-tight">{selectedResource?.title || 'Full Description'}</DialogTitle>
                        {selectedResource?.url && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 gap-1.5 text-xs font-semibold shrink-0"
                                asChild
                            >
                                <a href={selectedResource.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Source
                                </a>
                            </Button>
                        )}
                    </DialogHeader>
                    <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
                        <div
                            className="text-sm whitespace-pre-wrap text-foreground"
                            dangerouslySetInnerHTML={{
                                __html: selectedResource?.comment || '',
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedResource(null)}
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

