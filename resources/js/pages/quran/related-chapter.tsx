import { AddResourceModal } from '@/components/quran/add-resource-modal';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QuranResourceCard } from '@/components/quran/quran-resource-card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useRelatedChapter } from '@/hooks/features';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface RelatedChapterPageProps {
    chapterNumber: number;
    previousChapter: {
        chapterNumber: number;
    } | null;
    nextChapter: {
        chapterNumber: number;
    } | null;
}

export default function RelatedChapterPage({
    chapterNumber,
    previousChapter,
    nextChapter,
}: RelatedChapterPageProps) {
    const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
    const {
        resources,
        chapterInfo,
        chapters,
        groupedResources,
        loadingResources,
        loadingChapterInfo,
        loadingFullResourceId,
        error,
        selectedResource,
        refresh,
        handleSeeMore,
        handleOpenInReader,
        handleChapterSelect,
        getResourceHighlight,
        getDomainName,
    } = useRelatedChapter(chapterNumber);

    const pageTitle = `Related Resources for Surah ${chapterNumber}`;
    const pageDescription = `Explore chapter-level tafsir, videos, articles, and other related resources for Surah ${chapterNumber} on From Quran.`;

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

    useEffect(() => {
        const handleNavigateChapter = (e: Event) => {
            const customEvent = e as CustomEvent<{ chapterId: number }>;
            const chapter = chapters.find(
                (ch) => ch.id === customEvent.detail.chapterId,
            );
            if (chapter) {
                router.visit(`/${chapter.number}`);
            }
        };

        const handleNavigateChapterReader = (e: Event) => {
            const customEvent = e as CustomEvent<{ chapterNumber: number }>;
            router.visit(`/${customEvent.detail.chapterNumber}`);
        };

        window.addEventListener('navigate-chapter', handleNavigateChapter);
        window.addEventListener(
            'navigate-chapter-reader',
            handleNavigateChapterReader,
        );

        return () => {
            window.removeEventListener(
                'navigate-chapter',
                handleNavigateChapter,
            );
            window.removeEventListener(
                'navigate-chapter-reader',
                handleNavigateChapterReader,
            );
        };
    }, [chapters]);

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
                <div className="flex h-full flex-col px-4 py-5">
                    <div className="mx-auto h-full w-full max-w-3xl rounded-xl">
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
                                    Open in Reader (Surah {chapterNumber})
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-0.5"
                                    disabled={!previousChapter}
                                    onClick={() =>
                                        previousChapter &&
                                        router.visit(
                                            `/related/${previousChapter.chapterNumber}`,
                                        )
                                    }
                                >
                                    <ChevronLeft className="mr-0.5" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!nextChapter}
                                    onClick={() =>
                                        nextChapter &&
                                        router.visit(
                                            `/related/${nextChapter.chapterNumber}`,
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
                                    onClick={() => void refresh()}
                                    className="mt-2"
                                >
                                    Retry
                                </Button>
                            </div>
                        )}

                        <section className="mb-6">
                            {loadingChapterInfo ? (
                                <div className="space-y-3 rounded-lg border bg-card p-4">
                                    <Skeleton className="h-8 w-40" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-4/5" />
                                </div>
                            ) : chapterInfo ? (
                                <div className="rounded-xl border bg-card p-4">
                                    <h1 className="text-xl font-semibold">
                                        {chapterInfo.surah_name ||
                                            `Surah ${chapterNumber}`}
                                    </h1>
                                    {chapterInfo.short_text ? (
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                            {chapterInfo.short_text}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                        </section>

                        <section className="mb-8">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Related Resources (Surah {chapterNumber}
                                        )
                                    </h2>
                                    <span className="text-sm text-muted-foreground">
                                        {resources.length} resource
                                        {resources.length === 1 ? '' : 's'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setIsAddResourceOpen(true)
                                        }
                                    >
                                        Add a resource
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.visit('/contact')}
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
                                        No resources available yet for this
                                        chapter.
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
                                                                maxHeight:
                                                                    '500px',
                                                            }}
                                                        >
                                                            {typeResources.map(
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

                        <Separator className="my-6" />

                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!previousChapter}
                                onClick={() =>
                                    previousChapter &&
                                    router.visit(
                                        `/related/${previousChapter.chapterNumber}`,
                                    )
                                }
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!nextChapter}
                                onClick={() =>
                                    nextChapter &&
                                    router.visit(
                                        `/related/${nextChapter.chapterNumber}`,
                                    )
                                }
                            >
                                Next
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <Dialog
                    open={!!selectedResource}
                    onOpenChange={(open) => !open && void handleSeeMore(-1)}
                >
                    <DialogContent className="max-w-[80rem]">
                        <DialogHeader className="pr-8">
                            <DialogTitle className="text-base leading-tight sm:text-[1.05rem]">
                                {selectedResource?.title || 'Full Description'}
                            </DialogTitle>
                            {selectedResource?.url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 h-7 w-fit gap-1.5 px-2.5 text-[11px] font-medium"
                                    asChild
                                >
                                    <a
                                        href={selectedResource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
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
                                onClick={() => void handleSeeMore(-1)}
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <AddResourceModal
                    open={isAddResourceOpen}
                    onOpenChange={setIsAddResourceOpen}
                    chapterId={chapterNumber}
                />
            </QuranReaderLayout>
        </>
    );
}
