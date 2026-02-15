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
import { useEffect, useState } from 'react';

interface TafseerBook {
    id: number;
    name: string;
    slug: string;
    description: string;
}

interface TafsirData {
    tafsirId: number;
    bookName: string;
    bookSlug: string;
    ayahKey: string;
    text: string;
    fromAyah?: string;
    toAyah?: string;
    ayahKeys: string[];
    chapterId: number;
    verseNumber: number;
}

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
    const [tafseerBooks, setTafseerBooks] = useState<TafseerBook[]>([]);
    const [selectedBookSlug, setSelectedBookSlug] = useState<string>('en-ibn-katheer');
    const [tafsirData, setTafsirData] = useState<TafsirData | null>(null);
    const [previousTafsirData, setPreviousTafsirData] = useState<TafsirData | null>(null);
    const [isLoadingBooks, setIsLoadingBooks] = useState(false);
    const [isLoadingTafsir, setIsLoadingTafsir] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentVerse, setCurrentVerse] = useState({ chapterId, verseNumber });
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // Fetch tafseer books when modal opens
    useEffect(() => {
        if (open && tafseerBooks.length === 0) {
            fetchTafseerBooks();
        }
    }, [open]);

    // Fetch tafsir when selected book or verse changes
    useEffect(() => {
        if (open && selectedBookSlug) {
            fetchTafsir();
        }
    }, [selectedBookSlug, currentVerse, open]);

    const fetchTafseerBooks = async () => {
        setIsLoadingBooks(true);
        setError(null);
        try {
            const response = await fetch('/api/quran/tafseer-books');
            if (response.ok) {
                const data = await response.json();
                setTafseerBooks(data);
            } else {
                setError('Failed to fetch tafseer books');
            }
        } catch (err) {
            console.error('Failed to fetch tafseer books:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsLoadingBooks(false);
        }
    };

    const fetchTafsir = async () => {
        // Keep previous content visible during loading
        if (tafsirData) {
            setPreviousTafsirData(tafsirData);
        }
        setIsLoadingTafsir(true);
        setIsTransitioning(true);
        setError(null);
        try {
            const response = await fetch(
                `/api/quran/tafsir/${currentVerse.chapterId}/${currentVerse.verseNumber}?tafsir=${selectedBookSlug}`
            );
            if (response.ok) {
                const data = await response.json();
                setTafsirData(data);
            } else if (response.status === 404) {
                setTafsirData(null);
                setError('No tafsir found for this verse in the selected book.');
            } else {
                setError('Failed to fetch tafsir');
            }
        } catch (err) {
            console.error('Failed to fetch tafsir:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsLoadingTafsir(false);
            setIsTransitioning(false);
            setIsNavigating(false);
        }
    };

    const handleNextVerse = () => {
        if (isNavigating || isLoadingTafsir) return;

        // If current tafsir spans multiple verses, jump to the verse after the range
        if (tafsirData?.toAyah) {
            const [, toVerseNum] = tafsirData.toAyah.split(':').map(Number);
            const nextVerse = toVerseNum + 1;
            if (nextVerse <= totalVerses) {
                setIsNavigating(true);
                setCurrentVerse({
                    ...currentVerse,
                    verseNumber: nextVerse,
                });
            }
        } else if (currentVerse.verseNumber + 1 <= totalVerses) {
            setIsNavigating(true);
            setCurrentVerse({
                ...currentVerse,
                verseNumber: currentVerse.verseNumber + 1,
            });
        }
    };

    const handlePrevVerse = () => {
        if (isNavigating || isLoadingTafsir) return;

        // If current tafsir spans multiple verses, jump to the verse before the range
        if (tafsirData?.fromAyah) {
            const [, fromVerseNum] = tafsirData.fromAyah.split(':').map(Number);
            const prevVerse = fromVerseNum - 1;
            if (prevVerse >= 1) {
                setIsNavigating(true);
                setCurrentVerse({
                    ...currentVerse,
                    verseNumber: prevVerse,
                });
            }
        } else if (currentVerse.verseNumber - 1 >= 1) {
            setIsNavigating(true);
            setCurrentVerse({
                ...currentVerse,
                verseNumber: currentVerse.verseNumber - 1,
            });
        }
    };

    const handleBookChange = (slug: string) => {
        setSelectedBookSlug(slug);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Tafsir (Verse {currentVerse.verseNumber}
                        {chapterNumber && ` - Surah ${chapterNumber}`})
                    </DialogTitle>
                    <DialogDescription>
                        Read detailed explanation and commentary of this verse
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                    {/* Tafseer Book Selector */}
                    <div className="flex items-center gap-2 shrink-0">
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
                                        isLoadingBooks ? 'Loading books...' : 'Select tafsir book'
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
                    <div className="flex items-center justify-between gap-2 shrink-0">
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
                                            ? parseInt(tafsirData.fromAyah.split(':')[1]) <= 1
                                            : currentVerse.verseNumber <= 1)
                                    }
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Go to previous verse</TooltipContent>
                        </Tooltip>

                        <span className="text-sm text-muted-foreground">
                            {tafsirData?.fromAyah && tafsirData?.toAyah
                                ? `Verses ${tafsirData.fromAyah} - ${tafsirData.toAyah}`
                                : `Verse ${currentVerse.verseNumber}`} of {totalVerses}
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
                                            ? parseInt(tafsirData.toAyah.split(':')[1]) >= totalVerses
                                            : currentVerse.verseNumber >= totalVerses)
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
                    <div className="flex-1 overflow-y-auto border rounded-lg p-6">
                        {isLoadingTafsir ? (
                            // Show skeleton loader
                            <div className="space-y-4 animate-in fade-in duration-700">
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
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <p className="text-muted-foreground">{error}</p>
                            </div>
                        ) : tafsirData ? (
                            <div className="space-y-4 animate-in fade-in duration-700">
                                {/* Verse range info if applicable */}
                                {tafsirData.fromAyah && tafsirData.toAyah && (
                                    <div className="text-sm text-muted-foreground border-b pb-2">
                                        <span className="font-medium">Verse Range:</span> {tafsirData.fromAyah} - {tafsirData.toAyah}
                                    </div>
                                )}

                                {/* Tafsir text */}
                                <div
                                    className="prose prose-sm max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: tafsirData.text }}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <p className="text-muted-foreground">No tafsir available for this verse.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
