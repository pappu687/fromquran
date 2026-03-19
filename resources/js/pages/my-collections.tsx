import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Folder,
    FolderPlus,
    Globe,
    Loader2,
    Lock,
    MoreHorizontal,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Collection {
    id: number;
    name: string;
    description?: string;
    color: string;
    is_public: boolean;
    status: 'pending' | 'approved' | 'rejected';
    verses_count: number;
    slug: string;
    created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Collections',
        href: '/my-collections',
    },
];

export default function MyCollectionsPage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] =
        useState<Collection | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        setIsLoading(true);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch('/api/collections', {
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
                throw new Error('Failed to load collections');
            }

            const data = (await response.json()) as Collection[];
            setCollections(data);
            setErrors({});
        } catch (error) {
            console.error('Failed to load collections:', error);
            setErrors({
                general: 'Failed to load collections. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (collection: Collection) => {
        setSelectedCollection(collection);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedCollection) {
            return;
        }

        setIsSubmitting(true);
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const response = await fetch(
                `/api/collections/${selectedCollection.slug}`,
                {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken || '',
                    },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to delete collection');
            }

            setCollections((prev) =>
                prev.filter((item) => item.id !== selectedCollection.id),
            );
            setIsDeleteDialogOpen(false);
            setSelectedCollection(null);
            setSuccessMessage('Collection deleted successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch {
            setErrors({ general: 'Failed to delete collection' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewCollection = (slug: string) => {
        router.visit(`/my-collections/${slug}`);
    };

    const getStatusBadge = (status: Collection['status']) => {
        if (status === 'approved') {
            return (
                <Badge className="rounded-full bg-emerald-600 px-2.5 py-1 text-white hover:bg-emerald-700">
                    Approved
                </Badge>
            );
        }

        if (status === 'rejected') {
            return (
                <Badge
                    variant="destructive"
                    className="rounded-full px-2.5 py-1"
                >
                    Rejected
                </Badge>
            );
        }

        return (
            <Badge
                variant="secondary"
                className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700"
            >
                Pending
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="My Collections - From Quran" />
                <div className="flex flex-1 flex-col bg-[#fafaf8]">
                    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-4 py-10 sm:px-6">
                        <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
                        <p className="text-sm text-slate-500">
                            Loading collections...
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Collections - From Quran" />
            <div className="flex flex-1 flex-col bg-[#fafaf8]">
                <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
                    <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                                My Collections
                            </p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                                Saved verse groups
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                                Keep your collections organized with a quieter,
                                easier-to-scan view of everything you have
                                saved.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.visit('/')}
                            className="gap-2 self-start rounded-full px-5 sm:self-auto"
                        >
                            <FolderPlus className="h-4 w-4" />
                            Browse Quran
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </section>

                    <section className="grid grid-cols-3 gap-2 sm:gap-3">
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                            <CardContent className="px-3 py-2.5 sm:px-5 sm:py-5">
                                <p className="text-xs text-slate-500 sm:text-sm">
                                    Total
                                </p>
                                <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
                                    {collections.length}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                            <CardContent className="px-3 py-2.5 sm:px-5 sm:py-5">
                                <p className="text-xs text-slate-500 sm:text-sm">
                                    Public
                                </p>
                                <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
                                    {
                                        collections.filter(
                                            (collection) =>
                                                collection.is_public,
                                        ).length
                                    }
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                            <CardContent className="px-3 py-2.5 sm:px-5 sm:py-5">
                                <p className="text-xs text-slate-500 sm:text-sm">
                                    Verses saved
                                </p>
                                <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
                                    {collections.reduce(
                                        (sum, collection) =>
                                            sum + collection.verses_count,
                                        0,
                                    )}
                                </p>
                            </CardContent>
                        </Card>
                    </section>

                    {successMessage && (
                        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            {successMessage}
                        </div>
                    )}

                    {errors.general && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errors.general}
                        </div>
                    )}

                    {collections.length === 0 ? (
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                            <CardContent className="py-16 text-center">
                                <Folder className="mx-auto h-12 w-12 text-slate-300" />
                                <h2 className="mt-4 text-xl font-semibold text-slate-950">
                                    No collections yet
                                </h2>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                                    Create your first collection by saving
                                    verses while reading.
                                </p>
                                <Button
                                    onClick={() => router.visit('/')}
                                    className="mt-6 rounded-full px-5"
                                >
                                    <FolderPlus className="h-4 w-4" />
                                    Browse Quran
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <section className="grid gap-4 sm:grid-cols-2">
                            {collections.map((collection) => (
                                <article
                                    key={collection.id}
                                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-none transition-colors hover:border-slate-300"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <button
                                            type="button"
                                            className="min-w-0 flex-1 text-left"
                                            onClick={() =>
                                                handleViewCollection(
                                                    collection.slug,
                                                )
                                            }
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="h-3 w-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            collection.color,
                                                    }}
                                                />
                                                <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">
                                                    {collection.name}
                                                </h2>
                                            </div>

                                            {collection.description && (
                                                <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">
                                                    {collection.description}
                                                </p>
                                            )}
                                        </button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="rounded-full text-slate-500"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleDelete(collection)
                                                    }
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete collection
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="mt-5 flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="rounded-full bg-stone-100 px-2.5 py-1 text-slate-600"
                                        >
                                            <BookOpen className="mr-1 h-3 w-3" />
                                            {collection.verses_count}{' '}
                                            {collection.verses_count === 1
                                                ? 'verse'
                                                : 'verses'}
                                        </Badge>
                                        <Badge
                                            variant="secondary"
                                            className="rounded-full bg-stone-100 px-2.5 py-1 text-slate-600"
                                        >
                                            {collection.is_public ? (
                                                <>
                                                    <Globe className="mr-1 h-3 w-3" />
                                                    Public
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="mr-1 h-3 w-3" />
                                                    Private
                                                </>
                                            )}
                                        </Badge>
                                        {getStatusBadge(collection.status)}
                                    </div>

                                    <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                                        <p className="text-xs text-slate-400">
                                            Created{' '}
                                            {new Date(
                                                collection.created_at,
                                            ).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full px-3 text-slate-700"
                                            onClick={() =>
                                                handleViewCollection(
                                                    collection.slug,
                                                )
                                            }
                                        >
                                            Open
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </article>
                            ))}
                        </section>
                    )}
                </div>
            </div>

            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <DialogContent className="max-w-md rounded-3xl border-slate-200">
                    <DialogHeader>
                        <DialogTitle>Delete collection</DialogTitle>
                        <DialogDescription className="pt-2 text-sm leading-7 text-slate-500">
                            Delete{' '}
                            <span className="font-medium text-slate-950">
                                "{selectedCollection?.name}"
                            </span>
                            ? This will permanently remove the collection and
                            its saved verses.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="rounded-full"
                            onClick={confirmDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
