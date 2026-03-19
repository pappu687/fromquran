import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { BookmarkX, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Bookmark {
    id: number;
    verse_id: string;
    notes?: string;
    created_at: string;
    verse: {
        id: number;
        verse_key: string;
        verse_number: number;
        text_uthmani: string;
        text_imlaei_simple?: string;
        translation?: string;
        juz_number?: number;
        page_number?: number;
    };
    chapter: {
        id: number;
        chapter_number: number;
        name_simple: string;
        name_roman?: string;
        name_arabic: string;
    };
}

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
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const uniqueChapterCount = new Set(
        bookmarks.map((bookmark) => bookmark.chapter?.chapter_number),
    ).size;
    const notedCount = bookmarks.filter((bookmark) =>
        bookmark.notes?.trim(),
    ).length;

    useEffect(() => {
        loadBookmarks();
    }, []);

    const loadBookmarks = async () => {
        setIsLoading(true);
        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch('/api/bookmarks', {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
            });

            if (response.status === 401) {
                router.visit('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load favorites');
            }

            const data = await response.json();
            // Filter out bookmarks that might have missing relations to prevent crashes
            const validBookmarks = (data.data || []).filter(
                (b: Bookmark) => b.verse && b.chapter,
            );
            setBookmarks(validBookmarks);
            // Load translations for these bookmarked verses
            loadTranslations(validBookmarks);
        } catch (error) {
            console.error('Failed to load favorites:', error);
            setErrors({
                general: 'Failed to load favorites. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Load translations for bookmarked verses using Quran API (Solr-backed)
    const loadTranslations = async (loadedBookmarks: Bookmark[]) => {
        try {
            const byChapter: Record<number, Bookmark[]> = {};
            loadedBookmarks.forEach((b) => {
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

            setBookmarks((prev) =>
                prev.map((b) => {
                    const key = `${b.chapter.chapter_number}:${b.verse.verse_number}`;
                    const translation = translationMap[key];
                    return translation
                        ? {
                              ...b,
                              verse: {
                                  ...b.verse,
                                  translation,
                              },
                          }
                        : b;
                }),
            );
        } catch (error) {
            console.error(
                'Failed to load translations for favorite verses',
                error,
            );
        }
    };

    const handleRemove = async (bookmarkId: number) => {
        if (
            !confirm(
                'Are you sure you want to remove this verse from favorites?',
            )
        ) {
            return;
        }

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to remove favorite');
            }

            setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
            setSuccessMessage('Removed from favorites');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Failed to remove favorite:', error);
            setErrors({ general: 'Failed to remove favorite' });
        }
    };

    const handleViewVerse = (chapterNumber: number, verseNumber: number) => {
        router.visit(`/${chapterNumber}/${verseNumber}`);
    };

    if (isLoading) {
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
                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
                    {bookmarks.length > 0 && (
                        <section className="grid grid-cols-3 gap-2 sm:gap-3">
                            <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                                <CardContent className="px-3 py-2.5 sm:px-5 sm:py-5">
                                    <p className="text-xs text-slate-500 sm:text-sm">
                                        Total
                                    </p>
                                    <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
                                        {bookmarks.length}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                                <CardContent className="px-3 py-2.5 sm:px-5 sm:py-5">
                                    <p className="text-xs text-slate-500 sm:text-sm">
                                        Surahs
                                    </p>
                                    <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
                                        {uniqueChapterCount}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                                <CardContent className="px-3 py-2.5 sm:px-5 sm:py-5">
                                    <p className="text-xs text-slate-500 sm:text-sm">
                                        Notes
                                    </p>
                                    <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
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
                        </div>
                    )}

                    {errors.general && (
                        <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                            {errors.general}
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
                        <div className="space-y-4">
                            {bookmarks.map((bookmark) => (
                                <Card
                                    key={bookmark.id}
                                    className="group p-4 transition-all hover:shadow-md"
                                >
                                    <CardContent className="p-3">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-[40%] bg-gray-400/20 text-sm font-semibold">
                                                            {
                                                                bookmark.verse
                                                                    ?.verse_number
                                                            }
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                {bookmark
                                                                    .chapter
                                                                    ?.name_roman ??
                                                                    bookmark
                                                                        .chapter
                                                                        ?.name_simple}
                                                            </div>
                                                            <div
                                                                className="text-xs text-muted-foreground"
                                                                dir="rtl"
                                                            >
                                                                {
                                                                    bookmark
                                                                        .chapter
                                                                        ?.name_arabic
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p
                                                    className="font-arabic mb-3 text-right text-3xl leading-relaxed"
                                                    dir="rtl"
                                                >
                                                    {
                                                        bookmark.verse
                                                            ?.text_uthmani
                                                    }
                                                </p>

                                                {bookmark.verse
                                                    ?.translation && (
                                                    <p className="leading-relaxed font-medium text-blue-950/60">
                                                        {
                                                            bookmark.verse
                                                                .translation
                                                        }
                                                    </p>
                                                )}

                                                {bookmark.verse
                                                    ?.text_imlaei_simple && (
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        {
                                                            bookmark.verse
                                                                .text_imlaei_simple
                                                        }
                                                    </p>
                                                )}

                                                {bookmark.notes && (
                                                    <div className="mt-3 rounded-md bg-muted/50 p-3">
                                                        <p className="text-sm italic">
                                                            Note:{' '}
                                                            {bookmark.notes}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="mt-4 flex items-center gap-4">
                                                    <span className="text-sm text-muted-foreground">
                                                        Added{' '}
                                                        {new Date(
                                                            bookmark.created_at,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                            },
                                                        )}
                                                    </span>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-sm"
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
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleRemove(bookmark.id)
                                                }
                                                className="text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
