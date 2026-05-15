import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { VerseCard } from '@/components/quran/verse-card';
import { type VerseListItem } from '@/types/quran';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface VerseSearchSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    searchQuery: string | null;
}

interface SearchResponse {
    data: VerseListItem[];
    total_results: number;
    query: string;
}

export function VerseSearchSheet({
    open,
    onOpenChange,
    searchQuery,
}: VerseSearchSheetProps) {
    const [results, setResults] = useState<VerseListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const RESULTS_PER_PAGE = 10;
    const hasMore = results.length < totalResults;

    const fetchResults = useCallback(
        async (query: string, pageNum: number, append = false) => {
            if (!query) return;

            setIsLoading(true);
            setError(null);

            try {
                // We'll use exact_arabic=1 query param
                const response = await fetch(
                    `/api/quran/search?query=${encodeURIComponent(query)}&exact_arabic=1&limit=${RESULTS_PER_PAGE}&page=${pageNum}`
                );

                if (!response.ok) {
                    throw new Error('Search failed');
                }

                const data = (await response.json()) as SearchResponse;

                if (append) {
                    setResults((prev) => [...prev, ...data.data]);
                } else {
                    setResults(data.data);
                    setTotalResults(data.total_results);
                }
            } catch {
                setError('Failed to fetch search results.');
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        if (open && searchQuery) {
            setPage(1);
            fetchResults(searchQuery, 1, false);
        } else if (!open) {
            // Optional: clear results on close
        }
    }, [open, searchQuery, fetchResults]);

    const loadMore = () => {
        if (isLoading || !hasMore || !searchQuery) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchResults(searchQuery, nextPage, true);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full max-w-sm flex-col border-l border-slate-200 bg-[#f7f7f3] p-0 sm:max-w-[480px]">
                <SheetHeader className="border-b border-slate-200 px-5 py-5 sm:px-6">
                    <SheetTitle className="text-xl tracking-tight text-slate-950">
                        Search Results
                    </SheetTitle>
                    {searchQuery && (
                        <p className="text-sm text-slate-500">
                            {totalResults} results for "{searchQuery}"
                        </p>
                    )}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {isLoading && page === 1 ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-4">
                            {results.map((verse, index) => {
                                const verseTarget = `/${verse.chapterNumber}/${verse.verseNumber}`;
                                return (
                                    <div
                                        key={`${verse.chapterId}-${verse.verseNumber}-${index}`}
                                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-none"
                                    >
                                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4">
                                            <Link
                                                href={verseTarget}
                                                className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600 uppercase transition-colors hover:bg-stone-200"
                                            >
                                                {verse.chapterName ?? `Surah ${verse.chapterId}`}
                                            </Link>
                                            <Link
                                                href={verseTarget}
                                                className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                                            >
                                                Ayah {verse.verseNumber}
                                            </Link>
                                        </div>

                                        <VerseCard
                                            verse={verse}
                                            highlightText={searchQuery ?? undefined}
                                            arabicFontSize="1.5rem"
                                            showTranslation={false}
                                            hideHeaderActions={false}
                                            className={cn(
                                                'border-0 bg-transparent p-5 pt-3 shadow-none',
                                            )}
                                        />
                                    </div>
                                );
                            })}

                            {hasMore && (
                                <div className="mt-6 flex justify-center pb-6">
                                    <Button
                                        variant="outline"
                                        onClick={loadMore}
                                        disabled={isLoading}
                                        className="min-w-36 rounded-full border-slate-200 bg-white px-5 shadow-none"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            'Load More'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : !isLoading && searchQuery ? (
                        <div className="py-12 text-center text-slate-500">
                            <p>No results found for exactly this text.</p>
                        </div>
                    ) : null}
                </div>
            </SheetContent>
        </Sheet>
    );
}
