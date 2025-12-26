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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Folder,
    FolderPlus,
    Edit,
    Trash2,
    Globe,
    Lock,
    Loader2,
    Palette,
    Eye,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

const colorOptions = [
    { value: '#3b82f6', label: 'Blue', bg: 'bg-blue-500' },
    { value: '#10b981', label: 'Green', bg: 'bg-green-500' },
    { value: '#f59e0b', label: 'Orange', bg: 'bg-orange-500' },
    { value: '#ef4444', label: 'Red', bg: 'bg-red-500' },
    { value: '#8b5cf6', label: 'Purple', bg: 'bg-purple-500' },
    { value: '#ec4899', label: 'Pink', bg: 'bg-pink-500' },
    { value: '#06b6d4', label: 'Cyan', bg: 'bg-cyan-500' },
    { value: '#84cc16', label: 'Lime', bg: 'bg-lime-500' },
];

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

interface CollectionFormData {
    name: string;
    description: string;
    color: string;
    is_public: boolean;
}

export default function CollectionsPage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] =
        useState<Collection | null>(null);
    const [editForm, setEditForm] = useState<CollectionFormData>({
        name: '',
        description: '',
        color: '#3b82f6',
        is_public: false,
    });
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

    const handleEdit = (collection: Collection) => {
        setSelectedCollection(collection);
        setEditForm({
            name: collection.name,
            description: collection.description || '',
            color: collection.color,
            is_public: collection.is_public,
        });
        setErrors({});
        setIsEditDialogOpen(true);
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

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedCollection) return;

        setIsSubmitting(true);
        setErrors({});

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const response = await fetch(
                `/api/collections/${selectedCollection.slug}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken || '',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        name: editForm.name,
                        description: editForm.description || null,
                        color: editForm.color,
                        is_public: editForm.is_public,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                } else {
                    throw new Error('Failed to update collection');
                }
                setIsSubmitting(false);
                return;
            }

            // Update in list
            setCollections((prev) =>
                prev.map((c) => (c.id === selectedCollection.id ? data : c))
            );

            setIsEditDialogOpen(false);
            setSelectedCollection(null);

            setSuccessMessage('Collection updated successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            setErrors({ general: 'Failed to update collection' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewCollection = (slug: string) => {
        router.visit(`/collections/${slug}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Collections</h1>
                    <p className="text-muted-foreground">
                        Organize and manage your Quran verse collections
                    </p>
                </div>
                <Button onClick={() => router.visit('/quran/reader')}>
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
                        <Button onClick={() => router.visit('/quran/reader')}>
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
                            className="group relative transition-all hover:shadow-md"
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
                                    <Badge
                                        variant="secondary"
                                        className="ml-2 flex items-center gap-1"
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
                            <CardFooter className="flex justify-between gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handleViewCollection(collection.slug)
                                    }
                                    className="flex-1"
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(collection)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(collection)}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardFooter>
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

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Collection</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleUpdate} className="space-y-4">
                        {errors.general && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {errors.general}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="edit-name">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, name: e.target.value })
                                }
                                disabled={isSubmitting}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={editForm.description}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        description: e.target.value,
                                    })
                                }
                                maxLength={500}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                Color
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        className={cn(
                                            'h-8 w-8 rounded-full transition-all hover:scale-110',
                                            color.bg,
                                            editForm.color === color.value &&
                                                'ring-2 ring-ring ring-offset-2'
                                        )}
                                        onClick={() =>
                                            setEditForm({
                                                ...editForm,
                                                color: color.value,
                                            })
                                        }
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="edit-is-public"
                                checked={editForm.is_public}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        is_public: e.target.checked,
                                    })
                                }
                                disabled={isSubmitting}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label
                                htmlFor="edit-is-public"
                                className="cursor-pointer"
                            >
                                Make this collection public
                            </Label>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
