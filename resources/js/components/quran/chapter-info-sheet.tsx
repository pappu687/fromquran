import { FullResourceDialog } from '@/components/quran/full-resource-dialog';
import { QuranResourceCard } from '@/components/quran/quran-resource-card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChapterInfoQuery, useChapterResourcesQuery } from '@/hooks/api';
import { type ChapterResourceData } from '@/hooks/api/use-quran-chapter-data';
import { router } from '@inertiajs/react';
import { Info, Link as LinkIcon, Plus } from 'lucide-react';
import { useState } from 'react';
import { AddResourceModal } from './add-resource-modal';

interface ChapterInfoSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chapterNumber: number;
    chapterName?: string;
}

export function ChapterInfoSheet({
    open,
    onOpenChange,
    chapterNumber,
    chapterName,
}: ChapterInfoSheetProps) {
    const [activeTab, setActiveTab] = useState('intro');
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [loadingFullResourceId, setLoadingFullResourceId] = useState<
        string | number | null
    >(null);
    const [selectedResource, setSelectedResource] = useState<{
        title: string | null;
        url: string | null;
        comment: string;
    } | null>(null);
    const { chapterInfo: info, isLoading: loadingInfo } = useChapterInfoQuery(
        chapterNumber,
        open,
    );
    const { resources, isLoading: loadingResources } = useChapterResourcesQuery(
        chapterNumber,
        open,
    );

    const handleSeeMore = async (resourceId: string | number) => {
        if (resourceId === -1 || resourceId === '-1') {
            setSelectedResource(null);
            setLoadingFullResourceId(null);
            return;
        }

        setLoadingFullResourceId(resourceId);
        try {
            const response = await fetch(`/api/resources/${resourceId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch full resource');
            }

            const data = await response.json();
            setSelectedResource({
                title: data.data?.title || 'Full Description',
                url: data.data?.url || null,
                comment: data.data?.comment || '',
            });
        } catch (error) {
            console.error('Failed to fetch full resource:', error);
        } finally {
            setLoadingFullResourceId(null);
        }
    };

    const getDomainName = (url: string) => {
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        } catch {
            return url;
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
        {} as Record<string, ChapterResourceData[]>,
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
                                                                (resource) => (
                                                                    <QuranResourceCard
                                                                        key={
                                                                            resource.id
                                                                        }
                                                                        resource={{
                                                                            ...resource,
                                                                            resource_title:
                                                                                resource.resource_title ??
                                                                                null,
                                                                        }}
                                                                        loadingFullResourceId={
                                                                            loadingFullResourceId
                                                                        }
                                                                        selectedResourceOpen={
                                                                            !!selectedResource
                                                                        }
                                                                        getDomainName={
                                                                            getDomainName
                                                                        }
                                                                        onSeeMore={
                                                                            handleSeeMore
                                                                        }
                                                                    />
                                                                ),
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

                <FullResourceDialog
                    open={!!selectedResource}
                    resource={selectedResource}
                    onOpenChange={(open) => !open && void handleSeeMore(-1)}
                    onClose={() => void handleSeeMore(-1)}
                />
            </SheetContent>
        </Sheet>
    );
}
