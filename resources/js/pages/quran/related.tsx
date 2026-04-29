import { LoginModal } from '@/components/auth/login-modal';
import { AddResourceModal } from '@/components/quran/add-resource-modal';
import {
    AyahAnswersHeader,
    AyahAnswersList,
} from '@/components/quran/ayah-answers-section';
import { FullResourceDialog } from '@/components/quran/full-resource-dialog';
import { QuranResourceCard } from '@/components/quran/quran-resource-card';
import { ReportErrorModal } from '@/components/quran/report-error-modal';
import { VerseCard } from '@/components/quran/verse-card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { useRelatedVerse } from '@/hooks/features';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { BookOpen, ChevronLeft, ChevronRight, Tags } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    const { user } = useAuth();
    const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const {
        resources,
        answerQuestions,
        answerQuestionsTotal,
        similarVerses,
        topics,
        mainVerse,
        chapters,
        loadingResources,
        loadingAnswers,
        loadingSimilar,
        loadingTopics,
        loadingMainVerse,
        loadingFullResourceId,
        error,
        selectedResource,
        groupedResources,
        refresh,
        handleSeeMore,
        handleVerseNavigate,
        handleOpenInReader,
        handleTopicClick,
        handleChapterSelect,
        formatMatchRange,
        getResourceHighlight,
        getDomainName,
    } = useRelatedVerse(verseId, chapterNumber, verseNumber);

    const handleReportErrorClick = () => {
        if (user) {
            setIsReportModalOpen(true);
        } else {
            setIsLoginModalOpen(true);
        }
    };

    const pageTitle = `Related Resources for Quran ${chapterNumber}:${verseNumber}`;
    const pageDescription = `Explore tafsir, fatwa, videos, articles, related verses, and topics for Quran ${chapterNumber}:${verseNumber} on From Quran.`;

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
    const fullTitle = `${pageTitle} | From Quran`;

    const selectedChapterId =
        chapters.find((ch) => ch.number === chapterNumber)?.id ??
        chapters.find((ch) => ch.id === chapterNumber)?.id;

    // Set up event listeners for navigation
    useEffect(() => {
        const handleNavigateRelated = (e: Event) => {
            const customEvent = e as CustomEvent<{
                chapterNumber: number;
                verseNumber: number;
            }>;
            router.visit(
                `/related/${customEvent.detail.chapterNumber}/${customEvent.detail.verseNumber}`,
            );
        };

        const handleNavigateReader = (e: Event) => {
            const customEvent = e as CustomEvent<{
                chapterNumber: number;
                verseNumber: number;
            }>;
            router.visit(
                `/${customEvent.detail.chapterNumber}/${customEvent.detail.verseNumber}`,
            );
        };

        const handleNavigateTopic = (e: Event) => {
            const customEvent = e as CustomEvent<{ topicId: number }>;
            router.visit(`/topic/${customEvent.detail.topicId}`);
        };

        const handleNavigateChapter = (e: Event) => {
            const customEvent = e as CustomEvent<{ chapterId: number }>;
            const chapter = chapters.find(
                (ch) => ch.id === customEvent.detail.chapterId,
            );
            if (chapter) {
                router.visit(`/${chapter.number}`);
            }
        };

        window.addEventListener('navigate-related', handleNavigateRelated);
        window.addEventListener('navigate-reader', handleNavigateReader);
        window.addEventListener('navigate-topic', handleNavigateTopic);
        window.addEventListener('navigate-chapter', handleNavigateChapter);

        return () => {
            window.removeEventListener(
                'navigate-related',
                handleNavigateRelated,
            );
            window.removeEventListener('navigate-reader', handleNavigateReader);
            window.removeEventListener('navigate-topic', handleNavigateTopic);
            window.removeEventListener(
                'navigate-chapter',
                handleNavigateChapter,
            );
        };
    }, [chapters]);

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
                                onClick={refresh}
                                className="mt-2"
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {/* Main verse */}
                    <section className="mb-6">
                        {loadingMainVerse ? (
                            <div className="space-y-3 rounded-lg border bg-card p-4">
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-5 w-3/4" />
                            </div>
                        ) : mainVerse ? (
                            <VerseCard
                                className="border-2 bg-white/70 p-3"
                                verse={mainVerse}
                                showTranslation
                                hideHeaderActions
                            />
                        ) : null}
                    </section>

                    {/* Resources */}
                    <section className="mb-8">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-semibold">
                                    Related Resources ({chapterNumber}:
                                    {verseNumber})
                                </h1>
                                <span className="text-sm text-muted-foreground">
                                    {resources.length} resource
                                    {resources.length === 1 ? '' : 's'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddResourceOpen(true)}
                                >
                                    Add a resource
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReportErrorClick}
                                >
                                    Report Error
                                </Button>
                            </div>
                        </div>

                        {loadingResources ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : resources.length === 0 ? (
                            <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
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
                                    ([type, typeResources]) => {
                                        const highlight =
                                            getResourceHighlight(type);
                                        const Icon = highlight.icon;

                                        return (
                                            <AccordionItem
                                                key={type}
                                                value={type}
                                            >
                                                <AccordionTrigger>
                                                    <div className="flex items-center gap-2">
                                                        <Icon
                                                            className={`h-4 w-4 ${highlight.color}`}
                                                        />
                                                        <span>{type}</span>
                                                        <Badge
                                                            variant="secondary"
                                                            className="ml-1 h-5 text-xs"
                                                        >
                                                            {
                                                                typeResources.length
                                                            }
                                                        </Badge>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div
                                                        className="space-y-4 overflow-y-auto pr-2"
                                                        style={{
                                                            maxHeight: '500px',
                                                        }}
                                                    >
                                                        {type ===
                                                        'Similar Verses' ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {typeResources.map(
                                                                    (
                                                                        resource,
                                                                    ) => {
                                                                        let matchedKeys: string[] =
                                                                            [];
                                                                        try {
                                                                            if (
                                                                                resource.comment
                                                                            ) {
                                                                                matchedKeys =
                                                                                    JSON.parse(
                                                                                        resource.comment,
                                                                                    );
                                                                            }
                                                                        } catch (e) {
                                                                            console.error(
                                                                                'Failed to parse similar verses JSON',
                                                                                e,
                                                                            );
                                                                        }

                                                                        return matchedKeys.map(
                                                                            (
                                                                                key,
                                                                                idx,
                                                                            ) => {
                                                                                const parts =
                                                                                    key.split(
                                                                                        ':',
                                                                                    );
                                                                                if (
                                                                                    parts.length ===
                                                                                    2
                                                                                ) {
                                                                                    return (
                                                                                        <Badge
                                                                                            key={`${resource.id}-${idx}`}
                                                                                            variant="secondary"
                                                                                            className="cursor-pointer border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary transition-colors hover:bg-primary/20"
                                                                                            onClick={() =>
                                                                                                router.visit(
                                                                                                    `/${Number(parts[0])}/${Number(parts[1])}`,
                                                                                                    {
                                                                                                        method: 'get',
                                                                                                    },
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                                                                            {
                                                                                                key
                                                                                            }
                                                                                        </Badge>
                                                                                    );
                                                                                }

                                                                                return null;
                                                                            },
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        ) : (
                                                            typeResources.map(
                                                                (resource) => (
                                                                    <QuranResourceCard
                                                                        key={
                                                                            resource.id
                                                                        }
                                                                        resource={
                                                                            resource
                                                                        }
                                                                        loadingFullResourceId={
                                                                            loadingFullResourceId
                                                                        }
                                                                        selectedResourceOpen={
                                                                            !!selectedResource
                                                                        }
                                                                        getDomainName={
                                                                            getDomainName
                                                                        }
                                                                        onSeeMore={
                                                                            handleSeeMore
                                                                        }
                                                                    />
                                                                ),
                                                            )
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    },
                                )}
                            </Accordion>
                        )}
                    </section>

                    {/* Quran Foundation Answers */}
                    {(loadingAnswers || answerQuestions.length > 0) && (
                        <>
                            <Separator className="my-6" />
                            <section className="mb-8">
                                <div className="mb-4 flex items-center justify-between">
                                    <AyahAnswersHeader
                                        totalCount={answerQuestionsTotal}
                                    />
                                    {loadingAnswers && (
                                        <span className="text-sm text-muted-foreground">
                                            Loading answers...
                                        </span>
                                    )}
                                </div>
                                {loadingAnswers ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                    </div>
                                ) : (
                                    <AyahAnswersList
                                        questions={answerQuestions}
                                    />
                                )}
                            </section>
                        </>
                    )}

                    {/* Topics */}
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
                                                className="cursor-pointer border-amber-500/50 bg-amber-400/20"
                                                onClick={() =>
                                                    handleTopicClick(
                                                        topic.topic_id,
                                                    )
                                                }
                                            >
                                                <Tags className="mr-1 h-3 w-3" />
                                                {topic.name}
                                                {topic.arabic_name && (
                                                    <span className="font-arabic ml-1 text-xs">
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

                    {/* Related Verses */}
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
                                                        {similar.chapter_number}
                                                        :{similar.verse_number})
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
                                                        translations: [
                                                            {
                                                                resource_id: 0,
                                                                text: similar.translation,
                                                            },
                                                        ],
                                                        juzNumber: 0,
                                                        pageNumber: 0,
                                                    }}
                                                    showTranslation
                                                    hideHeaderActions
                                                    className="border-0 bg-transparent px-0 pt-0 shadow-none"
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
            <FullResourceDialog
                open={!!selectedResource}
                onOpenChange={(open) => !open && handleSeeMore(-1)}
                resource={selectedResource}
                onClose={() => handleSeeMore(-1)}
            />

            <AddResourceModal
                open={isAddResourceOpen}
                onOpenChange={setIsAddResourceOpen}
                verseId={verseId}
            />

            <ReportErrorModal
                open={isReportModalOpen}
                onOpenChange={setIsReportModalOpen}
                verseId={verseId}
                chapterId={selectedChapterId ?? chapterNumber}
                verseNumber={verseNumber}
            />

            <LoginModal
                open={isLoginModalOpen}
                onOpenChange={setIsLoginModalOpen}
            />
        </>
    );

    return (
        <>
            <Head>
                <title>{fullTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta property="og:title" content={fullTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:site_name" content={siteName} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={fullTitle} />
                <meta name="twitter:description" content={pageDescription} />
                <meta name="twitter:image" content={ogImage} />
            </Head>
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
