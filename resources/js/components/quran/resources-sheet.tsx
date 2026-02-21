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
import { 
    ExternalLink, 
    Tags, 
    BookOpen, 
    Scale, 
    Headphones, 
    FileText, 
    Video, 
    Globe, 
    MessageSquare, 
    Calendar, 
    User,
    Info,
    Eye,
    ThumbsUp,
    CheckCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { AddResourceModal } from './add-resource-modal';
import { LoginModal } from '../auth/login-modal';
import { ReportErrorModal } from './report-error-modal';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface ResourceType {
    id: number;
    slug: string;
    name: string;
}

interface Resource {
    id: number;
    resource_type_id: number;
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
}

export function ResourcesSheet({
    open,
    onOpenChange,
    verseId,
    verseNumber,
    chapterNumber,
}: ResourcesSheetProps) {
    const [resources, setResources] = useState<Resource[]>([]);
    const [totalResources, setTotalResources] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [loadingFull, setLoadingFull] = useState(false);
    const [selectedComment, setSelectedComment] = useState<string | null>(null);
    const [similarVerses, setSimilarVerses] = useState<SimilarVerse[]>([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const { auth } = usePage<SharedData>().props;

    const handleReportErrorClick = () => {
        if (auth.user) {
            setIsReportModalOpen(true);
        } else {
            setIsLoginModalOpen(true);
        }
    };

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
                setTotalResources(data.meta?.total || data.data?.length || 0);
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

    const getResourceHighlight = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('fatwa')) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: Scale };
        if (lowerType.includes('tafsir')) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: BookOpen };
        if (lowerType.includes('video')) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: Video };
        if (lowerType.includes('audio') || lowerType.includes('lecture')) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Headphones };
        if (lowerType.includes('article')) return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: FileText };
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
        const verifiedDomains = ['islamqa.info', 'sunnah.com', 'quran.com', 'tafsir.net', 'kingfahdcomplex.gov.sa'];
        return verifiedDomains.includes(domain);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>
                        Related Resources for ({chapterNumber} : {verseNumber})
                    </SheetTitle>
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
                            View all ({totalResources})
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
                            defaultValue={Object.keys(groupedResources)[0]}
                            className="w-full"
                        >
                            {Object.entries(groupedResources).map(
                                ([type, typeResources]) => {
                                    const highlight = getResourceHighlight(type);
                                    const Icon = highlight.icon;
                                    
                                    return (
                                        <AccordionItem key={type} value={type} className="border-b-0">
                                            <AccordionTrigger className="hover:no-underline [&[data-state=open]]:bg-muted/50 px-2 rounded-md transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${highlight.bg}`}>
                                                        <Icon className={`h-4 w-4 ${highlight.color}`} />
                                                    </div>
                                                    <span className="font-semibold">{type}</span>
                                                    <Badge variant="secondary" className="ml-2 font-normal">
                                                        {typeResources.length}
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-4">
                                                <div
                                                    className="space-y-4 overflow-y-auto pr-2"
                                                    style={{ maxHeight: '600px' }}
                                                >
                                                    {typeResources.map(
                                                        (resource) => (
                                                            <div
                                                                key={resource.id}
                                                                className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/50"
                                                            >
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex-1 space-y-1">
                                                                        <a
                                                                            href={resource.resource_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-2 text-base font-semibold text-foreground decoration-primary/30 underline-offset-4 hover:underline group-hover:text-primary transition-colors"
                                                                        >
                                                                            <span className="line-clamp-2">
                                                                                {resource.resource_title || resource.resource_url}
                                                                            </span>
                                                                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                                        </a>
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                                                            <span className="flex items-center gap-1 font-medium bg-muted px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                                                                                <Globe className="h-3 w-3" />
                                                                                {getDomainName(resource.resource_url)}
                                                                            </span>
                                                                            {isVerifiedSource(resource.resource_url) && (
                                                                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
                                                                                    <CheckCircle className="h-3 w-3" />
                                                                                    Verified
                                                                                </span>
                                                                            )}
                                                                            {resource.created_at && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <Calendar className="h-3 w-3" />
                                                                                    {new Date(resource.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {resource.comment && (
                                                                    <div className="relative">
                                                                        <div
                                                                            className={`text-sm text-muted-foreground/90 leading-relaxed ${!selectedComment ? 'line-clamp-3' : ''}`}
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: resource.comment,
                                                                            }}
                                                                        />
                                                                        {resource.is_truncated && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="mt-2 h-7 bg-muted/30 px-2 text-xs font-medium text-primary hover:bg-muted"
                                                                                disabled={loadingFull}
                                                                                onClick={() => handleSeeMore(resource.id)}
                                                                            >
                                                                                {loadingFull ? 'Loading...' : 'Read Full Answer'}
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}


                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                }
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
                open={!!selectedComment}
                onOpenChange={(open) => !open && setSelectedComment(null)}
            >
                <DialogContent className="h-screen w-screen max-w-none sm:h-auto sm:w-auto sm:max-w-[80rem] p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Full Description</DialogTitle>
                    </DialogHeader>
                    <div className="no-scrollbar -mx-4 max-h-[calc(100vh-12rem)] sm:max-h-[50vh] overflow-y-auto px-4">
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
