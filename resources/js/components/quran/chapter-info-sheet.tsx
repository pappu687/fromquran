import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
                <div className="flex flex-col h-full">
                    <SheetHeader className="p-6 pb-2">
                        <SheetTitle className="text-2xl">
                            {chapterName || (info ? info.surah_name : `Surah ${chapterNumber}`)}
                        </SheetTitle>                    
                    </SheetHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                        <div className="px-6 border-b">
                            <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                                <TabsTrigger 
                                    value="intro" 
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 transition-none"
                                >
                                    <Info className="h-4 w-4 mr-2" />
                                    Intro
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="resources"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 transition-none"
                                >
                                    <LinkIcon className="h-4 w-4 mr-2" />
                                    Resources ({resources.length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <TabsContent value="intro" className="mt-0 outline-none">
                                {loadingInfo ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-[90%]" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-[95%]" />
                                    </div>
                                ) : info ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none surah-info">                                
                                        {info.text ? (
                                            <div 
                                                className="chapter-info-content text-sm leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: info.text }} 
                                            />
                                        ) : (
                                            <p className="text-muted-foreground italic">No detailed information available for this Surah.</p>
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

                            <TabsContent value="resources" className="mt-0 outline-none">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        Resources for this Surah
                                    </h3>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="gap-1"
                                        onClick={() => setIsResourceModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add a resource
                                    </Button>
                                </div>
                                {loadingResources ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                ) : resources.length === 0 ? (
                                    <div className="flex h-40 flex-col items-center justify-center text-center">
                                        <LinkIcon className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                                        <p className="text-muted-foreground">
                                            No resources available for this Surah yet.
                                        </p>
                                    </div>
                                ) : (
                                    <Accordion type="single" collapsible className="w-full">
                                        {Object.entries(groupedResources).map(
                                            ([type, typeResources]) => (
                                                <AccordionItem key={type} value={type} className="border-b-0 mb-2">
                                                    <AccordionTrigger className="hover:no-underline py-3 px-4 rounded-lg bg-muted/50">
                                                        <span className="font-medium text-sm">
                                                            {type} ({typeResources.length})
                                                        </span>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pt-4 px-1">
                                                        <div className="space-y-4">
                                                            {typeResources.map((resource) => (
                                                                <div
                                                                    key={resource.id}
                                                                    className="rounded-lg border p-4 bg-card"
                                                                >
                                                                    <a
                                                                        href={resource.resource_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="group mb-2 flex items-start gap-2 text-sm font-medium text-primary hover:underline"
                                                                    >
                                                                        <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                                                        <span className="break-all italic">
                                                                            {resource.resource_url}
                                                                        </span>
                                                                    </a>
                                                                    {resource.comment && (
                                                                        <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                                                                            {resource.comment}
                                                                        </p>
                                                                    )}
                                                                    <div className="mt-3 flex items-center text-xs text-muted-foreground">
                                                                        <span className="bg-muted px-2 py-0.5 rounded">
                                                                            Submitted by {resource.user.name}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
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
