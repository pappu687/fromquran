import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { useReaderSettings } from '@/contexts/reader-settings-context';
import { useReadingMode } from '@/contexts/reading-mode-context';
import { useVersesPanel } from '@/hooks/use-verses-panel';
import { cn } from '@/lib/utils';
import {
    type ChapterSummary,
    type PaginatedVersesResponse,
    type VerseAnnotation,
    type VerseListItem,
} from '@/types/quran';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VerseCard } from './verse-card';
import { VerseReading } from './verse-reading';
import { VerseSearchSheet } from './verse-search-sheet';

interface VersesPanelProps {
    chapter?: ChapterSummary;
    initialVerses?: PaginatedVersesResponse;
    apiUrl?: string;
    pageSize?: number;
    showTranslation?: boolean;
    className?: string;
    fromVerse?: number;
    toVerse?: number;
    startFromVerse?: number;
    chapters?: ChapterSummary[];
    onChapterChange?: (chapter: ChapterSummary) => void;
    onCurrentAyahChange?: (ayah: number) => void;
    onJumpHandlerChange?: (
        handler: ((ayahNumber: number) => Promise<boolean>) | undefined,
    ) => void;
}

export function VersesPanel({
    chapter,
    initialVerses,
    apiUrl = '/api/quran',
    pageSize = 10,
    showTranslation = true,
    className,
    fromVerse,
    toVerse,
    startFromVerse,
    chapters,
    onChapterChange,
    onCurrentAyahChange,
    onJumpHandlerChange,
}: VersesPanelProps) {
    const { mode } = useReadingMode();
    const { settings } = useReaderSettings();
    const { user } = useAuth();
    const [annotationsByVerse, setAnnotationsByVerse] = useState<
        Record<number, VerseAnnotation[]>
    >({});
    const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const highlightTimeoutRef = useRef<number | null>(null);
    const highlightedStartVerseRef = useRef<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string | null>(null);
    const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const handleSearch = useCallback((text: string) => {
        setSearchQuery(text);
        setIsSearchSheetOpen(true);
    }, []);

    const {
        verses,
        loading,
        error,
        hasMore,
        activeChapter,
        autoAdvancedChapterId,
        bookmarkedVerses,
        showLoginAlert,
        showErrorAlert,
        errorAlertMessage,
        showSuccessAlert,
        successAlertMessage,
        loadMore,
        handleBookmarkToggle,
        handleCopy,
        handlePlayAudio,
        setShowLoginAlert,
        setShowErrorAlert,
        setShowSuccessAlert,
        retry,
        clearAutoAdvanceChapter,
    } = useVersesPanel({
        chapter,
        initialVerses,
        apiUrl,
        pageSize,
        fromVerse,
        toVerse,
        startFromVerse,
        chapters,
        onChapterChange,
    });

    const verseIdsKey = verses.map((verse) => verse.id).join(',');

    useEffect(() => {
        return () => {
            if (highlightTimeoutRef.current) {
                window.clearTimeout(highlightTimeoutRef.current);
            }
        };
    }, []);

    const flashAyah = useCallback((ayahNumber: number) => {
        if (highlightTimeoutRef.current) {
            window.clearTimeout(highlightTimeoutRef.current);
        }

        setHighlightedAyah(ayahNumber);
        highlightTimeoutRef.current = window.setTimeout(() => {
            setHighlightedAyah((current) =>
                current === ayahNumber ? null : current,
            );
        }, 1200);
    }, []);

    const scrollToAyah = useCallback(
        (ayahNumber: number, behavior: ScrollBehavior = 'smooth') => {
            if (!chapter) {
                return false;
            }

            const element = document.getElementById(
                `verse-${chapter.id}-${ayahNumber}`,
            );

            if (!element) {
                return false;
            }

            const y = element.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({
                top: Math.max(0, y),
                behavior,
            });
            flashAyah(ayahNumber);
            onCurrentAyahChange?.(ayahNumber);

            return true;
        },
        [chapter, flashAyah, onCurrentAyahChange],
    );

    useEffect(() => {
        if (!user || verses.length === 0) {
            setAnnotationsByVerse({});
            return;
        }

        let isCancelled = false;

        const fetchAnnotations = async () => {
            try {
                const response = await fetch(
                    `/api/verse-annotations?verse_ids=${verseIdsKey}`,
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error('Failed to load annotations.');
                }

                const payload = (await response.json()) as {
                    data: VerseAnnotation[];
                };

                if (isCancelled) {
                    return;
                }

                const grouped = payload.data.reduce(
                    (accumulator, annotation) => {
                        if (!accumulator[annotation.verse_id]) {
                            accumulator[annotation.verse_id] = [];
                        }

                        accumulator[annotation.verse_id].push(annotation);
                        accumulator[annotation.verse_id].sort(
                            (left, right) =>
                                left.start_offset - right.start_offset,
                        );

                        return accumulator;
                    },
                    {} as Record<number, VerseAnnotation[]>,
                );

                setAnnotationsByVerse(grouped);
            } catch {
                if (!isCancelled) {
                    setAnnotationsByVerse({});
                }
            }
        };

        fetchAnnotations();

        return () => {
            isCancelled = true;
        };
    }, [user, verseIdsKey, verses.length]);

    const handleAnnotationCreated = (annotation: VerseAnnotation) => {
        setAnnotationsByVerse((current) => {
            const existing = current[annotation.verse_id] ?? [];
            const next = [...existing, annotation].sort(
                (left, right) => left.start_offset - right.start_offset,
            );

            return {
                ...current,
                [annotation.verse_id]: next,
            };
        });
    };

    useEffect(() => {
        onJumpHandlerChange?.(
            !chapter
                ? undefined
                : async (ayahNumber: number) => {
                      if (fromVerse || toVerse) {
                          router.visit(
                              `/${chapter.number}?start-verse=${ayahNumber}`,
                          );

                          return true;
                      }

                      if (scrollToAyah(ayahNumber)) {
                          return true;
                      }

                      // When the target ayah is not rendered yet, reopen the
                      // chapter centered around it using the existing
                      // start-verse flow.
                      router.visit(
                          `/${chapter.number}?start-verse=${ayahNumber}`,
                      );

                      return true;
                  },
        );

        return () => {
            onJumpHandlerChange?.(undefined);
        };
    }, [
        chapter,
        fromVerse,
        onJumpHandlerChange,
        scrollToAyah,
        toVerse,
    ]);

    useEffect(() => {
        if (!chapter || !containerRef.current || verses.length === 0) {
            return;
        }

        let frameId = 0;

        const updateCurrentAyah = () => {
            const ayahElements = Array.from(
                containerRef.current?.querySelectorAll<HTMLElement>(
                    '[data-ayah-number]',
                ) ?? [],
            );

            if (!ayahElements.length) {
                return;
            }

            const topOffset = 92;
            let closestAyah = Number.parseInt(
                ayahElements[0].dataset.ayahNumber ?? '1',
                10,
            );
            let closestDistance = Number.POSITIVE_INFINITY;

            ayahElements.forEach((element) => {
                const ayahNumber = Number.parseInt(
                    element.dataset.ayahNumber ?? '',
                    10,
                );

                if (!ayahNumber) {
                    return;
                }

                const rect = element.getBoundingClientRect();

                if (rect.bottom <= topOffset) {
                    closestAyah = ayahNumber;
                    closestDistance = 0;
                    return;
                }

                const distance = Math.abs(rect.top - topOffset);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestAyah = ayahNumber;
                }
            });

            onCurrentAyahChange?.(closestAyah);
        };

        const requestUpdate = () => {
            if (frameId) {
                window.cancelAnimationFrame(frameId);
            }

            frameId = window.requestAnimationFrame(updateCurrentAyah);
        };

        requestUpdate();
        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate);

        return () => {
            if (frameId) {
                window.cancelAnimationFrame(frameId);
            }

            window.removeEventListener('scroll', requestUpdate);
            window.removeEventListener('resize', requestUpdate);
        };
    }, [chapter, onCurrentAyahChange, verses]);

    useEffect(() => {
        if (!chapter || !startFromVerse || verses.length === 0) {
            return;
        }

        const key = `${chapter.id}:${startFromVerse}`;

        if (highlightedStartVerseRef.current === key) {
            return;
        }

        if (scrollToAyah(startFromVerse)) {
            highlightedStartVerseRef.current = key;
        }
    }, [chapter, scrollToAyah, startFromVerse, verses]);

    // Intersection observer for lazy loading
    useEffect(() => {
        const element = loadMoreRef.current;
        if (!element || !hasMore || loading) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    loadMore();
                }
            },
            {
                root: null,
                rootMargin: '0px 0px 400px 0px',
                threshold: 0,
            },
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [hasMore, loading, loadMore]);

    // Auto-scroll to verse 1 when lazy loading advances to a new chapter
    useEffect(() => {
        if (
            !activeChapter ||
            autoAdvancedChapterId !== activeChapter.id
        ) {
            return;
        }

        const el = document.getElementById(
            `verse-${activeChapter.id}-1`,
        );

        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        clearAutoAdvanceChapter();
    }, [activeChapter, autoAdvancedChapterId, clearAutoAdvanceChapter]);

    if (!chapter) {
        return (
            <div className="flex h-full items-center justify-center px-4 py-12">
                <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center text-slate-500 shadow-none">
                    <p>Select a chapter to start reading</p>
                </div>
            </div>
        );
    }

    const showChapterLoadingSkeleton = loading && verses.length === 0 && !error;

    return (
        <div
            className={cn(
                'flex flex-col',
                'w-full', // full width by default
                'max-w-full', // prevent overflowing
                'md:max-w-[280mm]', // A4 width (~210mm) for md and up
                'md:mx-auto', // center on md+
                className,
            )}
        >
            {/* Verses Content */}
            <div ref={containerRef}>
                <div className="px-0 py-4 md:p-4">
                    {error && (
                        <div className="mb-4 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
                            <p className="text-sm font-medium">
                                Error: {error}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={retry}
                                className="mt-3 rounded-full border-red-200 bg-white text-red-700 shadow-none hover:bg-red-100"
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {verses.length === 0 && !loading && !error && (
                        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500 shadow-none">
                            <p>No verses found</p>
                        </div>
                    )}

                    {/* Bismillah — shown before verse 1 for all chapters except chapter 9 */}
                    {activeChapter?.number !== 9 &&
                        verses.length > 0 &&
                        verses[0]?.verseNumber === 1 && (
                        <div className="mb-6 flex justify-center py-4">
                            <p
                                className="font-arabic text-center leading-loose text-foreground/90"
                                dir="rtl"
                                aria-label="Bismillahir Rahmanir Rahim"
                                style={{
                                    fontSize: `${settings.fontSize * 1.1}rem`,
                                }}
                            >
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </p>
                        </div>
                    )}

                    {showChapterLoadingSkeleton && (
                        <div className="space-y-6">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="rounded-3xl border border-slate-200 bg-white px-4 py-5 md:px-5"
                                >
                                    <div className="mb-5 flex items-center justify-between">
                                        <Skeleton className="h-8 w-8 rounded-[40%]" />
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
                                    </div>
                                    <div className="mb-5 space-y-3">
                                        <Skeleton className="ml-auto h-8 w-5/6" />
                                        <Skeleton className="ml-auto h-8 w-4/6" />
                                    </div>
                                    {showTranslation && (
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-[92%]" />
                                            <Skeleton className="h-4 w-[78%]" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Verses */}
                    {!showChapterLoadingSkeleton && mode === 'list' ? (
                        verses.map((verse) => (
                            <div
                                key={verse.id}
                                id={`verse-${verse.chapterId}-${verse.verseNumber}`}
                                data-ayah-number={verse.verseNumber}
                                className={cn(
                                    'scroll-mt-24 rounded-[28px] transition-colors duration-700',
                                    highlightedAyah === verse.verseNumber &&
                                        'bg-amber-100/75 ring-1 ring-amber-300/60',
                                )}
                            >
                                <VerseCard
                                    className="bg-transparent px-0 py-3 md:p-3"
                                    verse={{
                                        ...verse,
                                        chapterId: verse.chapterId,
                                        chapterNumber:
                                            verse.chapterNumber ??
                                            activeChapter?.number,
                                    }}
                                    totalVerses={activeChapter?.verses}
                                    isBookmarked={bookmarkedVerses.has(
                                        verse.id.toString(),
                                    )}
                                    hasResources={verse.hasResources || false}
                                    resourceCount={verse.resourceCount || 0}
                                    onBookmarkToggle={() =>
                                        handleBookmarkToggle(
                                            verse as VerseListItem,
                                        )
                                    }
                                    annotations={
                                        annotationsByVerse[verse.id] ?? []
                                    }
                                    onAnnotationCreated={handleAnnotationCreated}
                                    onSearch={handleSearch}
                                    onCopy={handleCopy}
                                    onPlayAudio={handlePlayAudio}
                                    showTranslation={showTranslation}
                                />
                            </div>
                        ))
                    ) : !showChapterLoadingSkeleton ? (
                        <VerseReading
                            annotationsByVerse={annotationsByVerse}
                            highlightedAyah={highlightedAyah}
                            verses={verses}
                            onSearch={handleSearch}
                        />
                    ) : null}

                    {/* Lazy loading sentinel & spinner */}
                    {hasMore && (
                        <div
                            ref={loadMoreRef}
                            className="flex justify-center py-4"
                            aria-hidden="true"
                        />
                    )}

                    {loading && verses.length > 0 && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    )}

                    {/* Load More Button (fallback) */}
                    {!showChapterLoadingSkeleton &&
                        !fromVerse &&
                        !toVerse &&
                        hasMore && (
                            <div className="mt-6 flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={loadMore}
                                    disabled={loading}
                                    className="min-w-36 rounded-full border-slate-200 bg-white px-5 shadow-none"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        'Load More Verses'
                                    )}
                                </Button>
                            </div>
                        )}

                    {/* End Message */}
                    {!fromVerse &&
                        !toVerse &&
                        !hasMore &&
                        verses.length > 0 && (
                            <div className="py-8 text-center text-slate-500">
                                <Separator className="mb-4 bg-slate-200" />
                                <p>You've reached the end of this chapter</p>
                            </div>
                        )}

                    {/* Continue button for single-verse/range view */}
                    {fromVerse && chapter && (
                        <div className="mt-6 flex justify-center">
                            <Button
                                variant="outline"
                                className="min-w-36 rounded-full border-amber-200 bg-amber-50 px-5 text-amber-900 shadow-none hover:bg-amber-100"
                                onClick={() =>
                                    router.visit(
                                        `/${chapter.number}?start-verse=${fromVerse}`,
                                    )
                                }
                            >
                                Continue
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Authentication Required
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Please login to your account to bookmark verses and
                            access other features.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => (window.location.href = '/login')}
                        >
                            Login
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showErrorAlert} onOpenChange={setShowErrorAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Error</AlertDialogTitle>
                        <AlertDialogDescription>
                            {errorAlertMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => setShowErrorAlert(false)}
                        >
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={showSuccessAlert}
                onOpenChange={setShowSuccessAlert}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Success</AlertDialogTitle>
                        <AlertDialogDescription>
                            {successAlertMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => setShowSuccessAlert(false)}
                        >
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <VerseSearchSheet
                open={isSearchSheetOpen}
                onOpenChange={setIsSearchSheetOpen}
                searchQuery={searchQuery}
            />
        </div>
    );
}
