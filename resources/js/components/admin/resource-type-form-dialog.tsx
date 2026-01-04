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
import { Loader2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

interface ResourceType {
    id: number;
    slug: string;
    name: string;
    display_order: number;
}

interface ResourceTypeFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resourceType: ResourceType | null;
    onSuccess: () => void;
}

export function ResourceTypeFormDialog({
    open,
    onOpenChange,
    resourceType,
    onSuccess,
}: ResourceTypeFormDialogProps) {
    const [slug, setSlug] = useState('');
    const [name, setName] = useState('');
    const [displayOrder, setDisplayOrder] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{
        slug?: string;
        name?: string;
        display_order?: string;
    }>({});

    useEffect(() => {
        if (resourceType) {
            setSlug(resourceType.slug);
            setName(resourceType.name);
            setDisplayOrder(resourceType.display_order);
        } else {
            setSlug('');
            setName('');
            setDisplayOrder(0);
        }
        setErrors({});
    }, [resourceType, open]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const url = resourceType
                ? `/admin/resource-types/${resourceType.id}`
                : '/admin/resource-types';
            const method = resourceType ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                body: JSON.stringify({
                    slug,
                    name,
                    display_order: displayOrder,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    throw new Error(
                        data.message || 'Failed to save resource type'
                    );
                }
                return;
            }

            onOpenChange(false);
            onSuccess();
        } catch (error) {
            console.error('Failed to save resource type:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to save resource type'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {resourceType ? 'Edit Resource Type' : 'Create Resource Type'}
                    </DialogTitle>
                    <DialogDescription>
                        {resourceType
                            ? 'Update the resource type details.'
                            : 'Create a new resource type for categorizing verse resources.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Slug */}
                        <div className="space-y-2">
                            <Label htmlFor="slug">
                                Slug <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="e.g., youtube_tafseer"
                                disabled={isSubmitting}
                            />
                            {errors.slug && (
                                <p className="text-sm text-destructive">
                                    {errors.slug}
                                </p>
                            )}
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Display Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., YouTube Tafseer"
                                disabled={isSubmitting}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Display Order */}
                        <div className="space-y-2">
                            <Label htmlFor="display_order">Display Order</Label>
                            <Input
                                id="display_order"
                                type="number"
                                min="0"
                                value={displayOrder}
                                onChange={(e) =>
                                    setDisplayOrder(Number(e.target.value))
                                }
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">
                                Lower numbers appear first in lists
                            </p>
                            {errors.display_order && (
                                <p className="text-sm text-destructive">
                                    {errors.display_order}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
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
                            ) : resourceType ? (
                                'Update'
                            ) : (
                                'Create'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
