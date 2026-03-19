import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Edit,
    Globe,
    GripVertical,
    Loader2,
    Lock,
    Palette,
    Trash2,
} from 'lucide-react';
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

interface Verse {
    id: number;
    verse_key: string;
    verse_number: number;
    text_uthmani: string;
    text_imlaei_simple?: string;
    translation?: string;
    chapter: {
        id: number;
        chapter_number: number;
        name_simple: string;
        name_roman?: string;
        name_arabic: string;
    };
    pivot: {
        display_order: number;
    };
}

interface Collection {
    id: number;
    name: string;
    description?: string;
    color: string;
    is_public: boolean;
    status: 'pending' | 'approved' | 'rejected';
    slug: string;
    created_at: string;
    verses: Verse[];
}

interface CollectionFormData {
    name: string;
    description: string;
    color: string;
    is_public: boolean;
}

interface SortableVerseItemProps {
    verse: Verse;
    onDelete: (verseId: number) => void;
}

interface ChapterVersesResponse {
    data?: Array<{
        verseNumber: number;
        translation?: string;
    }>;
}

function SortableVerseItem({ verse, onDelete }: SortableVerseItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: verse.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group rounded-3xl border border-slate-200 bg-white p-5 shadow-none transition-colors',
                isDragging && 'border-slate-300 shadow-sm',
            )}
        >
            <div className="flex items-start gap-4">
                <button
                    className="mt-1 cursor-grab rounded-full p-1 text-slate-400 hover:text-slate-700 active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={() =>
                            router.visit(
                                `/${verse.chapter.chapter_number}/${verse.verse_number}`,
                            )
                        }
                        className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left transition-colors hover:border-slate-300"
                    >
                        <Badge
                            variant="outline"
                            className="border-slate-200 font-mono text-xs text-slate-700"
                        >
                            {verse.verse_key}
                        </Badge>
                        <span className="text-sm text-slate-500">
                            {verse.chapter.name_roman ??
                                verse.chapter.name_simple}
                        </span>
                    </button>
                    <p
                        className="font-arabic mb-3 text-right text-3xl leading-relaxed text-slate-950"
                        dir="rtl"
                    >
                        {verse.text_uthmani}
                    </p>
                    {verse.translation && (
                        <p className="text-sm leading-7 font-medium text-slate-700">
                            {verse.translation}
                        </p>
                    )}
                    {verse.text_imlaei_simple && (
                        <p className="mt-2 text-sm text-slate-400">
                            {verse.text_imlaei_simple}
                        </p>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(verse.id)}
                    className="rounded-full text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default function CollectionDetailPage({ slug }: { slug: string }) {
    const [collection, setCollection] = useState<Collection | null>(null);
    const [verses, setVerses] = useState<Verse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState<CollectionFormData>({
        name: '',
        description: '',
        color: '#3b82f6',
        is_public: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const getStatusBadgeClasses = (status: Collection['status']) => {
        if (status === 'approved') {
            return 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400';
        }

        if (status === 'rejected') {
            return 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400';
        }

        return 'border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    };

    useEffect(() => {
        loadCollection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const loadCollection = async () => {
        setIsLoading(true);
        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(`/api/collections/${slug}`, {
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

            if (response.status === 404) {
                router.visit('/my-collections');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load collection');
            }

            const data = await response.json();
            setCollection(data);
            const loadedVerses: Verse[] = data.verses || [];
            setVerses(loadedVerses);
            // load translations for these verses
            loadTranslations(loadedVerses);
        } catch (error) {
            console.error('Failed to load collection:', error);
            setErrors({
                general: 'Failed to load collection. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // load translations for verses in this collection using Quran API (Solr-backed)
    const loadTranslations = async (loadedVerses: Verse[]) => {
        try {
            const byChapter: Record<number, Verse[]> = {};
            loadedVerses.forEach((v) => {
                const chapterNumber = v.chapter.chapter_number;
                if (!byChapter[chapterNumber]) {
                    byChapter[chapterNumber] = [];
                }
                byChapter[chapterNumber].push(v);
            });

            const translationMap: Record<string, string> = {};

            await Promise.all(
                Object.entries(byChapter).map(
                    async ([chapterNumStr, versesInChapter]) => {
                        const chapterNumber = Number(chapterNumStr);
                        const verseNumbers = versesInChapter.map(
                            (v) => v.verse_number,
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

            setVerses((prev) =>
                prev.map((v) => {
                    const key = `${v.chapter.chapter_number}:${v.verse_number}`;
                    return {
                        ...v,
                        translation: translationMap[key] ?? v.translation,
                    };
                }),
            );
        } catch (error) {
            console.error(
                'Failed to load translations for collection verses',
                error,
            );
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = verses.findIndex((v) => v.id === active.id);
        const newIndex = verses.findIndex((v) => v.id === over.id);

        const newVerses = arrayMove(verses, oldIndex, newIndex);
        setVerses(newVerses);

        const verseOrders = newVerses.map((verse: Verse, index: number) => ({
            verse_id: verse.id,
            display_order: index + 1,
        }));

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(`/api/collections/${slug}/reorder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                body: JSON.stringify({ verses: verseOrders }),
            });

            if (!response.ok) {
                throw new Error('Failed to reorder verses');
            }

            setSuccessMessage('Verses reordered successfully');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (error) {
            console.error('Failed to reorder verses:', error);
            loadCollection();
        }
    };

    const handleDeleteVerse = async (verseId: number) => {
        if (
            !window.confirm(
                'Are you sure you want to remove this verse from the collection?',
            )
        ) {
            return;
        }

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(`/api/collections/${slug}/verses`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                body: JSON.stringify({ verse_id: verseId }),
            });

            if (!response.ok) {
                throw new Error('Failed to remove verse');
            }

            setVerses((prev) => prev.filter((v) => v.id !== verseId));
            setSuccessMessage('Verse removed from collection');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            console.error('Failed to remove verse:', error);
            setErrors({ general: 'Failed to remove verse' });
        }
    };

    const handleEdit = () => {
        if (!collection) return;
        setEditForm({
            name: collection.name,
            description: collection.description || '',
            color: collection.color,
            is_public: collection.is_public,
        });
        setErrors({});
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault();
        if (!collection) return;

        setIsSubmitting(true);
        setErrors({});

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const response = await fetch(`/api/collections/${slug}`, {
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
            });

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

            setCollection(data);
            setIsEditDialogOpen(false);
            setSuccessMessage('Collection updated successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch {
            setErrors({ general: 'Failed to update collection' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <Head title="Collection - From Quran" />
                <div className="flex flex-1 flex-col bg-[#fafaf8]">
                    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-4 py-10 sm:px-6">
                        <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!collection) {
        return null;
    }

    return (
        <AppLayout>
            <Head title={`${collection.name} - From Quran`} />
            <div className="flex flex-1 flex-col bg-[#fafaf8]">
                <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
                    <section className="border-b border-slate-200 pb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.visit('/my-collections')}
                            className="mb-5 rounded-full px-3 text-slate-600"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Collections
                        </Button>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                                <div className="mb-3 flex items-center gap-3">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{
                                            backgroundColor: collection.color,
                                        }}
                                    />
                                    <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                                        {collection.name}
                                    </h1>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className="rounded-full bg-stone-100 px-2.5 py-1 text-slate-600"
                                    >
                                        {collection.is_public ? (
                                            <Globe className="mr-1 h-3 w-3" />
                                        ) : (
                                            <Lock className="mr-1 h-3 w-3" />
                                        )}
                                        {collection.is_public
                                            ? 'Public'
                                            : 'Private'}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="rounded-full bg-stone-100 px-2.5 py-1 text-slate-600"
                                    >
                                        {verses.length}{' '}
                                        {verses.length === 1
                                            ? 'verse'
                                            : 'verses'}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'rounded-full px-2.5 py-1',
                                            getStatusBadgeClasses(
                                                collection.status,
                                            ),
                                        )}
                                    >
                                        {collection.status
                                            .charAt(0)
                                            .toUpperCase() +
                                            collection.status.slice(1)}
                                    </Badge>
                                </div>
                                {collection.description && (
                                    <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                                        {collection.description}
                                    </p>
                                )}
                            </div>
                            <Button
                                onClick={handleEdit}
                                className="rounded-full px-5"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Collection
                            </Button>
                        </div>
                    </section>

                    {successMessage && (
                        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            {successMessage}
                        </div>
                    )}

                    {errors.general && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errors.general}
                        </div>
                    )}

                    {verses.length === 0 ? (
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                            <CardContent className="py-16">
                                <h2 className="mb-2 text-xl font-semibold text-slate-950">
                                    No verses yet
                                </h2>
                                <p className="mb-6 text-sm leading-7 text-slate-500">
                                    Browse the Quran to add verses to this
                                    collection
                                </p>
                                <Button
                                    onClick={() => router.visit('/')}
                                    className="rounded-full px-5"
                                >
                                    Browse Quran
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={verses.map((v) => v.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-4">
                                    {verses.map((verse) => (
                                        <SortableVerseItem
                                            key={verse.id}
                                            verse={verse}
                                            onDelete={handleDeleteVerse}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                    <Dialog
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                    >
                        <DialogContent className="rounded-3xl border-slate-200 sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Edit Collection</DialogTitle>
                            </DialogHeader>

                            <form onSubmit={handleUpdate} className="space-y-4">
                                {errors.general && (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                        {errors.general}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">
                                        Name{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="edit-name"
                                        value={editForm.name}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                name: e.target.value,
                                            })
                                        }
                                        disabled={isSubmitting}
                                        className="rounded-2xl border-slate-200 bg-white shadow-none"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">
                                        Description
                                    </Label>
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
                                        className="rounded-2xl border-slate-200 bg-white shadow-none"
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
                                                    editForm.color ===
                                                        color.value &&
                                                        'ring-2 ring-slate-950 ring-offset-2',
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
                                        className="rounded-full"
                                        onClick={() =>
                                            setIsEditDialogOpen(false)
                                        }
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="rounded-full"
                                    >
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
            </div>
        </AppLayout>
    );
}
