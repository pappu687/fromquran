import { FullResourceDialog } from '@/components/quran/full-resource-dialog';
import { VerseCard } from '@/components/quran/verse-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChapters } from '@/hooks';
import QuranReaderLayout from '@/layouts/quran-reader-layout';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    ExternalLink,
    FileText,
    Languages,
    ScrollText,
    Search as SearchIcon,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

interface VerseSearchResult {
    id: number | null;
    documentType: 'verse';
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

interface ResourceSearchResult {
    id: string | null;
    documentType:
        | 'translation'
        | 'user_verse_resource'
        | 'user_chapter_resource'
        | 'tafsir';
    chapterId?: number | null;
    chapterName?: string;
    chapterNumber?: number;
    verseNumber?: number | null;
    title?: string | null;
    description?: string | null;
    resourceUrl?: string | null;
    resourceTypeName?: string | null;
    tafsirBookName?: string | null;
    tafsirBookSlug?: string | null;
    fromAyah?: string | null;
    toAyah?: string | null;
    ayahKey?: string | null;
}

type SearchResult = VerseSearchResult | ResourceSearchResult;

interface SearchPageProps {
    query?: string;
    edition: string;
    results: SearchResult[];
    currentPage: number;
    perPage: number;
    total: number;
}

export default function SearchPage({
    query = '',
    edition,
    results,
    currentPage,
    perPage,
    total,
}: SearchPageProps) {
    const { chapters } = useChapters();
    const [localQuery, setLocalQuery] = useState(query);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedResource, setSelectedResource] = useState<{
        title: string | null;
        url: string | null;
        comment: string;
    } | null>(null);

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

    const getResultLabel = (result: ResourceSearchResult) => {
        switch (result.documentType) {
            case 'translation':
                return 'Translation';
            case 'user_verse_resource':
                return result.resourceTypeName || 'Verse Resource';
            case 'user_chapter_resource':
                return result.resourceTypeName || 'Chapter Resource';
            case 'tafsir':
                return result.tafsirBookName || 'Tafsir';
        }
    };

    const getResultIcon = (result: ResourceSearchResult) => {
        switch (result.documentType) {
            case 'translation':
                return Languages;
            case 'tafsir':
                return ScrollText;
            default:
                return FileText;
        }
    };

    const getQuranTarget = (result: {
        chapterNumber?: number;
        verseNumber?: number | null;
    }) => {
        if (result.chapterNumber && result.verseNumber) {
            return `/${result.chapterNumber}/${result.verseNumber}`;
        }

        if (result.chapterNumber) {
            return `/${result.chapterNumber}`;
        }

        return null;
    };

    const getResultTarget = (result: ResourceSearchResult) => {
        if (
            result.documentType === 'user_verse_resource' &&
            result.resourceUrl
        ) {
            return result.resourceUrl;
        }

        if (
            result.documentType === 'user_chapter_resource' &&
            result.resourceUrl
        ) {
            return result.resourceUrl;
        }

        return getQuranTarget(result);
    };

    const getExcerpt = (value?: string | null) => {
        if (!value) {
            return '';
        }

        const plainText = value
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return plainText.length > 280
            ? `${plainText.slice(0, 280)}...`
            : plainText;
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
                        <section className="pb-6 sm:pb-8">
                            <div className="max-w-3xl">
                                <h1 className="font-young mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                                    Search the Qur&apos;an with context
                                </h1>
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
                                            ? `Matches for "${query}"`
                                            : `No results for "${query}"`}
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
                        {hasResults && (
                            <main className="space-y-5">
                                {results.map((result) => {
                                    if (result.documentType === 'verse') {
                                        const verseTarget = getQuranTarget(
                                            result,
                                        );

                                        return (
                                            <div
                                                key={`${result.chapterId}-${result.verseNumber}-${result.id ?? 'n'}`}
                                                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-none"
                                            >
                                                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4">
                                                    {verseTarget ? (
                                                        <Link
                                                            href={verseTarget}
                                                            className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600 uppercase transition-colors hover:bg-stone-200"
                                                        >
                                                            {result.chapterName ??
                                                                `Surah ${result.chapterId}`}
                                                        </Link>
                                                    ) : (
                                                        <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600 uppercase">
                                                            {result.chapterName ??
                                                                `Surah ${result.chapterId}`}
                                                        </span>
                                                    )}
                                                    {verseTarget ? (
                                                        <Link
                                                            href={verseTarget}
                                                            className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                                                        >
                                                            Ayah{' '}
                                                            {result.verseNumber}
                                                        </Link>
                                                    ) : (
                                                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                                            Ayah{' '}
                                                            {result.verseNumber}
                                                        </span>
                                                    )}
                                                </div>

                                                <VerseCard
                                                    verse={{
                                                        id: result.id ?? 0,
                                                        chapterId:
                                                            result.chapterId,
                                                        chapterNumber:
                                                            result.chapterNumber ??
                                                            result.chapterId,
                                                        verseNumber:
                                                            result.verseNumber,
                                                        text: result.text,
                                                        translations:
                                                            result.translation
                                                                ? [
                                                                      {
                                                                          resource_id: 0,
                                                                          text: result.translation,
                                                                      },
                                                                  ]
                                                                : undefined,
                                                        juzNumber:
                                                            result.juzNumber ??
                                                            0,
                                                        pageNumber:
                                                            result.pageNumber ??
                                                            0,
                                                        resourceCount:
                                                            result.resourceCount ??
                                                            0,
                                                    }}
                                                    hasResources={
                                                        result.hasResources ??
                                                        false
                                                    }
                                                    resourceCount={
                                                        result.resourceCount ??
                                                        0
                                                    }
                                                    showTranslation
                                                    hideHeaderActions={false}
                                                    className={cn(
                                                        'border-0 bg-transparent p-5 pt-3 shadow-none',
                                                    )}
                                                />
                                            </div>
                                        );
                                    }

                                    const Icon = getResultIcon(result);
                                    const target = getResultTarget(result);
                                    const quranTarget = getQuranTarget(result);
                                    const title =
                                        result.title ||
                                        result.tafsirBookName ||
                                        'Search result';

                                    return (
                                        <article
                                            key={
                                                result.id ??
                                                `${result.documentType}-${result.chapterId ?? 'c'}-${result.verseNumber ?? 'v'}`
                                            }
                                            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-none"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600 uppercase">
                                                            <Icon className="h-3.5 w-3.5" />
                                                            {getResultLabel(
                                                                result,
                                                            )}
                                                        </span>
                                                        {result.chapterName && (
                                                            quranTarget ? (
                                                                <Link
                                                                    href={
                                                                        quranTarget
                                                                    }
                                                                    className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                                                                >
                                                                    {
                                                                        result.chapterName
                                                                    }
                                                                    {result.verseNumber
                                                                        ? ` ${result.verseNumber}`
                                                                        : ''}
                                                                </Link>
                                                            ) : (
                                                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                                                    {
                                                                        result.chapterName
                                                                    }
                                                                    {result.verseNumber
                                                                        ? ` ${result.verseNumber}`
                                                                        : ''}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>

                                                    <div>
                                                        {target ? (
                                                            <a
                                                                href={target}
                                                                target={
                                                                    result.resourceUrl
                                                                        ? '_blank'
                                                                        : undefined
                                                                }
                                                                rel={
                                                                    result.resourceUrl
                                                                        ? 'noreferrer'
                                                                        : undefined
                                                                }
                                                                className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-950 transition-colors hover:text-slate-700"
                                                            >
                                                                <span>
                                                                    {title}
                                                                </span>
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                        ) : (
                                                            <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                                                                {title}
                                                            </h3>
                                                        )}
                                                        <p className="mt-2 text-sm leading-7 text-slate-600">
                                                            {getExcerpt(
                                                                result.description,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {result.description && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSelectedResource(
                                                                {
                                                                    title,
                                                                    url:
                                                                        result.resourceUrl ??
                                                                        target ??
                                                                        null,
                                                                    comment:
                                                                        result.description ??
                                                                        '',
                                                                },
                                                            )
                                                        }
                                                        className="rounded-full"
                                                    >
                                                        Quick view
                                                    </Button>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}

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
            <FullResourceDialog
                open={selectedResource !== null}
                resource={selectedResource}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedResource(null);
                    }
                }}
                onClose={() => setSelectedResource(null)}
            />
        </>
    );
}
