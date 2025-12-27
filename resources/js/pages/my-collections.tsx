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
    Eye,
    CheckCircle2,
    MoreVertical,
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
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="My Collections - From Quran" />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">My Collections</h1>
                        <p className="text-muted-foreground">
                            Organize and manage your Quran verse collections
                        </p>
                    </div>
                    <Button onClick={() => router.visit('/')}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Browse Quran to Add Verses
                    </Button>
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

                {collections.length === 0 ? (
                    <Card className="text-center">
                        <CardContent className="py-16">
                            <Folder className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                            <h2 className="mb-2 text-xl font-semibold">
                                No collections yet
                            </h2>
                            <p className="mb-6 text-muted-foreground">
                                Create your first collection to start organizing your
                                favorite verses
                            </p>
                            <Button onClick={() => router.visit('/')}>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                Browse Quran to Add Verses
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {collections.map((collection) => (
                            <Card
                                key={collection.id}
                                className="group relative transition-all hover:shadow-md cursor-pointer"
                                onClick={() => handleViewCollection(collection.slug)}
                            >
                                <div
                                    className="absolute left-0 top-0 h-full w-1.5 rounded-l-lg"
                                    style={{ backgroundColor: collection.color }}
                                />
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="mb-1">
                                                {collection.name}
                                            </CardTitle>
                                            {collection.description && (
                                                <CardDescription className="line-clamp-2">
                                                    {collection.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-2">
                                            <Badge
                                                variant="secondary"
                                                className="flex items-center gap-1"
                                            >
                                                {collection.is_public ? (
                                                    <Globe className="h-3 w-3" />
                                                ) : (
                                                    <Lock className="h-3 w-3" />
                                                )}
                                                {collection.is_public
                                                    ? 'Public'
                                                    : 'Private'}
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(collection);
                                                        }}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Collection
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>{collection.verses_count} verses</span>
                                        <span>
                                            {new Date(
                                                collection.created_at
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Collection</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{selectedCollection?.name}"?
                                This action cannot be undone and will remove all
                                verses from this collection.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsDeleteDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Collection'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
