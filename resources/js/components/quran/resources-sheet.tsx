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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Tags } from 'lucide-react';
import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { AddResourceModal } from './add-resource-modal';

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
    is_truncated?: boolean;
    resource_type: ResourceType;
    user: {
        name: string;
    };
}

interface SimilarVerse {
    id: number;
    verse_key: string;
    verse_number: number;
    chapter_id: number;
    chapter_number: number;
    chapter_name: string;
    chapter_name_roman: string;
    text_uthmani: string;
    translation: string;
    translation_resource: string;
    matched_words_count: number;
    coverage: number;
    score: number;
    match_words_range: number[][];
}

interface Topic {
    topic_id: number;
    name: string;
    arabic_name: string;
}

interface ResourcesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    verseId: number;
    verseNumber: number;
    chapterNumber?: number;
}

export function ResourcesSheet({
    open,
    onOpenChange,
    verseId,
    verseNumber,
    chapterNumber,
}: ResourcesSheetProps) {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingFull, setLoadingFull] = useState(false);
    const [selectedComment, setSelectedComment] = useState<string | null>(null);
    const [similarVerses, setSimilarVerses] = useState<SimilarVerse[]>([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);

    useEffect(() => {
        if (open) {
            fetchResources();
            fetchSimilarVerses();
            fetchTopics();
        }
    }, [open, verseId]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/verses/${verseId}/resources?limit=5`,
            );
            if (response.ok) {
                const data = await response.json();
                setResources(data.data || []);
                setHasMore(Boolean(data.meta?.hasMore));
            }
        } catch (error) {
            console.error('Failed to fetch resources:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSimilarVerses = async () => {
        setLoadingSimilar(true);
        try {
            const response = await fetch(`/api/verses/${verseId}/similar`);
            if (response.ok) {
                const data = await response.json();
                setSimilarVerses(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch similar verses:', error);
        } finally {
            setLoadingSimilar(false);
        }
    };

    const fetchTopics = async () => {
        setLoadingTopics(true);
        try {
            const response = await fetch(`/api/verses/${verseId}/topics`);
            if (response.ok) {
                const data = await response.json();
                setTopics(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch topics:', error);
        } finally {
            setLoadingTopics(false);
        }
    };

    const handleSeeMore = async (resourceId: number) => {
        setLoadingFull(true);
        try {
            const response = await fetch(`/api/resources/${resourceId}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedComment(data.data.comment);
            }
        } catch (error) {
            console.error('Failed to fetch full resource:', error);
        } finally {
            setLoadingFull(false);
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

    const hasGroupWithMoreThanFive =
        Object.values(groupedResources).some((items) => items.length > 5);

    // Handle verse click - navigate to the verse
    const handleVerseClick = (chapterNumber: number, verseNumber: number) => {
        router.visit(`/${chapterNumber}/${verseNumber}`, {
            method: 'get',
        });
        onOpenChange(false);
    };

    // Format match words range for display
    const formatMatchRange = (range: number[][]): string => {
        if (!range || range.length === 0) return '';
        return range.map(r => `words ${r[0]}-${r[1]}`).join(', ');
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Related Resources for ({chapterNumber} : {verseNumber})</SheetTitle>                    
                </SheetHeader>

                {chapterNumber && hasMore && (
                    <div className="px-4 pb-2">
                        <Button
                            variant="outline"
                            size="sm"                            
                            onClick={() =>
                                router.visit(
                                    `/related/${chapterNumber}/${verseNumber}`,
                                )
                            }
                        >
                            View all ({resources.length})
                        </Button>
                    </div>
                )}

                <div className="px-4">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center text-center gap-3">
                            <p className="text-muted-foreground">
                                No resources available yet
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAddResourceOpen(true)}
                            >
                                Add a resource
                            </Button>
                        </div>
                    ) : (
                        <Accordion
                            type="single"
                            collapsible
                            defaultValue={Object.keys(groupedResources)[0]}
                            className="w-full"
                        >
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
                                                                <div className="mt-2 text-sm text-muted-foreground">
                                                                    <div
                                                                        className="whitespace-pre-wrap"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: resource.comment,
                                                                        }}
                                                                    />
                                                                    {resource.is_truncated && (
                                                                        <Button
                                                                            variant="link"
                                                                            className="ml-1 h-auto p-0 px-1 font-normal text-primary"
                                                                            disabled={
                                                                                loadingFull
                                                                            }
                                                                            onClick={() =>
                                                                                handleSeeMore(
                                                                                    resource.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            {loadingFull
                                                                                ? 'Loading...'
                                                                                : 'See more'}
                                                                        </Button>
                                                                    )}
                                                                </div>
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
                            {topics.length > 0 && (
                                <AccordionItem value="Topics">
                                    <AccordionTrigger>
                                        Topics ({topics.length})
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="flex flex-wrap gap-2 p-2">
                                            {topics.map((topic) => (
                                                <Badge
                                                    key={topic.topic_id}
                                                    variant="secondary"
                                                    className="cursor-pointer bg-amber-400/20 border-amber-500/50"
                                                    onClick={() => {
                                                        router.visit(
                                                            `/topic/${topic.topic_id}`,
                                                        );
                                                        onOpenChange(false);
                                                    }}
                                                >
                                                    <Tags className="mr-1 h-3 w-3" />
                                                    {topic.name}
                                                    {topic.arabic_name && (
                                                        <span className="ml-1 font-arabic text-xs">
                                                            ({topic.arabic_name})
                                                        </span>
                                                    )}
                                                </Badge>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                            {similarVerses.length > 0 && (
                                <AccordionItem value="Related Verses">
                                    <AccordionTrigger>
                                        Related Verses ({similarVerses.length})
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div
                                            className="space-y-4 overflow-y-auto pr-2"
                                            style={{ maxHeight: '500px' }}
                                        >
                                            {similarVerses.map((similar) => (
                                                <div
                                                    key={similar.id}
                                                    className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                                    onClick={() =>
                                                        handleVerseClick(
                                                            similar.chapter_number,
                                                            similar.verse_number,
                                                        )
                                                    }
                                                >
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <span className="text-sm font-semibold text-primary">
                                                            {similar.chapter_name} (
                                                            {similar.chapter_number}:
                                                            {similar.verse_number})
                                                        </span>
                                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                                            <span>
                                                                Score: {similar.score}
                                                            </span>
                                                            <span>
                                                                Coverage:{' '}
                                                                {similar.coverage}%
                                                            </span>
                                                            <span>
                                                                Words:{' '}
                                                                {similar.matched_words_count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="mb-2 text-right text-sm font-arabic text-foreground ltr:font-sans rtl:font-arabic">
                                                        {similar.text_uthmani}
                                                    </p>
                                                    {similar.translation && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {similar.translation}
                                                        </p>
                                                    )}
                                                    {similar.match_words_range &&
                                                        similar.match_words_range
                                                            .length > 0 && (
                                                            <p className="mt-2 text-xs text-muted-foreground">
                                                                Match:{' '}
                                                                {formatMatchRange(
                                                                    similar.match_words_range,
                                                                )}
                                                            </p>
                                                        )}
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                            <div className="mt-4 flex justify-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddResourceOpen(true)}
                                >
                                    Add a resource
                                </Button>
                            </div>
                        </Accordion>
                    )}
                </div>
            </SheetContent>

            <Dialog
                open={!!selectedComment}
                onOpenChange={(open) => !open && setSelectedComment(null)}
            >
                <DialogContent className="max-w-[80rem]">
                    <DialogHeader>
                        <DialogTitle>Full Description</DialogTitle>
                    </DialogHeader>
                    <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
                        <div
                            className="text-sm whitespace-pre-wrap text-foreground"
                            dangerouslySetInnerHTML={{
                                __html: selectedComment || '',
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedComment(null)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AddResourceModal
                open={isAddResourceOpen}
                onOpenChange={setIsAddResourceOpen}
                verseId={verseId}
            />
        </Sheet>
    );
}
