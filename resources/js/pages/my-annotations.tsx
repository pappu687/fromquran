import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { BookText, Loader2, MoveRight, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Annotation {
    id: number;
    verse_id: number;
    start_offset: number;
    end_offset: number;
    selected_text: string;
    note: string;
    created_at: string;
    updated_at: string;
    verse?: {
        id: number;
        verse_key?: string;
        verse_number?: number;
        chapter_id?: number;
        chapter_number?: number;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Annotations',
        href: '/my-annotations',
    },
];

export default function MyAnnotationsPage() {
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingAnnotationId, setDeletingAnnotationId] = useState<
        number | null
    >(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAnnotations = async () => {
            setIsLoading(true);

            try {
                const csrfToken = document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content');

                const response = await fetch('/api/verse-annotations?all=1', {
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
                    throw new Error('Failed to load annotations');
                }

                const payload: { data: Annotation[] } = await response.json();
                setAnnotations(payload.data || []);
                setError(null);
            } catch (loadError) {
                console.error('Failed to load annotations:', loadError);
                setError('Failed to load annotations. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadAnnotations();
    }, []);

    const goToVerse = (verseKey?: string) => {
        if (!verseKey) {
            return;
        }

        const [chapterString, verseString] = verseKey.split(':');
        const chapterNumber = Number(chapterString);
        const verseNumber = Number(verseString);

        if (Number.isFinite(chapterNumber) && Number.isFinite(verseNumber)) {
            router.visit(`/${chapterNumber}/${verseNumber}`);
        }
    };

    const handleDelete = async (annotationId: number) => {
        const confirmed = window.confirm(
            'Delete this annotation? This cannot be undone.',
        );

        if (!confirmed) {
            return;
        }

        setDeletingAnnotationId(annotationId);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(
                `/api/verse-annotations/${annotationId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken || '',
                    },
                    credentials: 'include',
                },
            );

            if (response.status === 401) {
                router.visit('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to delete annotation');
            }

            setAnnotations((current) =>
                current.filter((annotation) => annotation.id !== annotationId),
            );
            setError(null);
        } catch (deleteError) {
            console.error('Failed to delete annotation:', deleteError);
            setError('Failed to delete annotation. Please try again.');
        } finally {
            setDeletingAnnotationId(null);
        }
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="My Annotations - From Quran" />
                <div className="flex flex-1 flex-col bg-[#fafaf8]">
                    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-4 py-10 sm:px-6">
                        <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
                        <p className="text-sm text-slate-500">
                            Loading annotations...
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Annotations - From Quran" />
            <div className="flex flex-1 flex-col bg-[#fafaf8]">
                <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
                    <section className="border-b border-slate-200 pb-5">
                        <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                            My Annotations
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                            Saved verse notes
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                            Every verse you have annotated, with the selected
                            Arabic text and a direct link back to the reader.
                        </p>
                    </section>

                    {error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}

                    <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-none">
                            <CardContent className="px-3 py-3 sm:px-4 sm:py-3.5">
                                <p className="text-[11px] tracking-[0.16em] text-slate-400 uppercase">
                                    Total
                                </p>
                                <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                                    {annotations.length}
                                </p>
                            </CardContent>
                        </Card>
                    </section>

                    {annotations.length === 0 ? (
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                            <CardContent className="py-16 text-center">
                                <BookText className="mx-auto h-12 w-12 text-slate-300" />
                                <h2 className="mt-4 text-xl font-semibold text-slate-950">
                                    No annotations yet
                                </h2>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                                    Save a note while reading any verse and it
                                    will appear here.
                                </p>
                                <Button
                                    onClick={() => router.visit('/')}
                                    className="mt-6 rounded-full px-5"
                                >
                                    Browse Quran
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <section className="rounded-3xl border border-slate-200 bg-white shadow-none">
                            <div className="divide-y divide-slate-200 px-5 sm:px-6">
                                {annotations.map((annotation) => (
                                    <article
                                        key={annotation.id}
                                        className="grid gap-4 py-5 md:grid-cols-[140px_minmax(0,1fr)_170px] md:gap-6"
                                    >
                                        <div className="min-w-0">
                                            <button
                                                type="button"
                                                className="font-mono text-sm font-semibold text-slate-950 transition-colors hover:text-slate-600"
                                                onClick={() =>
                                                    goToVerse(
                                                        annotation.verse
                                                            ?.verse_key,
                                                    )
                                                }
                                            >
                                                {annotation.verse?.verse_key ||
                                                    'Verse'}
                                            </button>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Saved note
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-900">
                                                Selected text
                                            </p>
                                            <p
                                                className="mt-1 inline-block rounded-md bg-amber-100 px-2 py-1 text-sm text-slate-900"
                                                dir="rtl"
                                            >
                                                {annotation.selected_text}
                                            </p>
                                            <p className="mt-3 text-sm font-medium text-slate-900">
                                                Note
                                            </p>
                                            <p className="mt-1 text-sm leading-7 whitespace-pre-wrap text-slate-500">
                                                {annotation.note}
                                            </p>
                                            <div className="mt-3">
                                                <Button
                                                    variant="link"
                                                    className="h-auto px-0 text-sm font-medium text-slate-600"
                                                    onClick={() =>
                                                        goToVerse(
                                                            annotation.verse
                                                                ?.verse_key,
                                                        )
                                                    }
                                                >
                                                    Open verse
                                                    <MoveRight className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-1 text-left text-xs text-slate-400 md:text-right">
                                            <div className="mb-3 flex md:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            annotation.id,
                                                        )
                                                    }
                                                    disabled={
                                                        deletingAnnotationId ===
                                                        annotation.id
                                                    }
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                    aria-label="Delete annotation"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <p>
                                                Created{' '}
                                                {new Date(
                                                    annotation.created_at,
                                                ).toLocaleDateString('en-US', {
                                                    timeZone: 'UTC',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                            <p>
                                                Updated{' '}
                                                {new Date(
                                                    annotation.updated_at,
                                                ).toLocaleDateString('en-US', {
                                                    timeZone: 'UTC',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
