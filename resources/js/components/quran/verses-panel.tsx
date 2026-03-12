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
        data: any[];
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
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>Select a chapter to start reading</p>
            </div>
        );
    }

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
                        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
                            <p>Error: {error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={retry}
                                className="mt-2"
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {verses.length === 0 && !loading && !error && (
                        <div className="py-8 text-center text-muted-foreground">
                            <p>No verses found</p>
                        </div>
                    )}

                    {/* Verses */}
                    {mode === 'list' ? (
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
                                onBookmarkToggle={() =>
                                    handleBookmarkToggle(verse as Verse)
                                }
                                onCopy={handleCopy}
                                onPlayAudio={handlePlayAudio}
                                showTranslation={showTranslation}
                            />
                        ))
                    ) : (
                        <VerseReading verses={verses} />
                    )}

                    {/* Load More Button */}
                    {!fromVerse && !toVerse && hasMore && (
                        <div className="mt-6 flex justify-center">
                            <Button
                                variant="outline"
                                onClick={loadMore}
                                disabled={loading}
                                className="min-w-32"
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
                            <div className="py-8 text-center text-muted-foreground">
                                <Separator className="mb-4" />
                                <p>You've reached the end of this chapter</p>
                            </div>
                        )}

                    {/* Continue button for single-verse/range view */}
                    {fromVerse && chapter && (
                        <div className="mt-6 flex justify-center">
                            <Button
                                variant="outline"
                                className="min-w-32 border-2 border-amber-400 text-amber-900"
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
