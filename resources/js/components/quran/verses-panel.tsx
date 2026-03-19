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
import { useReaderSettings } from '@/contexts/reader-settings-context';
import { useReadingMode } from '@/contexts/reading-mode-context';
import { useVersesPanel } from '@/hooks/use-verses-panel';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { VerseCard } from './verse-card';
import { VerseReading } from './verse-reading';

interface Verse {
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

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    verses?: number;
}

interface VersesPanelProps {
    chapter?: Chapter;
    initialVerses?: {
        data: Verse[];
        total: number;
        has_more: boolean;
    };
    apiUrl?: string;
    pageSize?: number;
    showTranslation?: boolean;
    className?: string;
    fromVerse?: number;
    toVerse?: number;
    startFromVerse?: number;
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
}: VersesPanelProps) {
    const { mode } = useReadingMode();
    const { settings } = useReaderSettings();

    const {
        verses,
        loading,
        error,
        hasMore,
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
    } = useVersesPanel({
        chapter,
        initialVerses,
        apiUrl,
        pageSize,
        fromVerse,
        toVerse,
        startFromVerse,
    });

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
            <div>
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
                    {chapter.number !== 9 && verses.length > 0 && (
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
                            <VerseCard
                                className="bg-transparent px-0 py-3 md:p-3"
                                key={verse.id}
                                verse={{
                                    ...verse,
                                    chapterId: verse.chapterId || chapter?.id,
                                    chapterNumber:
                                        verse.chapterNumber || chapter?.number,
                                }}
                                totalVerses={chapter?.verses}
                                isBookmarked={bookmarkedVerses.has(
                                    verse.id.toString(),
                                )}
                                hasResources={verse.hasResources || false}
                                resourceCount={verse.resourceCount || 0}
                                onBookmarkToggle={() =>
                                    handleBookmarkToggle(verse as Verse)
                                }
                                onCopy={handleCopy}
                                onPlayAudio={handlePlayAudio}
                                showTranslation={showTranslation}
                            />
                        ))
                    ) : !showChapterLoadingSkeleton ? (
                        <VerseReading verses={verses} />
                    ) : null}

                    {/* Load More Button */}
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
        </div>
    );
}
