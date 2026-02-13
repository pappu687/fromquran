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
                        {/* Header */}
                        <header className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-baseline sm:justify-between">
                            <div>                                
                                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                                    Search the Qur&apos;an
                                </h1>                                
                            </div>                            
                        </header>

                        {/* Search box */}
                        <section className="mb-6">
                            <form onSubmit={handleSubmit}>
                                <Field className="w-full">                                    
                                    <ButtonGroup className="w-full">
                                        <Input
                                            id="q"
                                            value={localQuery}
                                            onChange={(e) =>
                                                setLocalQuery(e.target.value)
                                            }
                                            placeholder="Start typing any phrase from the Qur'an…"
                                            className="h-11 flex-1 rounded-r-none text-sm"
                                        />
                                        <Button
                                            type="submit"
                                            size="sm"                                                       
                                            className="h-11 rounded-l-none px-5 text-md font-semibold tracking-wide -ml-px"
                                        >
                                            {isSubmitting
                                                ? 'Searching…'
                                                : 'Search'}
                                        </Button>
                                    </ButtonGroup>
                                </Field>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Press Enter to search. Results are ranked
                                    using the Solr index.
                                </p>
                            </form>
                        </section>

                        {/* Results */}
                        <main className="flex flex-1 flex-col gap-4">
                        
                        {query && !hasResults && (
                            <div className="mt-6 text-sm text-muted-foreground">
                                <p>
                                    No verses found for{' '}
                                    <span className="font-semibold text-emerald-300">
                                        “{query}”
                                    </span>
                                    . Try different wording or a shorter phrase.
                                </p>
                            </div>
                        )}

                        {hasResults && (
                            <section className="mt-4 space-y-4">
                                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                                    <p>
                                        Showing{' '}
                                        <span className="font-semibold text-foreground">
                                            {results.length}
                                        </span>{' '}
                                        of{' '}
                                        <span className="font-semibold text-foreground">
                                            {total}
                                        </span>{' '}
                                        matches for{' '}
                                        <span className="font-semibold text-primary">
                                            “{query}”
                                        </span>
                                        .
                                    </p>
                                    <p>
                                        Page {currentPage} of {totalPages}
                                    </p>
                                </div>

                                <div className="mt-2 space-y-3">
                                    {results.map((verse) => (
                                        <div
                                            key={`${verse.chapterId}-${verse.verseNumber}-${verse.id ?? 'n'}`}
                                            className="rounded-xl border bg-card p-3 shadow-sm"
                                        >
                                            <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">
                                                        {verse.chapterName ??
                                                            `Surah ${verse.chapterId}`}
                                                    </span>                                                    
                                                </div>
                                                <Link
                                                    href={`/${verse.chapterId}/${verse.verseNumber}`}
                                                    className="inline-flex items-center justify-center rounded-full bg-transparent p-0 text-primary hover:bg-transparent"
                                                >
                                                    <BookOpen className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Open in reader
                                                    </span>
                                                </Link>
                                            </div>

                                            <VerseCard
                                                verse={{
                                                    id: verse.id ?? 0,
                                                    chapterId: verse.chapterId,
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
                                                        verse.juzNumber ?? 0,
                                                    pageNumber:
                                                        verse.pageNumber ?? 0,
                                                }}
                                                showTranslation
                                                hideHeaderActions={false}
                                                className={cn(
                                                    'bg-transparent',
                                                    'border-0 shadow-none',
                                                    'px-0 pt-0',
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination controls */}
                                {totalPages > 1 && (
                                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === 1}
                                                onClick={() =>
                                                    changePage(currentPage - 1)
                                                }
                                                className="text-xs"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                                onClick={() =>
                                                    changePage(currentPage + 1)
                                                }
                                                className="text-xs"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                        <div className="hidden gap-1 sm:flex">
                                            {Array.from(
                                                { length: totalPages },
                                                (_, i) => i + 1,
                                            ).map((page) => (
                                                <button
                                                    key={page}
                                                    type="button"
                                                    onClick={() =>
                                                        changePage(page)
                                                    }
                                                    className={cn(
                                                        'inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px]',
                                                        page === currentPage
                                                            ? 'bg-primary text-primary-foreground font-semibold'
                                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                                    )}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>
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

