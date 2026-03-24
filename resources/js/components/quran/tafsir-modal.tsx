import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { VerseCard } from '@/components/quran/verse-card';
import { useTafsirModal } from '@/hooks/features';

interface TafsirModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chapterId: number;
    verseNumber: number;
    chapterNumber?: number;
    totalVerses?: number;
}

export function TafsirModal({
    open,
    onOpenChange,
    chapterId,
    verseNumber,
    chapterNumber,
    totalVerses = 1,
}: TafsirModalProps) {
    const {
        tafseerBooks,
        chapters,
        mainVerse,
        tafsirData,
        isLoadingBooks,
        isLoadingTafsir,
        loadingMainVerse,
        error,
        isTransitioning,
        isNavigating,
        currentVerse,
        selectedBookSlug,
        setSelectedBookSlug,
        setCurrentVerse,
        handleNextVerse,
        handlePrevVerse,
        handleBookChange,
    } = useTafsirModal({
        open,
        chapterId,
        verseNumber,
        totalVerses,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-screen w-screen max-w-none flex-col overflow-hidden p-4 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-6xl sm:p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Tafsir (Verse {currentVerse.verseNumber}
                        {chapterNumber && ` - Surah ${chapterNumber}`})
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                    {/* Tafseer Book Selector */}
                    <div className="flex shrink-0 items-center gap-2">
                        <label className="text-sm font-medium whitespace-nowrap">
                            Tafsir Book:
                        </label>
                        <Select
                            value={selectedBookSlug}
                            onValueChange={handleBookChange}
                            disabled={isLoadingBooks}
                        >
                            <SelectTrigger className="flex-1">
                                <SelectValue
                                    placeholder={
                                        isLoadingBooks
                                            ? 'Loading books...'
                                            : 'Select tafsir book'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {tafseerBooks.map((book) => (
                                    <SelectItem key={book.id} value={book.slug}>
                                        {book.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Navigation */}
                    <div className="flex shrink-0 items-center justify-between gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevVerse}
                                    disabled={
                                        isLoadingTafsir ||
                                        isNavigating ||
                                        (tafsirData?.fromAyah
                                            ? parseInt(
                                                  tafsirData.fromAyah.split(
                                                      ':',
                                                  )[1],
                                              ) <= 1
                                            : currentVerse.verseNumber <= 1)
                                    }
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Go to previous verse
                            </TooltipContent>
                        </Tooltip>

                        <span className="text-sm text-muted-foreground">
                            {tafsirData?.fromAyah && tafsirData?.toAyah
                                ? `Verses ${tafsirData.fromAyah} - ${tafsirData.toAyah}`
                                : `Verse ${currentVerse.verseNumber}`}{' '}
                            of {totalVerses}
                        </span>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextVerse}
                                    disabled={
                                        isLoadingTafsir ||
                                        isNavigating ||
                                        (tafsirData?.toAyah
                                            ? parseInt(
                                                  tafsirData.toAyah.split(
                                                      ':',
                                                  )[1],
                                              ) >= totalVerses
                                            : currentVerse.verseNumber >=
                                              totalVerses)
                                    }
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Go to next verse</TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Tafsir Content */}
                    <div className="flex-1 overflow-y-auto rounded-lg">
                        {/* Main Verse Card */}
                        {loadingMainVerse ? (
                            <div className="mb-6 space-y-3 sm:rounded-lg sm:border sm:bg-card sm:p-4">
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-5 w-3/4" />
                            </div>
                        ) : mainVerse ? (
                            <div className="mb-6">
                                <VerseCard
                                    className="mb-0 border-0 bg-transparent p-0 shadow-none sm:rounded-lg sm:border-2 sm:bg-white/70 sm:p-3"
                                    contentClassName="px-0 py-0 sm:px-4 sm:py-2 md:p-1"
                                    verse={mainVerse}
                                    showTranslation
                                    hideHeaderActions
                                />
                            </div>
                        ) : null}

                        {isLoadingTafsir ? (
                            // Show skeleton loader
                            <div className="animate-in space-y-4 duration-700 fade-in">
                                {/* Verse range skeleton */}
                                <div className="border-b pb-2">
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                {/* Content skeletons */}
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-[90%]" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-[95%]" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-[85%]" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-[92%]" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-[88%]" />
                            </div>
                        ) : error ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <p className="text-muted-foreground">{error}</p>
                            </div>
                        ) : tafsirData ? (
                            <div className="animate-in space-y-4 duration-700 fade-in">
                                {/* Verse range info if applicable */}
                                {tafsirData.fromAyah && tafsirData.toAyah && (
                                    <div className="border-b pb-2 text-sm text-muted-foreground">
                                        <span className="font-medium">
                                            Verse Range:
                                        </span>{' '}
                                        {tafsirData.fromAyah} -{' '}
                                        {tafsirData.toAyah}
                                    </div>
                                )}

                                {/* Tafsir text */}
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: tafsirData.text,
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <p className="text-muted-foreground">
                                    No tafsir available for this verse.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
