import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { router } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    CheckCircle,
    ExternalLink,
    FileText,
    Globe,
    Headphones,
    Scale,
    Tags,
    Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { LoginModal } from '../auth/login-modal';
import { AddResourceModal } from './add-resource-modal';
import { ReportErrorModal } from './report-error-modal';

interface ResourceType {
    id: number;
    slug: string;
    name: string;
}

interface Resource {
    id: string | number;
    resource_type_id?: number;
    resource_url: string;
    resource_title: string | null;
    comment: string | null;
    is_truncated?: boolean;
    resource_type: ResourceType;
    user: {
        name: string;
    };
    created_at?: string;
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
    initialActiveSection?: string;
}

export function ResourcesSheet({
    open,
    onOpenChange,
    verseId,
    verseNumber,
    chapterNumber,
    initialActiveSection,
}: ResourcesSheetProps) {
    const [resources, setResources] = useState<Resource[]>([]);
    const [totalResources, setTotalResources] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [loadingFullResourceId, setLoadingFullResourceId] = useState<
        string | number | null
    >(null);
    const [selectedResource, setSelectedResource] = useState<{
        title: string | null;
        url: string | null;
        comment: string;
    } | null>(null);
    const [similarVerses, setSimilarVerses] = useState<SimilarVerse[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string | undefined>(
        undefined,
    );
    const [resourceCounts, setResourceCounts] = useState<
        Record<string, number>
    >({});

    const { user } = useAuth();

    const handleReportErrorClick = () => {
        if (user) {
            setIsReportModalOpen(true);
        } else {
            setIsLoginModalOpen(true);
        }
    };

    const fetchAllRelated = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/verses/${verseId}/resources?limit=5`,
            );
            if (response.ok) {
                const data = await response.json();

                // Set resources (resources are at data)
                setResources(data.data || []);
                setTotalResources(data.meta?.total || 0);
                setHasMore(Boolean(data.meta?.hasMore));

                // Store actual server-side counts of resource types
                if (data.meta?.counts?.resource_types) {
                    setResourceCounts(data.meta.counts.resource_types);
                }

                // Set similar verses (now included in the response)
                setSimilarVerses(data.similar_verses?.data || []);

                // Set topics (now included in the response)
                setTopics(data.topics?.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch related data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchAllRelated();
        }
    }, [open, verseId]);

    // Handle initial active section sync when sheet opens or resources change
    useEffect(() => {
        if (open) {
            if (initialActiveSection) {
                setActiveSection(initialActiveSection);
            } else if (
                Object.keys(groupedResources).length > 0 &&
                !activeSection
            ) {
                setActiveSection(Object.keys(groupedResources)[0]);
            }
        } else {
            // reset when closed if desired, or keep it
            if (!open) {
                // Optional: reset on close
                // setActiveSection(undefined);
            }
        }
    }, [open, initialActiveSection, resources.length]);

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
        return range.map((r) => `words ${r[0]}-${r[1]}`).join(', ');
    };

    const getResourceHighlight = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('fatwa'))
            return {
                color: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-100 dark:bg-amber-900/30',
                icon: Scale,
            };
        if (lowerType.includes('tafsir'))
            return {
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                icon: BookOpen,
            };
        if (lowerType.includes('video'))
            return {
                color: 'text-red-600 dark:text-red-400',
                bg: 'bg-red-100 dark:bg-red-900/30',
                icon: Video,
            };
        if (lowerType.includes('audio') || lowerType.includes('lecture'))
            return {
                color: 'text-blue-600 dark:text-blue-400',
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                icon: Headphones,
            };
        if (lowerType.includes('article'))
            return {
                color: 'text-purple-600 dark:text-purple-400',
                bg: 'bg-purple-100 dark:bg-purple-900/30',
                icon: FileText,
            };
        return { color: 'text-primary', bg: 'bg-primary/10', icon: Globe };
    };

    const getDomainName = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch (e) {
            return 'Source';
        }
    };

    const isVerifiedSource = (url: string) => {
        const domain = getDomainName(url).toLowerCase();
        const verifiedDomains = [
            'islamqa.info',
            'sunnah.com',
            'quran.com',
            'tafsir.net',
            'kingfahdcomplex.gov.sa',
        ];
        return verifiedDomains.includes(domain);
    };

    const handleSeeMore = async (resourceId: string | number) => {
        setLoadingFullResourceId(resourceId);
        try {
            const response = await fetch(`/api/resources/${resourceId}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedResource({
                    title: data.data.title || 'Full Description',
                    url: data.data.url || null,
                    comment: data.data.comment,
                });
            }
        } catch (error) {
            console.error('Failed to fetch full resource:', error);
        } finally {
            setLoadingFullResourceId(null);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex h-full w-full flex-col overflow-hidden p-0 sm:w-[500px] sm:max-w-lg">
                <SheetHeader className="px-4 pt-6 pb-2">
                    <SheetTitle>
                        Related Resources for ({chapterNumber} : {verseNumber})
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {chapterNumber && hasMore && (
                        <div className="pb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.visit(
                                        `/related/${chapterNumber}/${verseNumber}`,
                                    )
                                }
                            >
                                View all ({totalResources})
                            </Button>
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
                            <p className="text-muted-foreground">
                                No resources available yet
                            </p>
                            <div className="flex w-full justify-between gap-3 px-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddResourceOpen(true)}
                                >
                                    Add a resource
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReportErrorClick}
                                >
                                    Report Error
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Accordion
                            type="single"
                            collapsible
                            value={
                                activeSection ||
                                Object.keys(groupedResources)[0] ||
                                ''
                            }
                            onValueChange={setActiveSection}
                            className="w-full"
                        >
                            {Object.entries(groupedResources).map(
                                ([type, typeResources]) => {
                                    const highlight =
                                        getResourceHighlight(type);
                                    const Icon = highlight.icon;

                                    return (
                                        <AccordionItem
                                            key={type}
                                            value={type}
                                            className="border-b-0"
                                        >
                                            <AccordionTrigger className="rounded-md px-2 transition-colors hover:no-underline [&[data-state=open]]:bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`rounded-full p-2 ${highlight.bg}`}
                                                    >
                                                        <Icon
                                                            className={`h-4 w-4 ${highlight.color}`}
                                                        />
                                                    </div>
                                                    <span className="font-semibold">
                                                        {type}
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="ml-2 font-normal"
                                                    >
                                                        {resourceCounts[type] ||
                                                            typeResources.length}
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-4">
                                                <div className="space-y-4 pr-2">
                                                    {type ===
                                                    'Similar Verses' ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {typeResources.map(
                                                                (resource) => {
                                                                    let matchedKeys: string[] =
                                                                        [];
                                                                    try {
                                                                        if (
                                                                            resource.comment
                                                                        ) {
                                                                            matchedKeys =
                                                                                JSON.parse(
                                                                                    resource.comment,
                                                                                );
                                                                        }
                                                                    } catch (e) {
                                                                        console.error(
                                                                            'Failed to parse similar verses JSON',
                                                                            e,
                                                                        );
                                                                    }

                                                                    return matchedKeys.map(
                                                                        (
                                                                            key,
                                                                            idx,
                                                                        ) => {
                                                                            const parts =
                                                                                key.split(
                                                                                    ':',
                                                                                );
                                                                            if (
                                                                                parts.length ===
                                                                                2
                                                                            ) {
                                                                                return (
                                                                                    <Badge
                                                                                        key={`${resource.id}-${idx}`}
                                                                                        variant="secondary"
                                                                                        className="cursor-pointer border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary transition-colors hover:bg-primary/20"
                                                                                        onClick={() =>
                                                                                            handleVerseClick(
                                                                                                Number(
                                                                                                    parts[0],
                                                                                                ),
                                                                                                Number(
                                                                                                    parts[1],
                                                                                                ),
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                                                                        {
                                                                                            key
                                                                                        }
                                                                                    </Badge>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        },
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    ) : (
                                                        typeResources.map(
                                                            (resource) => (
                                                                <div
                                                                    key={
                                                                        resource.id
                                                                    }
                                                                    className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                                                                >
                                                                    <div className="flex items-start justify-between gap-4">
                                                                        <div className="flex-1 space-y-1">
                                                                            <a
                                                                                href={
                                                                                    resource.resource_url
                                                                                }
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center gap-2 text-base font-semibold text-foreground decoration-primary/30 underline-offset-4 transition-colors group-hover:text-primary hover:underline"
                                                                            >
                                                                                <span className="line-clamp-2">
                                                                                    {resource.resource_title ||
                                                                                        resource.resource_url}
                                                                                </span>
                                                                                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-50 transition-opacity group-hover:opacity-100" />
                                                                            </a>
                                                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                                                <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase">
                                                                                    <Globe className="h-3 w-3" />
                                                                                    {getDomainName(
                                                                                        resource.resource_url,
                                                                                    )}
                                                                                </span>
                                                                                {isVerifiedSource(
                                                                                    resource.resource_url,
                                                                                ) && (
                                                                                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/30">
                                                                                        <CheckCircle className="h-3 w-3" />
                                                                                        Verified
                                                                                    </span>
                                                                                )}
                                                                                {resource.created_at && (
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Calendar className="h-3 w-3" />
                                                                                        {new Date(
                                                                                            resource.created_at,
                                                                                        ).toLocaleDateString(
                                                                                            'en-US',
                                                                                            {
                                                                                                timeZone:
                                                                                                    'UTC',
                                                                                                month: 'short',
                                                                                                year: 'numeric',
                                                                                            },
                                                                                        )}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {resource.comment && (
                                                                        <div className="relative">
                                                                            <div
                                                                                className={`text-sm leading-relaxed text-muted-foreground/90 ${!selectedResource ? 'line-clamp-3' : ''}`}
                                                                                dangerouslySetInnerHTML={{
                                                                                    __html: resource.comment,
                                                                                }}
                                                                            />
                                                                            {resource.is_truncated && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="mt-2 h-7 bg-muted/30 px-2 text-xs font-medium text-primary hover:bg-muted"
                                                                                    disabled={
                                                                                        loadingFullResourceId ===
                                                                                        resource.id
                                                                                    }
                                                                                    onClick={() =>
                                                                                        handleSeeMore(
                                                                                            resource.id,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    {loadingFullResourceId ===
                                                                                    resource.id
                                                                                        ? 'Loading...'
                                                                                        : 'Read Full Answer'}
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ),
                                                        )
                                                    )}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                },
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
                                                    className="cursor-pointer border-amber-500/50 bg-amber-400/20"
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
                                                        <span className="font-arabic ml-1 text-xs">
                                                            ({topic.arabic_name}
                                                            )
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
                                        <div className="space-y-4 pr-2">
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
                                                            {
                                                                similar.chapter_name
                                                            }{' '}
                                                            (
                                                            {
                                                                similar.chapter_number
                                                            }
                                                            :
                                                            {
                                                                similar.verse_number
                                                            }
                                                            )
                                                        </span>
                                                        <div className="flex gap-2 text-xs text-muted-foreground">
                                                            <span>
                                                                Score:{' '}
                                                                {similar.score}
                                                            </span>
                                                            <span>
                                                                Coverage:{' '}
                                                                {
                                                                    similar.coverage
                                                                }
                                                                %
                                                            </span>
                                                            <span>
                                                                Words:{' '}
                                                                {
                                                                    similar.matched_words_count
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="font-arabic rtl:font-arabic mb-2 text-right text-sm text-foreground ltr:font-sans">
                                                        {similar.text_uthmani}
                                                    </p>
                                                    {similar.translation && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {
                                                                similar.translation
                                                            }
                                                        </p>
                                                    )}
                                                    {similar.match_words_range &&
                                                        similar
                                                            .match_words_range
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
                            <div className="mt-4 flex w-full justify-between px-2 pb-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddResourceOpen(true)}
                                >
                                    Add a resource
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReportErrorClick}
                                >
                                    Report Error
                                </Button>
                            </div>
                        </Accordion>
                    )}
                </div>
            </SheetContent>

            <Dialog
                open={!!selectedResource}
                onOpenChange={(open) => !open && setSelectedResource(null)}
            >
                <DialogContent className="h-screen w-screen max-w-none p-4 sm:h-auto sm:w-auto sm:max-w-[80rem] sm:p-6">
                    <DialogHeader className="pr-8">
                        <DialogTitle className="text-base sm:text-[1.05rem]">
                            {selectedResource?.title || 'Full Description'}
                        </DialogTitle>
                        {selectedResource?.url && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-7 w-fit gap-1.5 px-2.5 text-[11px] font-medium"
                                asChild
                            >
                                <a
                                    href={selectedResource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Source
                                </a>
                            </Button>
                        )}
                    </DialogHeader>
                    <div className="no-scrollbar -mx-4 max-h-[calc(100vh-12rem)] overflow-y-auto px-4 sm:max-h-[50vh]">
                        <div
                            className="text-sm whitespace-pre-wrap text-foreground"
                            dangerouslySetInnerHTML={{
                                __html: selectedResource?.comment || '',
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedResource(null)}
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
            <LoginModal
                open={isLoginModalOpen}
                onOpenChange={setIsLoginModalOpen}
            />
            {chapterNumber && (
                <ReportErrorModal
                    open={isReportModalOpen}
                    onOpenChange={setIsReportModalOpen}
                    verseId={verseId}
                    chapterId={chapterNumber}
                    verseNumber={verseNumber}
                />
            )}
        </Sheet>
    );
}
