import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { VerseCard } from '@/components/quran/verse-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import { Field, FieldLabel } from '@/components/ui/field';
import { ButtonGroup } from '@/components/ui/button-group';
import { BookOpen } from 'lucide-react';

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
    // Reader layout props
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
        if (!localQuery.trim()) return;

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

    const hasResults = results && results.length > 0;

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    const changePage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        router.get(
            '/search',
            { query: query, page },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Search the Qur'an" />
            <QuranReaderLayout
                chapters={chapters}
                selectedChapter={undefined}
                onChapterSelect={(chapterId) => {
                    const chapter = chapters.find((c) => c.id === chapterId);
                    if (!chapter) return;
                    router.visit(`/${chapter.number}`);
                }}
            >
                <div className="flex flex-1 flex-col px-4 py-5">
                    <div className="mx-auto h-full w-full max-w-3xl">
                        {/* Header & Search box */}
                        <section className="mt-8 mb-10 text-center">
                            <h1 className="mb-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                Search the Qur'an
                            </h1>
                            <form
                                onSubmit={handleSubmit}
                                className="mx-auto max-w-2xl"
                            >
                                <Field className="w-full">
                                    <ButtonGroup className="w-full shadow-sm">
                                        <Input
                                            id="q"
                                            value={localQuery}
                                            onChange={(e) =>
                                                setLocalQuery(e.target.value)
                                            }
                                            placeholder=""
                                            className="h-12 flex-1 rounded-r-none border-border bg-background px-4 text-base focus-visible:ring-1 focus-visible:ring-blue-500"
                                        />
                                        <Button
                                            type="submit"
                                            className="h-12 rounded-l-none bg-blue-500 px-8 text-base font-medium text-white hover:bg-blue-600"
                                        >
                                            {isSubmitting
                                                ? 'Searching…'
                                                : 'Search'}
                                        </Button>
                                    </ButtonGroup>
                                </Field>
                                <p className="mt-3 text-left text-[13px] text-muted-foreground">
                                    Press Enter to search.
                                </p>
                            </form>
                        </section>

                        {/* Results */}
                        <main className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                            {query && !hasResults && (
                                <div className="mt-8 text-center text-sm text-muted-foreground">
                                    <p>
                                        No verses found for{' '}
                                        <span className="font-semibold text-foreground">
                                            “{query}”
                                        </span>
                                        . Try different wording or a shorter
                                        phrase.
                                    </p>
                                </div>
                            )}

                            {hasResults && (
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                                        <p>
                                            Showing{' '}
                                            <span className="font-medium text-foreground">
                                                {results.length}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-medium text-foreground">
                                                {total}
                                            </span>{' '}
                                            matches for{' '}
                                            <span className="font-medium text-blue-500">
                                                "{query}"
                                            </span>
                                            .
                                        </p>
                                        <p>
                                            Page {currentPage} of {totalPages}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {results.map((verse) => (
                                            <div
                                                key={`${verse.chapterId}-${verse.verseNumber}-${verse.id ?? 'n'}`}
                                                className="overflow-hidden rounded-[16px] border border-border/50 bg-background"
                                            >
                                                <div className="flex items-center justify-between px-5 pt-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex items-center justify-center gap-2 rounded bg-muted/50 px-2 py-1 text-[10px] font-bold tracking-widest text-[#7D8893] uppercase">
                                                            {verse.chapterName ??
                                                                `Surah ${verse.chapterId}`}
                                                        </span>
                                                        <div className="flex h-5 items-center justify-center rounded-sm bg-muted/40 px-1.5 text-[11px] font-bold text-foreground/80 ring-1 ring-foreground/10 ring-inset">
                                                            {verse.verseNumber}
                                                        </div>
                                                    </div>
                                                </div>

                                                <VerseCard
                                                    verse={{
                                                        id: verse.id ?? 0,
                                                        chapterId:
                                                            verse.chapterId,
                                                        chapterNumber:
                                                            verse.chapterNumber ??
                                                            verse.chapterId,
                                                        verseNumber:
                                                            verse.verseNumber,
                                                        text: verse.text,
                                                        translation:
                                                            verse.translation ??
                                                            undefined,
                                                        juzNumber:
                                                            verse.juzNumber ??
                                                            0,
                                                        pageNumber:
                                                            verse.pageNumber ??
                                                            0,
                                                    }}
                                                    showTranslation
                                                    hideHeaderActions={false}
                                                    className={cn(
                                                        'bg-transparent',
                                                        'border-0 shadow-none',
                                                        'p-5 pt-1',
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination controls */}
                                    {totalPages > 1 && (
                                        <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-6 text-sm text-muted-foreground">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={currentPage === 1}
                                                onClick={() =>
                                                    changePage(currentPage - 1)
                                                }
                                                className="w-24 justify-start text-[13px] font-medium hover:bg-transparent hover:text-foreground"
                                            >
                                                « Previous
                                            </Button>

                                            <div className="hidden h-9 items-center gap-1 rounded-md border border-border/50 bg-background px-1 shadow-sm sm:flex">
                                                {(() => {
                                                    const maxPagesToShow = 10;
                                                    let startPage = Math.max(
                                                        1,
                                                        currentPage -
                                                            Math.floor(
                                                                maxPagesToShow /
                                                                    2,
                                                            ),
                                                    );
                                                    let endPage =
                                                        startPage +
                                                        maxPagesToShow -
                                                        1;

                                                    if (endPage > totalPages) {
                                                        endPage = totalPages;
                                                        startPage = Math.max(
                                                            1,
                                                            endPage -
                                                                maxPagesToShow +
                                                                1,
                                                        );
                                                    }

                                                    return Array.from(
                                                        {
                                                            length:
                                                                endPage -
                                                                startPage +
                                                                1,
                                                        },
                                                        (_, i) => startPage + i,
                                                    ).map((page) => (
                                                        <button
                                                            key={`page-${page}`}
                                                            type="button"
                                                            onClick={() =>
                                                                changePage(page)
                                                            }
                                                            className={cn(
                                                                'inline-flex h-7 min-w-[28px] items-center justify-center rounded-[4px] px-2 text-[13px] transition-colors',
                                                                page ===
                                                                    currentPage
                                                                    ? 'bg-blue-50 font-semibold text-blue-600'
                                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                                            )}
                                                        >
                                                            {page}
                                                        </button>
                                                    ));
                                                })()}
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                                onClick={() =>
                                                    changePage(currentPage + 1)
                                                }
                                                className="w-24 justify-end text-[13px] font-medium hover:bg-transparent hover:text-foreground"
                                            >
                                                Next »
                                            </Button>
                                        </div>
                                    )}
                                </section>
                            )}
                        </main>
                    </div>
                </div>
            </QuranReaderLayout>
        </>
    );
}

