import { CollectionTagInput } from '@/components/collections/collection-tag-input';
import { CollectionTagList } from '@/components/collections/collection-tag-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useCollectionTagsQuery } from '@/hooks';
import { queryKeys } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { type CollectionTag } from '@/types/collections';
import { router } from '@inertiajs/react';
import { useQueryClient } from '@tanstack/react-query';
import {
    BookmarkPlus,
    Check,
    CheckCircle2,
    Folder,
    FolderPlus,
    Loader2,
    LogIn,
    Palette,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

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
    tags: CollectionTag[];
}

interface CollectionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    verseId: number;
    chapterId?: number;
    verseNumber?: number;
    totalVerses?: number;
}

interface CollectionTogglePayload {
    collection_ids: number[];
    verse_id?: number;
    range?: {
        chapter_id: number;
        from: number;
        to: number;
    };
}

export function CollectionsModal({
    open,
    onOpenChange,
    verseId,
    chapterId,
    verseNumber,
    totalVerses = 286, // Default to a reasonable max if not provided
}: CollectionsModalProps) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollectionIds, setSelectedCollectionIds] = useState<
        number[]
    >([]);
    const [fromVerse, setFromVerse] = useState<number>(verseNumber || 1);
    const [toVerse, setToVerse] = useState<number>(verseNumber || 1);
    const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionDescription, setNewCollectionDescription] =
        useState('');
    const [newCollectionColor, setNewCollectionColor] = useState('#3b82f6');
    const [newCollectionIsPublic, setNewCollectionIsPublic] = useState(false);
    const [newCollectionTags, setNewCollectionTags] = useState<CollectionTag[]>(
        [],
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCollections, setIsLoadingCollections] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
        null,
    );
    const [isContentReady, setIsContentReady] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const { tags: availableTags = [] } = useCollectionTagsQuery(
        open && isContentReady,
    );

    const loadCollections = useCallback(async () => {
        setIsLoadingCollections(true);
        setErrors({});
        setIsAuthenticated(null); // Reset auth status

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(`/api/collections/verse/${verseId}`, {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
            });

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
    }, [verseId]);

    // Wait until the dialog content has fully opened before starting fetches.
    useEffect(() => {
        if (open) {
            if (typeof window !== 'undefined') {
                const prefersReducedMotion = window.matchMedia(
                    '(prefers-reduced-motion: reduce)',
                ).matches;

                if (prefersReducedMotion) {
                    setIsContentReady(true);
                }
            }
        } else {
            setIsContentReady(false);
        }
    }, [open]);

    useEffect(() => {
        if (open && isContentReady) {
            loadCollections();
            if (verseNumber) {
                setFromVerse(verseNumber);
                setToVerse(verseNumber);
            }
        }
    }, [isContentReady, loadCollections, open, verseNumber]);

    // Focus name input when new collection form opens
    useEffect(() => {
        if (showNewCollectionForm) {
            // Small delay to ensure the input is rendered and visible
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 100);
        }
    }, [showNewCollectionForm]);

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
                    tags: newCollectionTags,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                } else if (response.status === 422 && data.max_collections) {
                    setErrors({
                        general:
                            data.message ||
                            `You can create up to ${data.max_collections} collections.`,
                    });
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
            setNewCollectionTags([]);
            setShowNewCollectionForm(false);
            setErrors({});
            queryClient.setQueryData<CollectionTag[]>(
                queryKeys.collectionTags,
                (current = []) => {
                    const next = [...current];

                    (data.tags || []).forEach((tag: CollectionTag) => {
                        if (
                            next.some(
                                (existingTag) =>
                                    existingTag.slug === tag.slug &&
                                    existingTag.type === tag.type,
                            )
                        ) {
                            return;
                        }

                        next.push(tag);
                    });

                    return next;
                },
            );

            setSuccessMessage('Collection created successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch {
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
            const body: CollectionTogglePayload = {
                collection_ids: selectedCollectionIds,
            };

            // If a range is selected and we have chapter info, send it as a range
            if (
                chapterId &&
                (fromVerse !== verseNumber || toVerse !== verseNumber)
            ) {
                body.range = {
                    chapter_id: chapterId,
                    from: fromVerse,
                    to: toVerse,
                };
            } else {
                body.verse_id = verseId;
            }

            const response = await fetch('/api/collections/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                body: JSON.stringify(body),
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
        } catch {
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
                setIsContentReady(false);
                setShowNewCollectionForm(false);
                setNewCollectionName('');
                setNewCollectionDescription('');
                setNewCollectionColor('#3b82f6');
                setNewCollectionIsPublic(false);
                setNewCollectionTags([]);
                setErrors({});
                setSuccessMessage(null);
                setIsAuthenticated(null);
                setCollections([]);
                setSelectedCollectionIds([]);
            }
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent
                    className="sm:max-w-[600px]"
                    onAnimationEnd={(event) => {
                        if (
                            open &&
                            event.currentTarget === event.target &&
                            event.currentTarget.dataset.state === 'open'
                        ) {
                            setIsContentReady(true);
                        }
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BookmarkPlus className="h-5 w-5" />
                            Add to Collections
                        </DialogTitle>
                        <DialogDescription>
                            Select collections to add these verses to, or create
                            a new collection.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[400px] overflow-y-auto p-1">
                        {/* Range Selection */}
                        {isAuthenticated === true &&
                            (totalVerses || 286) > 0 && (
                                <div className="mb-6 rounded-lg border bg-muted/30 p-4">
                                    <h4 className="mb-3 text-sm font-medium">
                                        Select Verse Range
                                    </h4>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 space-y-1.5">
                                            <Label
                                                htmlFor="from-verse"
                                                className="text-xs"
                                            >
                                                From
                                            </Label>
                                            <Select
                                                value={String(fromVerse)}
                                                onValueChange={(val) =>
                                                    setFromVerse(parseInt(val))
                                                }
                                            >
                                                <SelectTrigger
                                                    id="from-verse"
                                                    className="h-9"
                                                >
                                                    <SelectValue placeholder="From" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    {Array.from(
                                                        {
                                                            length:
                                                                totalVerses ||
                                                                286,
                                                        },
                                                        (_, i) => i + 1,
                                                    ).map((n) => (
                                                        <SelectItem
                                                            key={`from-${n}`}
                                                            value={String(n)}
                                                        >
                                                            Verse {n}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <Label
                                                htmlFor="to-verse"
                                                className="text-xs"
                                            >
                                                To
                                            </Label>
                                            <Select
                                                value={String(toVerse)}
                                                onValueChange={(val) =>
                                                    setToVerse(parseInt(val))
                                                }
                                            >
                                                <SelectTrigger
                                                    id="to-verse"
                                                    className="h-9"
                                                >
                                                    <SelectValue placeholder="To" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    {Array.from(
                                                        {
                                                            length:
                                                                totalVerses ||
                                                                286,
                                                        },
                                                        (_, i) => i + 1,
                                                    ).map((n) => (
                                                        <SelectItem
                                                            key={`to-${n}`}
                                                            value={String(n)}
                                                            disabled={
                                                                n < fromVerse
                                                            }
                                                        >
                                                            Verse {n}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-[10px] text-muted-foreground">
                                        {fromVerse === toVerse
                                            ? `Adding verse ${fromVerse} only.`
                                            : `Adding range from verse ${fromVerse} to ${toVerse} (${toVerse - fromVerse + 1} verses total).`}
                                    </p>
                                </div>
                            )}

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
                                    onClick={() =>
                                        setShowNewCollectionForm(true)
                                    }
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
                                                collection.id,
                                            ) && 'border-primary bg-primary/5',
                                        )}
                                    >
                                        <Checkbox
                                            id={`collection-${collection.id}`}
                                            checked={selectedCollectionIds.includes(
                                                collection.id,
                                            )}
                                            onCheckedChange={() =>
                                                handleToggleCollection(
                                                    collection.id,
                                                )
                                            }
                                        />
                                        <div
                                            className="h-10 w-1.5 flex-shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    collection.color,
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
                                            <CollectionTagList
                                                tags={collection.tags}
                                                className="mt-2"
                                            />
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
                        {isAuthenticated === false ? null : ( // Don't show footer buttons for unauthenticated users
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
                                    disabled={
                                        isLoading ||
                                        selectedCollectionIds.length === 0
                                    }
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
                                            {selectedCollectionIds.length}{' '}
                                            collection
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

            {/* Separate Dialog for Create Collection Form */}
            <Dialog
                open={showNewCollectionForm}
                onOpenChange={setShowNewCollectionForm}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderPlus className="h-5 w-5" />
                            Create New Collection
                        </DialogTitle>
                        <DialogDescription>
                            Create a new collection to organize your favorite
                            verses.
                        </DialogDescription>
                    </DialogHeader>

                    {errors.general && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {errors.general}
                        </div>
                    )}

                    <form
                        onSubmit={handleCreateCollection}
                        className="space-y-4"
                    >
                        {/* Collection Name */}
                        <div className="space-y-2">
                            <Label htmlFor="collection-name">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                ref={nameInputRef}
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
                                <span className="text-sm text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <textarea
                                id="collection-description"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Brief description of this collection..."
                                value={newCollectionDescription}
                                onChange={(e) =>
                                    setNewCollectionDescription(e.target.value)
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

                        <CollectionTagInput
                            value={newCollectionTags}
                            onChange={setNewCollectionTags}
                            availableTags={availableTags}
                            disabled={isSubmitting}
                            description="Choose existing tags or create new ones for this collection."
                        />

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
                                                'ring-2 ring-ring ring-offset-2',
                                        )}
                                        onClick={() =>
                                            setNewCollectionColor(color.value)
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
                                    setNewCollectionIsPublic(checked as boolean)
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

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowNewCollectionForm(false);
                                    setErrors({});
                                    setNewCollectionTags([]);
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
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
