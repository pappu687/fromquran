import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useReaderSettings } from '@/contexts/reader-settings-context';
import { useQuranAudioPlayer } from '@/hooks/useQuranAudioPlayer';
import { cn } from '@/lib/utils';
import { type VerseAnnotation, type VerseListItem } from '@/types/quran';
import { router } from '@inertiajs/react';
import {
    Bookmark,
    BookmarkCheck,
    BookmarkPlus,
    BookOpen,
    GitBranch,
    Info,
    Languages,
    Link,
    Loader2,
    MoreVertical,
    Play,
    Plus,
    Quote,
    Share2,
} from 'lucide-react';
import { useState } from 'react';
import { AddResourceModal } from './add-resource-modal';
import { AnnotatedArabicText } from './annotated-arabic-text';
import { CollectionsModal } from './collections-modal';
import { QuranGraphV2Modal } from './quran-graph-v2-modal';
import { ResourcesSheet } from './resources-sheet';
import { TafsirModal } from './tafsir-modal';

interface VerseCardProps {
    verse: VerseListItem;
    verseDisplayLabel?: string;
    verseDisplayHref?: string;
    totalVerses?: number;
    isBookmarked?: boolean;
    hasResources?: boolean;
    resourceCount?: number;
    onBookmarkToggle?: (verseId: number) => void;
    onCopy?: (verseId: number, text: string) => void;
    onPlayAudio?: (audioUrl: string) => void;
    showTranslation?: boolean;
    className?: string;
    reciterId?: number;
    hideHeaderActions?: boolean;
    annotations?: VerseAnnotation[];
    onAnnotationCreated?: (annotation: VerseAnnotation) => void;
    contentClassName?: string;
}

export function VerseCard({
    verse,
    verseDisplayLabel,
    verseDisplayHref,
    totalVerses,
    isBookmarked = false,
    hasResources = false,
    resourceCount = 0,
    onBookmarkToggle,
    onCopy,
    onPlayAudio,
    showTranslation = true,
    className,
    reciterId = 1, // Default reciter ID
    hideHeaderActions = false,
    annotations = [],
    onAnnotationCreated,
    contentClassName,
}: VerseCardProps) {
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [isResourcesSheetOpen, setIsResourcesSheetOpen] = useState(false);
    const [isGraphV2ModalOpen, setIsGraphV2ModalOpen] = useState(false);
    const [activeResourceSection, setActiveResourceSection] = useState<
        string | undefined
    >(undefined);
    const [isCollectionsModalOpen, setIsCollectionsModalOpen] = useState(false);
    const [isTafsirModalOpen, setIsTafsirModalOpen] = useState(false);
    const { settings } = useReaderSettings();
    const { playVerseAudio, playerState } = useQuranAudioPlayer();

    const handleBookmark = () => {
        onBookmarkToggle?.(verse.id);
    };

    const handlePlayAudio = async () => {
        const chapterNumber = verse.chapterNumber ?? verse.chapterId;
        const qfRecitationId = [6, 7].includes(reciterId) ? reciterId : 7;

        await playVerseAudio({
            verseKey: `${chapterNumber}:${verse.verseNumber}`,
            recitationId: qfRecitationId,
            title: `Surah ${chapterNumber} ${chapterNumber}:${verse.verseNumber}`,
        });
    };

    const handleAddResource = () => {
        setIsResourceModalOpen(true);
    };

    // Check if this is the currently playing verse
    const isCurrentlyPlaying =
        playerState.currentChapterId ===
            (verse.chapterNumber ?? verse.chapterId) &&
        playerState.currentVerseNumber === verse.verseNumber &&
        playerState.isPlaying;
    const isAudioLoading =
        playerState.currentChapterId ===
            (verse.chapterNumber ?? verse.chapterId) &&
        playerState.currentVerseNumber === verse.verseNumber &&
        playerState.isLoading;

    const handleCopyArabic = () => {
        navigator.clipboard.writeText(verse.text);
    };

    const handleCopyTranslation = () => {
        const firstTranslation = verse.translations?.[0]?.text;

        if (firstTranslation) {
            navigator.clipboard.writeText(firstTranslation);
        }
    };

    const buildVerseUrl = () => {
        if (typeof window === 'undefined') return '';
        return `${window.location.origin}/${verse.chapterNumber}/${verse.verseNumber}`;
    };

    const handleCopyLink = () => {
        const url = buildVerseUrl();
        if (!url) return;
        navigator.clipboard.writeText(url);
    };

    const verseLabel = verse.chapterNumber
        ? `Quran ${verse.chapterNumber}:${verse.verseNumber}`
        : `Verse ${verse.verseNumber}`;
    const resourcesTooltip =
        resourceCount > 0
            ? `View (${resourceCount}) Resources`
            : 'View Resources';

    const openShareWindow = (href: string) => {
        window.open(href, '_blank', 'noopener,noreferrer');
    };

    const buildShareUrl = () => {
        const url = buildVerseUrl();
        if (!url) return null;
        return encodeURIComponent(url);
    };

    const handleShareToFacebook = () => {
        const encodedUrl = buildShareUrl();
        if (!encodedUrl) return;
        openShareWindow(
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        );
    };

    const handleShareToTwitter = () => {
        const encodedUrl = buildShareUrl();
        if (!encodedUrl) return;
        const encodedText = encodeURIComponent(verseLabel);
        openShareWindow(
            `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
        );
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
            data-verse-id={`verse-${verse.chapterId}-${verse.verseNumber}`}
        >
            <CardContent className={cn('px-4 py-2 md:p-1', contentClassName)}>
                {/* Verse Header */}
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {verseDisplayHref ? (
                            <button
                                type="button"
                                onClick={() => router.visit(verseDisplayHref)}
                                className={cn(
                                    'mr-2 flex items-center justify-center bg-gray-400/20 align-middle text-sm font-semibold transition-colors hover:bg-gray-400/30',
                                    verseDisplayLabel
                                        ? 'h-8 min-w-14 rounded-full px-3 font-mono text-xs'
                                        : 'h-8 w-8 rounded-[40%]',
                                )}
                            >
                                {verseDisplayLabel ?? verse.verseNumber}
                            </button>
                        ) : (
                            <div
                                className={cn(
                                    'mr-2 flex items-center justify-center bg-gray-400/20 align-middle text-sm font-semibold',
                                    verseDisplayLabel
                                        ? 'h-8 min-w-14 rounded-full px-3 font-mono text-xs'
                                        : 'h-8 w-8 rounded-[40%]',
                                )}
                            >
                                {verseDisplayLabel ?? verse.verseNumber}
                            </div>
                        )}
                    </div>

                    {!hideHeaderActions && (
                        <div className="flex items-center gap-1 transition-opacity duration-200">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handlePlayAudio}
                                        disabled={isAudioLoading}
                                        className="h-8 w-8 p-0"
                                    >
                                        {isAudioLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : isCurrentlyPlaying ? (
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
                                        <Info
                                            className={cn(
                                                'h-4 w-4',
                                                hasResources &&
                                                    'text-orange-500',
                                            )}
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {resourcesTooltip}
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setIsGraphV2ModalOpen(true)
                                        }
                                        className="h-8 w-8 p-0"
                                    >
                                        <GitBranch
                                            className={cn(
                                                'h-4 w-4',
                                                hasResources &&
                                                    'text-emerald-500',
                                            )}
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Explore Connections
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
                                        className="gap-2 text-sm"
                                    >
                                        <Quote className="h-3.5 w-3.5" />
                                        Copy Arabic
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleCopyTranslation}
                                        className="gap-2 text-sm"
                                    >
                                        <Languages className="h-3.5 w-3.5" />
                                        Copy Translation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleCopyLink}
                                        className="gap-2 text-sm"
                                    >
                                        <Link className="h-3.5 w-3.5" />
                                        Copy Link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleShareToFacebook}
                                        className="gap-2 text-sm"
                                    >
                                        <Share2 className="h-3.5 w-3.5" />
                                        Share on Facebook
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleShareToTwitter}
                                        className="gap-2 text-sm"
                                    >
                                        <Share2 className="h-3.5 w-3.5" />
                                        Share on Twitter
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleBookmark}
                                        className="gap-2 text-sm"
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
                                        className="gap-2 text-sm"
                                    >
                                        <BookmarkPlus className="h-3.5 w-3.5" />
                                        <span>Add to collection</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleAddResource}
                                        className="gap-2 text-sm"
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
                    <AnnotatedArabicText
                        as="div"
                        annotations={annotations}
                        className="font-arabic leading-[2.2] text-slate-900 dark:text-slate-100"
                        dir="rtl"
                        interactive
                        onAnnotationCreated={onAnnotationCreated}
                        style={{ fontSize: `${settings.fontSize}rem` }}
                        text={verse.text}
                        verseId={verse.id}
                    />
                </div>

                {/* Translations */}
                {showTranslation && (
                    <div className="space-y-4 border-t border-muted/30 pt-4">
                        {verse.translations && verse.translations.length > 0
                            ? verse.translations.map((trans, index) => (
                                  <p
                                      key={`${verse.id}-${trans.resource_id}-${index}`}
                                      className="text-[15px] leading-relaxed text-slate-900 dark:text-slate-100"
                                  >
                                      {trans.text}
                                  </p>
                              ))
                            : null}
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

            {/* Graph V2 Modal */}
            <QuranGraphV2Modal
                open={isGraphV2ModalOpen}
                onOpenChange={setIsGraphV2ModalOpen}
                verseId={verse.id}
                verseKey={`${verse.chapterNumber}:${verse.verseNumber}`}
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
