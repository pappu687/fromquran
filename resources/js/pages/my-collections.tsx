import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
    Folder,
    FolderPlus,
    Trash2,
    Globe,
    Lock,
    Loader2,
    BookOpen,
    CheckCircle2,
    MoreVertical,
    Calendar,
    ArrowRight,
} from 'lucide-react';
import { Head, router } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Collection {
    id: number;
    name: string;
    description?: string;
    color: string;
    is_public: boolean;
    verses_count: number;
    slug: string;
    created_at: string;
}

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

            const data = await response.json();
            setCollections(data);
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
        if (!selectedCollection) return;

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
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete collection');
            }

            // Remove from list
            setCollections((prev) =>
                prev.filter((c) => c.id !== selectedCollection.id)
            );

            setIsDeleteDialogOpen(false);
            setSelectedCollection(null);

            setSuccessMessage('Collection deleted successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            setErrors({ general: 'Failed to delete collection' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewCollection = (slug: string) => {
        router.visit(`/my-collections/${slug}`);
    };

    if (isLoading) {
        return (
            <AppLayout>
                <Head title="My Collections - From Quran" />
                <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading your collections...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="My Collections - From Quran" />
            <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/20">
                <div className="container mx-auto px-4 py-12">
                    {/* Header Section */}
                    <div className="mb-10">
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <Folder className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">
                                        My Collections
                                    </h1>
                                    <p className="text-muted-foreground">
                                        Organize and manage your Quran verse collections
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => router.visit('/')}
                                className="gap-2 shadow-sm whitespace-nowrap"
                            >
                                <FolderPlus className="h-4 w-4" />
                                Browse Quran to Add Verses
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="mt-4 text-sm text-muted-foreground">
                            {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
                        </div>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                            {successMessage}
                        </div>
                    )}

                    {/* Error Message */}
                    {errors.general && (
                        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                            {errors.general}
                        </div>
                    )}

                    {/* Empty State */}
                    {collections.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <div className="rounded-full bg-muted p-6 mb-6">
                                    <Folder className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">
                                    No collections yet
                                </h2>
                                <p className="text-muted-foreground mb-8 max-w-md text-center">
                                    Create your first collection to start organizing your favorite verses from the Quran
                                </p>
                                <Button
                                    onClick={() => router.visit('/')}
                                    size="lg"
                                    className="gap-2 shadow-md"
                                >
                                    <FolderPlus className="h-5 w-5" />
                                    Browse Quran to Add Verses
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        /* Collections Grid */
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {collections.map((collection) => (
                                <Card
                                    key={collection.id}
                                    className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-border/50"
                                    onClick={() => handleViewCollection(collection.slug)}
                                >
                                    {/* Color accent strip */}
                                    <div
                                        className="absolute left-0 top-0 h-full w-1.5"
                                        style={{ backgroundColor: collection.color }}
                                    />

                                    {/* Background gradient on hover */}
                                    <div
                                        className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                        style={{
                                            background: `linear-gradient(135deg, ${collection.color}08 0%, transparent 100%)`
                                        }}
                                    />

                                    <CardHeader className="relative pb-3 px-4 pt-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">
                                                    {collection.name}
                                                </CardTitle>
                                                {collection.description && (
                                                    <CardDescription className="line-clamp-2 text-xs">
                                                        {collection.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <Badge
                                                variant={collection.is_public ? "default" : "secondary"}
                                                className="flex items-center gap-1 flex-shrink-0 px-2 py-0.5 text-xs"
                                            >
                                                {collection.is_public ? (
                                                    <>
                                                        <Globe className="h-2.5 w-2.5" />
                                                        Public
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="h-2.5 w-2.5" />
                                                        Private
                                                    </>
                                                )}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="relative pb-3 px-4">
                                        <div className="flex items-center gap-5 text-xs">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <div className="rounded bg-muted p-1">
                                                    <BookOpen className="h-3 w-3" />
                                                </div>
                                                <span>{collection.verses_count}</span>
                                                <span>{collection.verses_count === 1 ? 'verse' : 'verses'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <div className="rounded bg-muted p-1">
                                                    <Calendar className="h-3 w-3" />
                                                </div>
                                                <span className="text-[10px]">
                                                    {new Date(collection.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* View indicator on hover */}
                                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="rounded-full bg-primary p-1.5 text-primary-foreground shadow-md">
                                                <ArrowRight className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </CardContent>

                                    {/* Action button */}
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 hover:bg-background/80 backdrop-blur-sm"
                                                >
                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(collection);
                                                    }}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                    Delete Collection
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="rounded-full bg-destructive/10 p-2">
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </div>
                            <DialogTitle className="text-lg">Delete Collection</DialogTitle>
                        </div>
                        <DialogDescription className="text-base pt-2">
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{selectedCollection?.name}"</span>?
                            <br className="my-2" />
                            This action cannot be undone and will permanently remove all verses from this collection.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Delete Collection
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
