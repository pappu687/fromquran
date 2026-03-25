import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';

interface FullResourceDialogProps {
    open: boolean;
    resource: {
        title: string | null;
        url: string | null;
        comment: string;
    } | null;
    onOpenChange: (open: boolean) => void;
    onClose: () => void;
    mobileFullscreen?: boolean;
}

export function FullResourceDialog({
    open,
    resource,
    onOpenChange,
    onClose,
    mobileFullscreen = false,
}: FullResourceDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={
                    mobileFullscreen
                        ? 'h-screen w-screen max-w-none p-4 sm:h-auto sm:w-auto sm:max-w-[80rem] sm:p-6'
                        : 'max-w-[80rem]'
                }
            >
                <DialogHeader className="pr-8">
                    <DialogTitle className="text-base leading-tight sm:text-[1.05rem]">
                        {resource?.title || 'Full Description'}
                    </DialogTitle>
                    {resource?.url && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-7 w-fit gap-1.5 px-2.5 text-[11px] font-medium"
                            asChild
                        >
                            <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Source
                            </a>
                        </Button>
                    )}
                </DialogHeader>
                <div
                    className={
                        mobileFullscreen
                            ? 'no-scrollbar -mx-4 max-h-[calc(100vh-12rem)] overflow-y-auto px-4 sm:max-h-[50vh]'
                            : 'no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4'
                    }
                >
                    <div
                        className="text-sm whitespace-pre-wrap text-foreground"
                        dangerouslySetInnerHTML={{
                            __html: resource?.comment || '',
                        }}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
