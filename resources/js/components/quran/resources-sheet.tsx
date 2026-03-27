import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { useResourcesSheet } from '@/hooks/features';
import { router } from '@inertiajs/react';
import {
    BookOpen,
    FileText,
    Globe,
    Headphones,
    Scale,
    Tags,
    Video,
} from 'lucide-react';
import { useState } from 'react';
import { LoginModal } from '../auth/login-modal';
import { AddResourceModal } from './add-resource-modal';
import { FullResourceDialog } from './full-resource-dialog';
import { QuranResourceCard } from './quran-resource-card';
import { ReportErrorModal } from './report-error-modal';

interface ResourcesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    verseId: number;
    verseNumber: number;
    chapterNumber?: number;
    initialActiveSection?: string;
}

// Icon mapping for resource highlights
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

export function ResourcesSheet({
    open,
    onOpenChange,
    verseId,
    verseNumber,
    chapterNumber,
    initialActiveSection,
}: ResourcesSheetProps) {
    const { user } = useAuth();
    const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const {
        resources,
        similarVerses,
        topics,
        resourceCounts,
        groupedResources,
        loading,
        hasMore,
        totalResources,
        activeSection,
        selectedResource,
        loadingFullResourceId,
        setActiveSection,
        handleVerseClick,
        handleSeeMore,
        getDomainName,
        isVerifiedSource,
        formatMatchRange,
    } = useResourcesSheet({
        open,
        verseId,
        verseNumber,
        chapterNumber,
        initialActiveSection,
        onOpenChange,
    });

    const handleReportErrorClick = () => {
        if (user) {
            setIsReportModalOpen(true);
        } else {
            setIsLoginModalOpen(true);
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
                                                                <QuranResourceCard
                                                                    key={
                                                                        resource.id
                                                                    }
                                                                    resource={
                                                                        resource
                                                                    }
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
                                                                    isVerifiedSource={
                                                                        isVerifiedSource
                                                                    }
                                                                    verifiedBadgeMode="metadata"
                                                                />
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

            <FullResourceDialog
                open={!!selectedResource}
                resource={selectedResource}
                onOpenChange={(open) => !open && void handleSeeMore(-1)}
                onClose={() => void handleSeeMore(-1)}
                mobileFullscreen
            />
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
