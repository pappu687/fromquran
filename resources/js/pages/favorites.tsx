import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { BookmarkX, CheckCircle2, Heart, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Bookmark {
    id: number;
    verse_id: string;
    notes?: string;
    created_at: string;
    verse_data: {
        id: number;
        verse_key: string;
        verse_number: number;
        text_uthmani: string;
        text_imlaei_simple?: string;
    };
    chapter: {
        id: number;
        chapter_number: number;
        name_simple: string;
        name_arabic: string;
    };
}

export default function FavoritesPage() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
            setBookmarks(data.data);
        } catch (error) {
            console.error('Failed to load favorites:', error);
            setErrors({
                general: 'Failed to load favorites. Please try again.',
            });
        } finally {
            setIsLoading(false);
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

    const handleViewVerse = (chapterNumber: number) => {
        router.visit(`/${chapterNumber}`);
    };

    if (isLoading) {
        return (
            <AppLayout>
                <Head title="Favorites - From Quran" />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Favorites - From Quran" />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="mb-2 flex items-center gap-3">
                        <Heart className="h-8 w-8 text-red-500" />
                        <h1 className="text-3xl font-bold">My Favorites</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Your bookmarked verses from the Quran
                    </p>
                </div>

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
                                            <div className="mb-2 flex items-center gap-2">
                                                <span className="text-sm font-medium">
                                                    {
                                                        bookmark.chapter
                                                            .name_simple
                                                    }
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {
                                                        bookmark.chapter
                                                            .name_arabic
                                                    }
                                                </span>
                                            </div>

                                            <p
                                                className="font-arabic mb-3 text-right text-2xl leading-relaxed"
                                                dir="rtl"
                                            >
                                                {
                                                    bookmark.verse_data
                                                        .text_uthmani
                                                }
                                            </p>

                                            {bookmark.verse_data
                                                .text_imlaei_simple && (
                                                <p className="mb-3 text-sm text-muted-foreground">
                                                    ss
                                                    {
                                                        bookmark.verse_data
                                                            .text_imlaei_simple
                                                    }
                                                </p>
                                            )}

                                            {bookmark.notes && (
                                                <div className="mt-3 rounded-md bg-muted/50 p-3">
                                                    <p className="text-sm italic">
                                                        Note: {bookmark.notes}
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
                                                        handleViewVerse(
                                                            bookmark.chapter
                                                                .chapter_number,
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
        </AppLayout>
    );
}
