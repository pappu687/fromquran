import { Button } from '@/components/ui/button';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    BookmarkPlus,
    Folder,
    FolderPlus,
    Loader2,
    Palette,
    Check,
    CheckCircle2,
    LogIn,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

// Color options for collections
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
    contains_verse?: boolean;
}

interface CollectionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    verseId: number;
}

export function CollectionsModal({
    open,
    onOpenChange,
    verseId,
}: CollectionsModalProps) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollectionIds, setSelectedCollectionIds] = useState<number[]>(
        []
    );
    const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionDescription, setNewCollectionDescription] = useState('');
    const [newCollectionColor, setNewCollectionColor] = useState('#3b82f6');
    const [newCollectionIsPublic, setNewCollectionIsPublic] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCollections, setIsLoadingCollections] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // Load collections when modal opens
    useEffect(() => {
        if (open) {
            loadCollections();
        }
    }, [open, verseId]);

    const loadCollections = async () => {
        setIsLoadingCollections(true);
        setErrors({});
        setIsAuthenticated(null); // Reset auth status

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(
                `/api/collections/verse/${verseId}`,
                {
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken || '',
                    },
                    credentials: 'include',
                }
            );

            if (response.status === 401) {
                setIsAuthenticated(false);
                setIsLoadingCollections(false);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load collections');
            }

            setIsAuthenticated(true);
            const data = await response.json();
            setCollections(data);

            // Pre-select collections that contain this verse
            const preselected = data
                .filter((c: Collection) => c.contains_verse)
                .map((c: Collection) => c.id);
            setSelectedCollectionIds(preselected);
        } catch (error) {
            console.error('Failed to load collections:', error);
            setIsAuthenticated(false);
            setErrors({
                general: 'Failed to load collections. Please try again.',
            });
        } finally {
            setIsLoadingCollections(false);
        }
    };

    const handleToggleCollection = (collectionId: number) => {
        setSelectedCollectionIds((prev) => {
            if (prev.includes(collectionId)) {
                return prev.filter((id) => id !== collectionId);
            } else {
                return [...prev, collectionId];
            }
        });
    };

    const handleCreateCollection = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const response = await fetch('/api/collections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: newCollectionName,
                    description: newCollectionDescription || null,
                    color: newCollectionColor,
                    is_public: newCollectionIsPublic,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                } else if (response.status === 401) {
                    router.visit('/login');
                    return;
                } else {
                    setErrors({ general: data.message || 'An error occurred' });
                }
                setIsSubmitting(false);
                return;
            }

            // Add new collection to the list and select it
            setCollections((prev) => [data, ...prev]);
            setSelectedCollectionIds((prev) => [...prev, data.id]);

            // Reset form
            setNewCollectionName('');
            setNewCollectionDescription('');
            setNewCollectionColor('#3b82f6');
            setNewCollectionIsPublic(false);
            setShowNewCollectionForm(false);
            setErrors({});

            setSuccessMessage('Collection created successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            setErrors({ general: 'Network error. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveToCollections = async () => {
        if (selectedCollectionIds.length === 0) {
            setErrors({ general: 'Please select at least one collection' });
            return;
        }

        setIsLoading(true);
        setErrors({});

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const response = await fetch('/api/collections/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                body: JSON.stringify({
                    verse_id: verseId,
                    collection_ids: selectedCollectionIds,
                }),
            });

            if (response.status === 401) {
                router.visit('/login');
                return;
            }

            if (!response.ok) {
                const data = await response.json();
                setErrors({
                    general: data.message || 'Failed to save to collections',
                });
                setIsLoading(false);
                return;
            }

            setSuccessMessage('Verse added to collections successfully!');
            setTimeout(() => {
                setSuccessMessage(null);
                onOpenChange(false);
            }, 1500);
        } catch (error) {
            setErrors({ general: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!isLoading && !isSubmitting) {
            onOpenChange(newOpen);
            if (!newOpen) {
                // Reset state when closing
                setShowNewCollectionForm(false);
                setNewCollectionName('');
                setNewCollectionDescription('');
                setNewCollectionColor('#3b82f6');
                setNewCollectionIsPublic(false);
                setErrors({});
                setSuccessMessage(null);
                setIsAuthenticated(null);
                setCollections([]);
                setSelectedCollectionIds([]);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookmarkPlus className="h-5 w-5" />
                        Add to Collections
                    </DialogTitle>
                    <DialogDescription>
                        Select collections to add this verse to, or create a new
                        collection.
                    </DialogDescription>
                </DialogHeader>

                {successMessage && (
                    <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        {successMessage}
                    </div>
                )}

                {errors.general && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {errors.general}
                    </div>
                )}

                <div className="max-h-[400px] overflow-y-auto">
                    {isAuthenticated === false ? (
                        // Show login prompt if not authenticated
                        <div className="py-8 text-center">
                            <LogIn className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                            <h3 className="mb-2 text-lg font-semibold">
                                Please Log In
                            </h3>
                            <p className="mb-6 text-muted-foreground">
                                You need to be logged in to save verses to
                                collections.
                            </p>
                            <div className="flex justify-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => router.visit('/login')}
                                >
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Log In
                                </Button>
                            </div>
                        </div>
                    ) : isLoadingCollections ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : collections.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <Folder className="mx-auto mb-2 h-12 w-12 opacity-50" />
                            <p className="mb-4">No collections yet</p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowNewCollectionForm(true)}
                            >
                                <FolderPlus className="mr-2 h-4 w-4" />
                                Create your first collection
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {collections.map((collection) => (
                                <div
                                    key={collection.id}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
                                        selectedCollectionIds.includes(
                                            collection.id
                                        ) && 'border-primary bg-primary/5'
                                    )}
                                >
                                    <Checkbox
                                        id={`collection-${collection.id}`}
                                        checked={selectedCollectionIds.includes(
                                            collection.id
                                        )}
                                        onCheckedChange={() =>
                                            handleToggleCollection(
                                                collection.id
                                            )
                                        }
                                    />
                                    <div
                                        className="h-10 w-1.5 flex-shrink-0 rounded-full"
                                        style={{
                                            backgroundColor: collection.color,
                                        }}
                                    />
                                    <div className="flex-1">
                                        <label
                                            htmlFor={`collection-${collection.id}`}
                                            className="cursor-pointer font-medium"
                                        >
                                            {collection.name}
                                        </label>
                                        {collection.description && (
                                            <p className="text-sm text-muted-foreground">
                                                {collection.description}
                                            </p>
                                        )}
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {collection.verses_count} verses
                                    </Badge>
                                    {collection.contains_verse && (
                                        <Check className="h-5 w-5 text-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* New Collection Form */}
                    {showNewCollectionForm && (
                        <form
                            onSubmit={handleCreateCollection}
                            className="mt-4 space-y-4 rounded-lg border p-4"
                        >
                            <h4 className="font-semibold">Create New Collection</h4>

                            {/* Collection Name */}
                            <div className="space-y-2">
                                <Label htmlFor="collection-name">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="collection-name"
                                    placeholder="My favorite verses"
                                    value={newCollectionName}
                                    onChange={(e) =>
                                        setNewCollectionName(e.target.value)
                                    }
                                    disabled={isSubmitting}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="collection-description">
                                    Description{' '}
                                    <span className="text-muted-foreground text-sm">
                                        (optional)
                                    </span>
                                </Label>
                                <textarea
                                    id="collection-description"
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Brief description of this collection..."
                                    value={newCollectionDescription}
                                    onChange={(e) =>
                                        setNewCollectionDescription(
                                            e.target.value
                                        )
                                    }
                                    maxLength={500}
                                    disabled={isSubmitting}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Color Picker */}
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
                                                newCollectionColor ===
                                                    color.value &&
                                                    'ring-2 ring-ring ring-offset-2'
                                            )}
                                            onClick={() =>
                                                setNewCollectionColor(
                                                    color.value
                                                )
                                            }
                                            title={color.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Public Toggle */}
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is-public"
                                    checked={newCollectionIsPublic}
                                    onCheckedChange={(checked) =>
                                        setNewCollectionIsPublic(
                                            checked as boolean
                                        )
                                    }
                                    disabled={isSubmitting}
                                />
                                <Label
                                    htmlFor="is-public"
                                    className="cursor-pointer"
                                >
                                    Make this collection public
                                </Label>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowNewCollectionForm(false);
                                        setErrors({});
                                    }}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !newCollectionName}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FolderPlus className="mr-2 h-4 w-4" />
                                            Create Collection
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Create Collection Button */}
                    {!showNewCollectionForm && collections.length > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            className="mt-4 w-full"
                            onClick={() => setShowNewCollectionForm(true)}
                        >
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Create New Collection
                        </Button>
                    )}
                </div>

                <DialogFooter>
                    {isAuthenticated === false ? (
                        // Don't show footer buttons for unauthenticated users
                        null
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveToCollections}
                                disabled={isLoading || selectedCollectionIds.length === 0}
                            >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <BookmarkPlus className="mr-2 h-4 w-4" />
                                Save to{' '}
                                {selectedCollectionIds.length} collection
                                {selectedCollectionIds.length !== 1
                                    ? 's'
                                    : ''}
                            </>
                        )}
                    </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
