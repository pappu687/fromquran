import { VerseCard } from '@/components/quran/verse-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { BookOpen, Search as SearchIcon } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

interface VerseResult {
    id: number | null;
    chapterId: number;
    chapterName?: string;
    chapterNumber?: number;
    verseNumber: number;
    text: string;
    translation?: string | null;
    juzNumber?: number | null;
    pageNumber?: number | null;
    hasResources?: boolean;
    resourceCount?: number;
}

interface SearchPageProps {
    query?: string;
    edition: string;
    results: VerseResult[];
    currentPage: number;
    perPage: number;
    total: number;
    chapters: {
        id: number;
        number: number;
        name: string;
        englishName: string;
        englishNameTranslation: string;
        revelationType: 'Meccan' | 'Medinan';
        verses: number;
    }[];
}

export default function SearchPage({
    query = '',
    edition,
    results,
    currentPage,
    perPage,
    total,
    chapters,
}: SearchPageProps) {
    const [localQuery, setLocalQuery] = useState(query);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setLocalQuery(query);
    }, [query]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!localQuery.trim()) {
            return;
        }

        setIsSubmitting(true);

        router.get(
            '/search',
            { query: localQuery, page: 1 },
            {
                preserveScroll: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const hasResults = results.length > 0;
    const showingFrom = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const showingTo = total === 0 ? 0 : Math.min(currentPage * perPage, total);

    const changePage = (page: number) => {
        if (page < 1 || page > totalPages) {
            return;
        }

        router.get(
            '/search',
            { query, page },
            { preserveScroll: true, preserveState: true },
        );
    };

    const getVisiblePages = () => {
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        if (currentPage <= 3) {
            return [1, 2, 3, 4, totalPages];
        }

        if (currentPage >= totalPages - 2) {
            return [
                1,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages,
            ];
        }

        return [1, currentPage - 1, currentPage, currentPage + 1, totalPages];
    };

    return (
        <>
            <Head title="Search the Qur'an" />
            <QuranReaderLayout
                chapters={chapters}
                selectedChapter={undefined}
                onChapterSelect={(chapterId) => {
                    const chapter = chapters.find(
                        (item) => item.id === chapterId,
                    );
                    if (!chapter) {
                        return;
                    }

                    router.visit(`/${chapter.number}`);
                }}
            >
                <div className="flex flex-1 flex-col bg-[#fafaf8] px-4 py-5">
                    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 py-4 sm:gap-10 sm:py-6">
                        <section className="border-b border-slate-200 pb-6 sm:pb-8">
                            <div className="max-w-3xl">
                                <h1 className="font-young mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                                    Search the Qur&apos;an with context
                                </h1>
                                <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
                                    Find verses quickly, keep the Arabic and
                                    translation readable, and jump straight into
                                    the full reading context.
                                </p>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="mt-6 max-w-3xl sm:mt-7"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <div className="relative flex-1">
                                        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="q"
                                            value={localQuery}
                                            onChange={(e) =>
                                                setLocalQuery(e.target.value)
                                            }
                                            placeholder="Search a word, phrase, or theme"
                                            className="h-12 rounded-full border-slate-200 bg-white pr-4 pl-11 text-base shadow-none focus-visible:ring-1 focus-visible:ring-slate-900"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="h-12 rounded-full px-6"
                                    >
                                        {isSubmitting ? 'Searching…' : 'Search'}
                                    </Button>
                                </div>
                            </form>
                        </section>

                        {query && (
                            <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                                        Results
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                        {hasResults
                                            ? `Matches for “${query}”`
                                            : `No results for “${query}”`}
                                    </h2>
                                    <p className="mt-2 text-sm leading-7 text-slate-500">
                                        {hasResults
                                            ? `Showing ${showingFrom}-${showingTo} of ${total} matches.`
                                            : 'Try a shorter phrase, another spelling, or a broader term.'}
                                    </p>
                                </div>

                                {hasResults && (
                                    <div className="flex flex-wrap gap-2">
                                        <div className="rounded-full bg-white px-3 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <div className="rounded-full bg-white px-3 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200">
                                            {total} results
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {!query && (
                            <section className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-none">
                                <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                                <h2 className="mt-4 text-xl font-semibold text-slate-950">
                                    Start with a search
                                </h2>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                                    Enter a name, phrase, or topic to explore
                                    matching verses.
                                </p>
                            </section>
                        )}

                        {query && !hasResults && (
                            <section className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-none">
                                <SearchIcon className="mx-auto h-10 w-10 text-slate-300" />
                                <h2 className="mt-4 text-xl font-semibold text-slate-950">
                                    No verses found
                                </h2>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                                    No matches were found for “{query}”. Try a
                                    broader keyword or a shorter phrase.
                                </p>
                            </section>
                        )}

                        {hasResults && (
                            <main className="space-y-5">
                                {results.map((verse) => (
                                    <div
                                        key={`${verse.chapterId}-${verse.verseNumber}-${verse.id ?? 'n'}`}
                                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-none"
                                    >
                                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4">
                                            <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600 uppercase">
                                                {verse.chapterName ??
                                                    `Surah ${verse.chapterId}`}
                                            </span>
                                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                                Ayah {verse.verseNumber}
                                            </span>
                                        </div>

                                        <VerseCard
                                            verse={{
                                                id: verse.id ?? 0,
                                                chapterId: verse.chapterId,
                                                chapterNumber:
                                                    verse.chapterNumber ??
                                                    verse.chapterId,
                                                verseNumber: verse.verseNumber,
                                                text: verse.text,
                                                translations: verse.translation
                                                    ? [
                                                          {
                                                              resource_id: 0,
                                                              text: verse.translation,
                                                          },
                                                      ]
                                                    : undefined,
                                                juzNumber: verse.juzNumber ?? 0,
                                                pageNumber:
                                                    verse.pageNumber ?? 0,
                                                resourceCount:
                                                    verse.resourceCount ?? 0,
                                            }}
                                            hasResources={
                                                verse.hasResources ?? false
                                            }
                                            resourceCount={
                                                verse.resourceCount ?? 0
                                            }
                                            showTranslation
                                            hideHeaderActions={false}
                                            className={cn(
                                                'border-0 bg-transparent p-5 pt-3 shadow-none',
                                            )}
                                        />
                                    </div>
                                ))}

                                {totalPages > 1 && (
                                    <section className="flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-slate-500">
                                            Showing {showingFrom} to {showingTo}{' '}
                                            of {total} matches
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === 1}
                                                onClick={() =>
                                                    changePage(currentPage - 1)
                                                }
                                                className="rounded-full shadow-none"
                                            >
                                                Previous
                                            </Button>

                                            {getVisiblePages().map(
                                                (page, index, pages) => {
                                                    const previousPage =
                                                        pages[index - 1];
                                                    const shouldShowGap =
                                                        previousPage !==
                                                            undefined &&
                                                        page - previousPage > 1;

                                                    return (
                                                        <div
                                                            key={page}
                                                            className="flex items-center gap-2"
                                                        >
                                                            {shouldShowGap && (
                                                                <span className="px-1 text-sm text-slate-400">
                                                                    ...
                                                                </span>
                                                            )}
                                                            <Button
                                                                variant={
                                                                    page ===
                                                                    currentPage
                                                                        ? 'default'
                                                                        : 'outline'
                                                                }
                                                                size="sm"
                                                                onClick={() =>
                                                                    changePage(
                                                                        page,
                                                                    )
                                                                }
                                                                className="min-w-10 rounded-full shadow-none"
                                                            >
                                                                {page}
                                                            </Button>
                                                        </div>
                                                    );
                                                },
                                            )}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                                onClick={() =>
                                                    changePage(currentPage + 1)
                                                }
                                                className="rounded-full shadow-none"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </section>
                                )}
                            </main>
                        )}
                    </div>
                </div>
            </QuranReaderLayout>
        </>
    );
}
