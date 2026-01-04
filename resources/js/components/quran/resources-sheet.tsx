import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ResourceType {
    id: number;
    slug: string;
    name: string;
}

interface Resource {
    id: number;
    resource_type_id: number;
    resource_url: string;
    comment: string | null;
    resource_type: ResourceType;
    user: {
        name: string;
    };
}

interface ResourcesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    verseId: number;
    verseNumber: number;
}

export function ResourcesSheet({
    open,
    onOpenChange,
    verseId,
    verseNumber,
}: ResourcesSheetProps) {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchResources();
        }
    }, [open, verseId]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/verses/${verseId}/resources`);
            if (response.ok) {
                const data = await response.json();
                setResources(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch resources:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group resources by type
    const groupedResources = resources.reduce(
        (acc, resource) => {
            const type = resource.resource_type.name;
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(resource);
            return acc;
        },
        {} as Record<string, Resource[]>,
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Related Resources</SheetTitle>
                    <SheetDescription>
                        Resources for Verse {verseNumber}
                    </SheetDescription>
                </SheetHeader>

                <div className="px-4">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="flex h-40 items-center justify-center text-center">
                            <p className="text-muted-foreground">
                                No resources available yet
                            </p>
                        </div>
                    ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {Object.entries(groupedResources).map(
                                ([type, typeResources]) => (
                                    <AccordionItem key={type} value={type}>
                                        <AccordionTrigger>
                                            {type} ({typeResources.length})
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div
                                                className="space-y-4 overflow-y-auto pr-2"
                                                style={{ maxHeight: '500px' }}
                                            >
                                                {typeResources.map(
                                                    (resource) => (
                                                        <div
                                                            key={resource.id}
                                                            className="rounded-lg border p-3"
                                                        >
                                                            <a
                                                                href={
                                                                    resource.resource_url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="group mb-2 flex items-start gap-2 text-sm font-medium text-primary hover:underline"
                                                            >
                                                                <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                                                <span className="break-all">
                                                                    {
                                                                        resource.resource_url
                                                                    }
                                                                </span>
                                                            </a>
                                                            {resource.comment && (
                                                                <p className="mt-2 text-sm text-muted-foreground">
                                                                    {
                                                                        resource.comment
                                                                    }
                                                                </p>
                                                            )}
                                                            <p className="mt-2 text-xs text-muted-foreground">
                                                                Submitted by{' '}
                                                                {
                                                                    resource
                                                                        .user
                                                                        .name
                                                                }
                                                            </p>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ),
                            )}
                        </Accordion>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
