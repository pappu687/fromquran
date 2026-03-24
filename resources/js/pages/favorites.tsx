import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { BookmarkX, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useBookmarks } from '@/hooks';

interface ChapterVersesResponse {
    data?: Array<{
        verseNumber: number;
        translation?: string;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Favorites',
        href: '/favorites',
    },
];

export default function FavoritesPage() {
    const {
        bookmarks,
        loading,
        error,
        successMessage,
        loadBookmarks,
        removeBookmark,
        clearError,
        clearSuccessMessage,
    } = useBookmarks();

    const uniqueChapterCount = new Set(
        bookmarks.map((bookmark) => bookmark.chapter?.chapter_number),
    ).size;
    const notedCount = bookmarks.filter((bookmark) =>
        bookmark.notes?.trim(),
    ).length;

    // Load translations for bookmarked verses using Quran API (Solr-backed)
    useEffect(() => {
        const loadTranslations = async () => {
            if (bookmarks.length === 0) return;

            try {
                const byChapter: Record<number, typeof bookmarks> = {};
                bookmarks.forEach((b) => {
                    const chapterNumber = b.chapter.chapter_number;
                    if (!byChapter[chapterNumber]) {
                        byChapter[chapterNumber] = [];
                    }
                    byChapter[chapterNumber].push(b);
                });

                const translationMap: Record<string, string> = {};

                await Promise.all(
                    Object.entries(byChapter).map(
                        async ([chapterNumStr, bookmarksInChapter]) => {
                            const chapterNumber = Number(chapterNumStr);
                            const verseNumbers = bookmarksInChapter.map(
                                (b) => b.verse.verse_number,
                            );
                            const minVerse = Math.min(...verseNumbers);
                            const maxVerse = Math.max(...verseNumbers);

                            const params = new URLSearchParams({
                                from: String(minVerse),
                                to: String(maxVerse),
                                limit: String(maxVerse - minVerse + 1),
                                edition: 'en.sahih',
                            });

                            const resp = await fetch(
                                `/api/quran/chapters/${chapterNumber}/verses?${params.toString()}`,
                            );
                            if (!resp.ok) return;
                            const payload =
                                (await resp.json()) as ChapterVersesResponse;
                            const items = payload.data || [];
                            items.forEach((item) => {
                                const key = `${chapterNumber}:${item.verseNumber}`;
                                if (item.translation) {
                                    translationMap[key] = item.translation;
                                }
                            });
                        },
                    ),
                );

                if (Object.keys(translationMap).length === 0) {
                    return;
                }

                // Note: We can't directly update the store here without causing re-renders,
                // so we rely on the initial load including translations
            } catch (error) {
                console.error(
                    'Failed to load translations for favorite verses',
                    error,
                );
            }
        };

        loadTranslations();
    }, [bookmarks]);

    const handleRemove = async (bookmarkId: number) => {
        if (
            !confirm(
                'Are you sure you want to remove this verse from favorites?',
            )
        ) {
            return;
        }

        await removeBookmark(bookmarkId);
    };

    const handleViewVerse = (chapterNumber: number, verseNumber: number) => {
        router.visit(`/${chapterNumber}/${verseNumber}`);
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Favorites - From Quran" />
                <div className="flex flex-1 flex-col bg-gradient-to-b from-background to-muted/20">
                    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-6 px-4 py-6 sm:px-6 sm:py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Favorites - From Quran" />
            <div className="flex flex-1 flex-col bg-gradient-to-b from-background to-muted/20">
                <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
                    <section className="border-b border-slate-200 pb-5">
                        <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                            Favorites
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                            Saved ayat
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                            A quieter reading list of the verses you want to
                            revisit, reflect on, or keep close.
                        </p>
                    </section>

                    {bookmarks.length > 0 && (
                        <section className="grid grid-cols-3 gap-2">
                            <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-none">
                                <CardContent className="px-3 py-3 sm:px-4 sm:py-3.5">
                                    <p className="text-[11px] tracking-[0.16em] text-slate-400 uppercase">
                                        Total
                                    </p>
                                    <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                                        {bookmarks.length}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-none">
                                <CardContent className="px-3 py-3 sm:px-4 sm:py-3.5">
                                    <p className="text-[11px] tracking-[0.16em] text-slate-400 uppercase">
                                        Surahs
                                    </p>
                                    <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                                        {uniqueChapterCount}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-none">
                                <CardContent className="px-3 py-3 sm:px-4 sm:py-3.5">
                                    <p className="text-[11px] tracking-[0.16em] text-slate-400 uppercase">
                                        Notes
                                    </p>
                                    <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                                        {notedCount}
                                    </p>
                                </CardContent>
                            </Card>
                        </section>
                    )}

                    {successMessage && (
                        <div className="mb-6 flex items-center gap-2 rounded-md bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            {successMessage}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto h-auto p-1"
                                onClick={() => clearSuccessMessage()}
                            >
                                ×
                            </Button>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                            {error}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto h-auto p-1"
                                onClick={() => clearError()}
                            >
                                ×
                            </Button>
                        </div>
                    )}

                    {bookmarks.length === 0 ? (
                        <Card className="text-center">
                            <CardContent className="py-16">
                                <BookmarkX className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                                <h2 className="mb-2 text-xl font-semibold">
                                    No favorites yet
                                </h2>
                                <p className="mb-6 text-muted-foreground">
                                    Start bookmarking your favorite verses while
                                    reading the Quran
                                </p>
                                <Button onClick={() => router.visit('/')}>
                                    Browse Quran
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <section className="border-t border-slate-200">
                            {bookmarks.map((bookmark) => (
                                <article
                                    key={bookmark.id}
                                    className="group grid gap-4 border-b border-slate-200 py-6 md:grid-cols-[150px_minmax(0,1fr)_150px] md:gap-6"
                                >
                                    <div className="min-w-0">
                                        <button
                                            type="button"
                                            className="font-mono text-lg font-semibold text-slate-950 transition-colors hover:text-slate-600"
                                            onClick={() =>
                                                bookmark.chapter
                                                    ?.chapter_number &&
                                                bookmark.verse?.verse_number &&
                                                handleViewVerse(
                                                    bookmark.chapter
                                                        .chapter_number,
                                                    bookmark.verse.verse_number,
                                                )
                                            }
                                        >
                                            {bookmark.verse?.verse_key}
                                        </button>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {bookmark.chapter?.name_roman ??
                                                bookmark.chapter?.name_simple}
                                        </p>
                                        <p
                                            className="mt-1 text-xs text-slate-400"
                                            dir="rtl"
                                        >
                                            {bookmark.chapter?.name_arabic}
                                        </p>
                                    </div>

                                    <div className="min-w-0">
                                        <p
                                            className="font-arabic text-right text-3xl leading-relaxed text-slate-950"
                                            dir="rtl"
                                        >
                                            {bookmark.verse?.text_uthmani}
                                        </p>

                                        {bookmark.verse?.translation && (
                                            <p className="mt-3 text-sm leading-7 font-medium text-slate-700">
                                                {bookmark.verse.translation}
                                            </p>
                                        )}

                                        {bookmark.verse?.text_imlaei_simple && (
                                            <p className="mt-2 text-sm text-slate-400">
                                                {
                                                    bookmark.verse
                                                        .text_imlaei_simple
                                                }
                                            </p>
                                        )}

                                        {bookmark.notes && (
                                            <p className="mt-3 text-sm leading-7 text-slate-500">
                                                <span className="font-medium text-slate-700">
                                                    Note:
                                                </span>{' '}
                                                {bookmark.notes}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-row items-start justify-between gap-3 md:flex-col md:items-end">
                                        <div className="space-y-1 text-left text-xs text-slate-400 md:text-right">
                                            <p>
                                                Added{' '}
                                                {new Date(
                                                    bookmark.created_at,
                                                ).toLocaleDateString('en-US', {
                                                    timeZone: 'UTC',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0 text-sm text-slate-700"
                                                onClick={() =>
                                                    bookmark.chapter
                                                        ?.chapter_number &&
                                                    bookmark.verse
                                                        ?.verse_number &&
                                                    handleViewVerse(
                                                        bookmark.chapter
                                                            .chapter_number,
                                                        bookmark.verse
                                                            .verse_number,
                                                    )
                                                }
                                            >
                                                View in context
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleRemove(bookmark.id)
                                                }
                                                className="rounded-full px-2 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </section>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
