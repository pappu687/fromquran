import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    Eye,
    Plus,
    Volume2,
} from 'lucide-react';
import { useState } from 'react';
import { AddResourceModal } from './add-resource-modal';
import { CollectionsModal } from './collections-modal';
import { ResourcesSheet } from './resources-sheet';

interface Verse {
    id: number;
    chapterId: number;
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
}: VerseCardProps) {
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [isResourcesSheetOpen, setIsResourcesSheetOpen] = useState(false);
    const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);

    const handleBookmark = () => {
        onBookmarkToggle?.(verse.id);
    };

    const handlePlayAudio = () => {
        if (verse.audioUrl) {
            onPlayAudio?.(verse.audioUrl);
        }
    };

    const handleAddResource = () => {
        setIsResourceModalOpen(true);
    };

    return (
        <Card className={cn('mb-4 border-0 shadow-none', className)}>
            <CardContent className="p-1">
                {/* Verse Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-[30%] bg-primary/20 text-sm font-semibold">
                            {verse.verseNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Juz {verse.juzNumber} • Page {verse.pageNumber}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                        {verse.audioUrl && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handlePlayAudio}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Volume2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Play audio</TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setIsResourcesSheetOpen(true)
                                    }
                                    className="h-8 w-8 p-0"
                                >
                                    <Eye
                                        className={cn(
                                            'h-4 w-4',
                                            hasResources && 'text-orange-500',
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
                                    onClick={handleBookmark}
                                    className="h-8 w-8 p-0"
                                >
                                    {isBookmarked ? (
                                        <BookmarkCheck className="h-4 w-4 text-primary" />
                                    ) : (
                                        <Bookmark className="h-4 w-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {isBookmarked
                                    ? 'Bookmark this verse'
                                    : 'Bookmark this verse'}
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setIsCollectionsModalOpen(true)
                                    }
                                    className="h-8 w-8 p-0"
                                >
                                    <BookmarkPlus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add to collection</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAddResource}
                                    className="h-8 w-8 p-0"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Add resource to this verse
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Arabic Text */}
                <div className="mb-4 text-right">
                    <p
                        className="font-arabic text-3xl leading-relaxed"
                        dir="rtl"
                    >
                        {verse.text}
                    </p>
                </div>

                {/* Translation */}
                {showTranslation && verse.translation && (
                    <div className="border-t pt-4">
                        <p className="leading-relaxed text-muted-foreground">
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
            />
        </Card>
    );
}
