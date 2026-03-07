import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    Bookmark,
    BookmarkCheck,
    BookmarkPlus,
    BookOpen,
    Eye,
    Play,
    Plus,
    Volume2,
    MoreVertical,
    Quote,
    Languages,
    Link,
    Share2,
} from 'lucide-react';
import { useState } from 'react';
import { useAudioPlayer } from '@/store/use-audio-player';
import { AddResourceModal } from './add-resource-modal';
import { CollectionsModal } from './collections-modal';
import { ResourcesSheet } from './resources-sheet';
import { TafsirModal } from './tafsir-modal';
import { VerseGraphModal } from './verse-graph-modal';
import { Network } from 'lucide-react';

interface Verse {
    id: number;
    chapterId: number;
    chapterNumber?: number;
    verseNumber: number;
    text: string;
    translation?: string;
    audioUrl?: string;
    juzNumber: number;
    pageNumber: number;
}

interface VerseCardProps {
    verse: Verse;
    totalVerses?: number;
    isBookmarked?: boolean;
    hasResources?: boolean;
    onBookmarkToggle?: (verseId: number) => void;
    onCopy?: (verseId: number, text: string) => void;
    onPlayAudio?: (audioUrl: string) => void;
    showTranslation?: boolean;
    className?: string;
    reciterId?: number;
    hideHeaderActions?: boolean;
}

export function VerseCard({
    verse,
    totalVerses,
    isBookmarked = false,
    hasResources = false,
    onBookmarkToggle,
    onCopy,
    onPlayAudio,
    showTranslation = true,
    className,
    reciterId = 1, // Default reciter ID
    hideHeaderActions = false,
}: VerseCardProps) {
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [isResourcesSheetOpen, setIsResourcesSheetOpen] = useState(false);
    const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
    const [activeResourceSection, setActiveResourceSection] = useState<
        string | undefined
    >(undefined);
    const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);
    const [isTafsirModalOpen, setIsTafsirModalOpen] = useState(false);
    const { playVerse, currentVerse, audioData, isPlaying } = useAudioPlayer();

    const handleBookmark = () => {
        onBookmarkToggle?.(verse.id);
    };

    const handlePlayAudio = () => {
        playVerse(verse.chapterId, verse.verseNumber, reciterId);
    };

    const handleAddResource = () => {
        setIsResourceModalOpen(true);
    };

    // Check if this is the currently playing verse
    const isCurrentlyPlaying =
        currentVerse?.chapterId === verse.chapterId &&
        currentVerse?.verseNumber === verse.verseNumber &&
        isPlaying;

    const handleCopyArabic = () => {
        navigator.clipboard.writeText(verse.text);
    };

    const handleCopyTranslation = () => {
        if (verse.translation) {
            navigator.clipboard.writeText(verse.translation);
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/${verse.chapterNumber}/${verse.verseNumber}`;
        navigator.clipboard.writeText(url);
    };

    const handleShare = () => {
        const url = `${window.location.origin}/${verse.chapterNumber}/${verse.verseNumber}`;
        if (navigator.share) {
            navigator
                .share({
                    title: `Quran ${verse.chapterNumber}:${verse.verseNumber}`,
                    text: verse.translation || '',
                    url: url,
                })
                .catch(console.error);
        } else {
            handleCopyLink();
        }
    };

    return (
        <Card
            className={cn(
                'group mb-4 border-0 shadow-none transition-all duration-300',
                isCurrentlyPlaying && 'bg-primary/5 ring-1 ring-primary/20',
                isResourcesSheetOpen &&
                    'bg-orange-50/50 shadow-sm ring-1 ring-orange-500/20 dark:bg-orange-900/10',
                className,
            )}
            id={`verse-${verse.chapterId}-${verse.verseNumber}`}
        >
            <CardContent className="px-4 py-2 md:p-1">
                {/* Verse Header */}
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-[40%] bg-gray-400/20 align-middle text-sm font-semibold">
                            {verse.verseNumber}
                        </div>
                    </div>

                    {!hideHeaderActions && (
                        <div className="flex items-center gap-1 transition-opacity duration-200">
                            {/* Play Button */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handlePlayAudio}
                                        className="h-8 w-8 p-0"
                                    >
                                        {isCurrentlyPlaying ? (
                                            <div className="flex h-4 w-4 items-center items-end justify-center gap-0.5">
                                                <span className="h-2 w-0.5 animate-pulse bg-current" />
                                                <span className="h-3 w-0.5 animate-pulse bg-current delay-75" />
                                                <span className="h-2 w-0.5 animate-pulse bg-current delay-150" />
                                            </div>
                                        ) : (
                                            <Play className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isCurrentlyPlaying
                                        ? 'Playing'
                                        : 'Play audio'}
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setActiveResourceSection(undefined);
                                            setIsResourcesSheetOpen(true);
                                        }}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Eye
                                            className={cn(
                                                'h-4 w-4',
                                                hasResources &&
                                                    'text-orange-500',
                                            )}
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Resources</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setIsGraphModalOpen(true)
                                        }
                                        className="h-8 w-8 p-0"
                                    >
                                        <Network
                                            className={cn(
                                                'h-4 w-4',
                                                hasResources && 'text-sky-500',
                                            )}
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Resource Network
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setIsTafsirModalOpen(true)
                                        }
                                        className="h-8 w-8 p-0"
                                    >
                                        <BookOpen className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Tafsir</TooltipContent>
                            </Tooltip>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                >
                                    <DropdownMenuItem
                                        onClick={handleCopyArabic}
                                        className="gap-2 text-xs"
                                    >
                                        <Quote className="h-3.5 w-3.5" />
                                        Copy Arabic
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleCopyTranslation}
                                        className="gap-2 text-xs"
                                    >
                                        <Languages className="h-3.5 w-3.5" />
                                        Copy Translation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleCopyLink}
                                        className="gap-2 text-xs"
                                    >
                                        <Link className="h-3.5 w-3.5" />
                                        Copy Link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleShare}
                                        className="gap-2 text-xs"
                                    >
                                        <Share2 className="h-3.5 w-3.5" />
                                        Share Verse
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleBookmark}
                                        className="gap-2 text-xs"
                                    >
                                        {isBookmarked ? (
                                            <>
                                                <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                                                <span>Remove bookmark</span>
                                            </>
                                        ) : (
                                            <>
                                                <Bookmark className="h-3.5 w-3.5" />
                                                <span>Bookmark verse</span>
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setIsCollectionsModalOpen(true)
                                        }
                                        className="gap-2 text-xs"
                                    >
                                        <BookmarkPlus className="h-3.5 w-3.5" />
                                        <span>Add to collection</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleAddResource}
                                        className="gap-2 text-xs"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>Add resource</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {/* Arabic Text */}
                <div className="mb-4 text-right">
                    <p className="font-arabic text-3xl leading-[2.2]" dir="rtl">
                        {verse.text}
                    </p>
                </div>

                {/* Translation */}
                {showTranslation && verse.translation && (
                    <div className="border-t border-muted/30 pt-4">
                        <p className="text-[15px] leading-relaxed text-muted-foreground/80">
                            {verse.translation}
                        </p>
                    </div>
                )}
            </CardContent>

            {/* Add Resource Modal */}
            <AddResourceModal
                open={isResourceModalOpen}
                onOpenChange={setIsResourceModalOpen}
                verseId={verse.id}
            />

            {/* Collections Modal */}
            <CollectionsModal
                open={isCollectionsModalOpen}
                onOpenChange={setIsCollectionsModalOpen}
                verseId={verse.id}
                chapterId={verse.chapterId}
                verseNumber={verse.verseNumber}
                totalVerses={totalVerses}
            />

            {/* Resources Sheet */}
            <ResourcesSheet
                open={isResourcesSheetOpen}
                onOpenChange={setIsResourcesSheetOpen}
                verseId={verse.id}
                verseNumber={verse.verseNumber}
                chapterNumber={verse.chapterNumber}
                initialActiveSection={activeResourceSection}
            />

            {/* Quick Graph Modal */}
            <VerseGraphModal
                open={isGraphModalOpen}
                onOpenChange={setIsGraphModalOpen}
                verseId={verse.id}
                verseKey={`${verse.chapterNumber}:${verse.verseNumber}`}
                onSectionSelect={(section) => {
                    setActiveResourceSection(section);
                    setIsResourcesSheetOpen(true);
                }}
            />

            {/* Tafsir Modal */}
            <TafsirModal
                open={isTafsirModalOpen}
                onOpenChange={setIsTafsirModalOpen}
                chapterId={verse.chapterId}
                verseNumber={verse.verseNumber}
                chapterNumber={verse.chapterNumber}
                totalVerses={totalVerses}
            />
        </Card>
    );
}
