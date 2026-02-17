import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormEvent, useState } from 'react';

interface ReportErrorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    verseId: number;
    chapterId: number;
    verseNumber: number;
}

export function ReportErrorModal({
    open,
    onOpenChange,
    verseId,
    chapterId,
    verseNumber,
}: ReportErrorModalProps) {
    const [type, setType] = useState<string>('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const response = await fetch('/api/verse-reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    chapter_id: chapterId,
                    verse_id: verseId,
                    type,
                    description,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                } else {
                    setErrors({
                        general:
                            data.message ||
                            'An error occurred while submitting the report.',
                    });
                }
                setIsSubmitting(false);
                return;
            }

            // Success
            setType('');
            setDescription('');
            onOpenChange(false);
            setSuccessMessage(
                data.message ||
                    'Report submitted successfully. Thank you for your feedback!',
            );
            setShowSuccessDialog(true);
        } catch (error) {
            setErrors({ general: 'Network error. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Report Error</DialogTitle>
                        <DialogDescription>
                            Reporting error for Verse ({chapterId}:{verseNumber}
                            ). Please provide details about the issue.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        {errors.general && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {errors.general}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="report-type">
                                Error Type{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={type}
                                onValueChange={setType}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger id="report-type">
                                    <SelectValue placeholder="Select error type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="translation_error">
                                        Translation Error
                                    </SelectItem>
                                    <SelectItem value="transcription_error">
                                        Transcription Error
                                    </SelectItem>
                                    <SelectItem value="audio_misalignment">
                                        Audio Misalignment
                                    </SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && (
                                <p className="text-sm text-destructive">
                                    {errors.type}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Description{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Please describe the error in detail..."
                                className="min-h-[100px]"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isSubmitting}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">
                                    {errors.description}
                                </p>
                            )}
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
                            <Button
                                type="submit"
                                disabled={isSubmitting || !type || !description}
                            >
                                {isSubmitting
                                    ? 'Submitting...'
                                    : 'Submit Report'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={showSuccessDialog}
                onOpenChange={setShowSuccessDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Success</AlertDialogTitle>
                        <AlertDialogDescription>
                            {successMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => setShowSuccessDialog(false)}
                        >
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
