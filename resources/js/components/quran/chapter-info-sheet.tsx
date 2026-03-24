import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { router } from '@inertiajs/react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { ExternalLink, Info, Link as LinkIcon, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AddResourceModal } from './add-resource-modal';

interface ChapterInfo {
    surah_number: number;
    surah_name: string;
    text: string;
    short_text: string;
}

interface ResourceType {
    id: number;
    slug: string;
    name: string;
}

interface ChapterResource {
    id: number;
    resource_type_id: number;
    resource_url: string;
    resource_title?: string;
    comment: string | null;
    resource_type: ResourceType;
    user: {
        name: string;
    };
}

interface ChapterInfoSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chapterNumber: number;
    chapterName?: string;
}

const getYoutubeVideoId = (url: string) => {
    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.replace(/^www\./, '');

        if (hostname === 'youtu.be') {
            return parsedUrl.pathname.split('/').filter(Boolean)[0] || null;
        }

        if (
            hostname === 'youtube.com' ||
            hostname === 'm.youtube.com' ||
            hostname === 'youtube-nocookie.com' ||
            hostname.endsWith('.youtube.com') ||
            hostname.endsWith('.youtube-nocookie.com')
        ) {
            if (parsedUrl.pathname === '/watch') {
                return (
                    parsedUrl.searchParams.get('v') ||
                    parsedUrl.searchParams.get('vi')
                );
            }

            const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
            const [firstSegment, secondSegment] = pathParts;

            if (
                (firstSegment === 'embed' || firstSegment === 'shorts') &&
                secondSegment
            ) {
                return secondSegment;
            }

            return pathParts.at(-1) || null;
        }
    } catch {
        return null;
    }

    return null;
};

export function ChapterInfoSheet({
    open,
    onOpenChange,
    chapterNumber,
    chapterName,
}: ChapterInfoSheetProps) {
    const [info, setInfo] = useState<ChapterInfo | null>(null);
    const [resources, setResources] = useState<ChapterResource[]>([]);
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [loadingResources, setLoadingResources] = useState(false);
    const [activeTab, setActiveTab] = useState('intro');
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

    useEffect(() => {
        if (open && chapterNumber) {
            fetchChapterInfo();
            fetchChapterResources();
        }
    }, [open, chapterNumber]);

    const fetchChapterInfo = async () => {
        setLoadingInfo(true);
        try {
            const response = await fetch(`/api/quran/chapters/${chapterNumber}/info`);
            if (response.ok) {
                const data = await response.json();
                setInfo(data);
            }
        } catch (error) {
            console.error('Failed to fetch chapter info:', error);
        } finally {
            setLoadingInfo(false);
        }
    };

    const fetchChapterResources = async () => {
        setLoadingResources(true);
        try {
            const response = await fetch(`/api/quran/chapters/${chapterNumber}/resources`);
            if (response.ok) {
                const data = await response.json();
                setResources(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch chapter resources:', error);
        } finally {
            setLoadingResources(false);
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
        {} as Record<string, ChapterResource[]>,
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl">
                <div className="flex h-full flex-col">
                    <SheetHeader className="p-6 pb-2">
                        <SheetTitle className="text-2xl">
                            {chapterName ||
                                (info
                                    ? info.surah_name
                                    : `Surah ${chapterNumber}`)}
                        </SheetTitle>
                    </SheetHeader>

                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="flex flex-1 flex-col"
                    >
                        <div className="border-b px-6">
                            <TabsList className="h-auto w-full justify-start gap-6 bg-transparent p-0">
                                <TabsTrigger
                                    value="intro"
                                    className="rounded-none border-b-2 border-transparent px-0 py-2 transition-none data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                >
                                    <Info className="mr-2 h-4 w-4" />
                                    Intro
                                </TabsTrigger>
                                <TabsTrigger
                                    value="resources"
                                    className="rounded-none border-b-2 border-transparent px-0 py-2 transition-none data-[state=active]:border-primary data-[state=active]:bg-transparent"
                                >
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    Resources ({resources.length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <TabsContent
                                value="intro"
                                className="mt-0 outline-none"
                            >
                                {loadingInfo ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-[90%]" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-[95%]" />
                                    </div>
                                ) : info ? (
                                    <div className="prose prose-sm dark:prose-invert surah-info max-w-none">
                                        {info.text ? (
                                            <div
                                                className="chapter-info-content text-sm leading-relaxed"
                                                dangerouslySetInnerHTML={{
                                                    __html: info.text,
                                                }}
                                            />
                                        ) : (
                                            <p className="text-muted-foreground italic">
                                                No detailed information
                                                available for this Surah.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex h-40 items-center justify-center text-center">
                                        <p className="text-muted-foreground">
                                            Failed to load chapter information.
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent
                                value="resources"
                                className="mt-0 outline-none"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                                        Resources for this Surah
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                router.visit(
                                                    `/related/${chapterNumber}`,
                                                )
                                            }
                                        >
                                            All resources
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1"
                                            onClick={() =>
                                                setIsResourceModalOpen(true)
                                            }
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add a resource
                                        </Button>
                                    </div>
                                </div>
                                {loadingResources ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                ) : resources.length === 0 ? (
                                    <div className="flex h-40 flex-col items-center justify-center text-center">
                                        <LinkIcon className="mb-2 h-8 w-8 text-muted-foreground opacity-20" />
                                        <p className="text-muted-foreground">
                                            No resources available for this
                                            Surah yet.
                                        </p>
                                    </div>
                                ) : (
                                    <Accordion
                                        type="single"
                                        collapsible
                                        className="w-full"
                                        defaultValue={
                                            Object.keys(groupedResources)[0]
                                        }
                                    >
                                        {Object.entries(groupedResources).map(
                                            ([type, typeResources]) => (
                                                <AccordionItem
                                                    key={type}
                                                    value={type}
                                                    className="mb-2 border-b-0"
                                                >
                                                    <AccordionTrigger className="rounded-lg bg-muted/50 px-4 py-3 hover:no-underline">
                                                        <span className="text-sm font-medium">
                                                            {type} (
                                                            {
                                                                typeResources.length
                                                            }
                                                            )
                                                        </span>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-1 pt-4">
                                                        <div className="space-y-4">
                                                            {typeResources.map(
                                                                (
                                                                    resource,
                                                                ) => {
                                                                    const youtubeVideoId =
                                                                        getYoutubeVideoId(
                                                                            resource.resource_url,
                                                                        );
                                                                    const youtubeThumbnailUrl =
                                                                        youtubeVideoId
                                                                            ? `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`
                                                                            : null;

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                resource.id
                                                                            }
                                                                            className="rounded-lg border bg-card p-4"
                                                                        >
                                                                            {youtubeThumbnailUrl ? (
                                                                                <a
                                                                                    href={
                                                                                        resource.resource_url
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="group mb-2 flex items-start gap-3 rounded-lg transition-colors hover:bg-muted/40"
                                                                                >
                                                                                    <div className="relative aspect-video w-28 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                                                                                        <img
                                                                                            src={
                                                                                                youtubeThumbnailUrl
                                                                                            }
                                                                                            alt={
                                                                                                resource.resource_title ||
                                                                                                'YouTube thumbnail'
                                                                                            }
                                                                                            className="h-full w-full object-cover"
                                                                                            loading="lazy"
                                                                                        />
                                                                                        <div className="absolute right-2 bottom-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                                                                            YouTube
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="min-w-0 pt-0.5">
                                                                                        <div className="flex items-start gap-2 text-sm font-medium text-primary group-hover:underline">
                                                                                            <span className="line-clamp-2">
                                                                                                {resource.resource_title ||
                                                                                                    resource.resource_url}
                                                                                            </span>
                                                                                            <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                                                                        </div>
                                                                                    </div>
                                                                                </a>
                                                                            ) : (
                                                                                <a
                                                                                    href={
                                                                                        resource.resource_url
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="group mb-2 flex items-start gap-2 text-sm font-medium text-primary hover:underline"
                                                                                >
                                                                                    <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                                                                    <span className="break-all italic">
                                                                                        {resource.resource_title ||
                                                                                            resource.resource_url}
                                                                                    </span>
                                                                                </a>
                                                                            )}
                                                                            {resource.comment && (
                                                                                <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                                                                                    {
                                                                                        resource.comment
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ),
                                        )}
                                    </Accordion>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <AddResourceModal
                    open={isResourceModalOpen}
                    onOpenChange={setIsResourceModalOpen}
                    chapterId={chapterNumber}
                />
            </SheetContent>
        </Sheet>
    );
}
