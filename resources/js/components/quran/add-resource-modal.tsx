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
import { router } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

interface AddResourceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    verseId?: number;
    chapterId?: number;
}

interface ResourceType {
    id: number;
    slug: string;
    name: string;
}

export function AddResourceModal({
    open,
    onOpenChange,
    verseId,
    chapterId,
}: AddResourceModalProps) {
    const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
    const [resourceTypeId, setResourceTypeId] = useState('');
    const [resourceUrl, setResourceUrl] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingTypes, setIsLoadingTypes] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch resource types when modal opens
    useEffect(() => {
        if (open && resourceTypes.length === 0) {
            fetchResourceTypes();
        }
    }, [open]);

    const fetchResourceTypes = async () => {
        setIsLoadingTypes(true);
        try {
            const response = await fetch('/api/resource-types');
            if (response.ok) {
                const data = await response.json();
                setResourceTypes(data);
            }
        } catch (error) {
            console.error('Failed to fetch resource types:', error);
        } finally {
            setIsLoadingTypes(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        // Get CSRF token from meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        try {
            const endpoint = chapterId ? '/user-chapter-resources' : '/user-resources';
            const payload = {
                resource_type_id: resourceTypeId,
                resource_url: resourceUrl,
                comment: comment || null,
                ...(verseId && { verse_id: verseId }),
                ...(chapterId && { chapter_id: chapterId }),
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                } else if (response.status === 401) {
                    // Redirect to login
                    router.visit('/login');
                } else {
                    setErrors({ general: data.message || 'An error occurred' });
                }
                setIsSubmitting(false);
                return;
            }

            // Success - reset form and close modal
            setResourceTypeId('');
            setResourceUrl('');
            setComment('');
            onOpenChange(false);

            // Show success message (you can use a toast here)
            alert(
                data.message ||
                    'Resource submitted successfully and is pending approval.',
            );
        } catch (error) {
            setErrors({ general: 'Network error. Please try again.' });
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!isSubmitting) {
            onOpenChange(newOpen);
            if (!newOpen) {
                // Reset form when closing
                setResourceTypeId('');
                setResourceUrl('');
                setComment('');
                setErrors({});
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Submit Resource</DialogTitle>
                    <DialogDescription>
                        Share a helpful resource related to this verse. Your
                        submission will be reviewed before being published.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {errors.general}
                        </div>
                    )}

                    {/* Resource Type */}
                    <div className="space-y-2">
                        <Label htmlFor="resource-type">
                            Resource Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={resourceTypeId}
                            onValueChange={setResourceTypeId}
                            disabled={isSubmitting || isLoadingTypes}
                        >
                            <SelectTrigger id="resource-type">
                                <SelectValue placeholder={isLoadingTypes ? 'Loading types...' : 'Select resource type'} />
                            </SelectTrigger>
                            <SelectContent>
                                {resourceTypes.map((type) => (
                                    <SelectItem
                                        key={type.id}
                                        value={type.id.toString()}
                                    >
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.resource_type_id && (
                            <p className="text-sm text-destructive">
                                {errors.resource_type_id}
                            </p>
                        )}
                    </div>

                    {/* Resource URL */}
                    <div className="space-y-2">
                        <Label htmlFor="resource-url">
                            Resource URL <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="resource-url"
                            type="url"
                            placeholder="https://example.com/resource"
                            value={resourceUrl}
                            onChange={(e) => setResourceUrl(e.target.value)}
                            disabled={isSubmitting}
                        />
                        {errors.resource_url && (
                            <p className="text-sm text-destructive">
                                {errors.resource_url}
                            </p>
                        )}
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <Label htmlFor="comment">
                            Comment{' '}
                            <span className="text-muted-foreground text-sm">
                                (optional, max 250 chars)
                            </span>
                        </Label>
                        <textarea
                            id="comment"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Add a brief comment about this resource..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={250}
                            disabled={isSubmitting}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                                {errors.comment && (
                                    <span className="text-destructive">
                                        {errors.comment}
                                    </span>
                                )}
                            </span>
                            <span>
                                {comment.length}/250
                            </span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Resource'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
