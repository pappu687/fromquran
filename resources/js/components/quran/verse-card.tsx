import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useReaderSettings } from '@/contexts/reader-settings-context';
import { useVerseActions } from '@/hooks/use-verse-actions';
import { useQuranAudioPlayer } from '@/hooks/useQuranAudioPlayer';
import { cn } from '@/lib/utils';
import { type VerseAnnotation, type VerseListItem } from '@/types/quran';
import { router } from '@inertiajs/react';
import {
    BookOpen,
    GitBranch,
    Info,
    Loader2,
    MoreVertical,
    Play,
} from 'lucide-react';
import { AnnotatedArabicText } from './annotated-arabic-text';
import { TajweedText } from './tajweed-text';
import { VerseActionsDropdown } from './verse-actions-dropdown';
import { VerseActionsModals } from './verse-actions-modals';

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
    onSearch?: (text: string) => void;
    highlightText?: string;
    arabicFontSize?: string | number;
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
    showTranslation = true,
    className,
    reciterId = 1,
    hideHeaderActions = false,
    annotations = [],
    onAnnotationCreated,
    onSearch,
    highlightText,
    arabicFontSize,
    contentClassName,
}: VerseCardProps) {
    const actions = useVerseActions({
        verse,
        totalVerses,
        isBookmarked,
        hasResources,
        resourceCount,
        onBookmarkToggle,
        onCopy,
    });
    const { settings } = useReaderSettings();
    const { playVerseAudio, playerState } = useQuranAudioPlayer();

    const handlePlayAudio = async () => {
        const chapterNumber = verse.chapterNumber ?? verse.chapterId;
        const qfRecitationId = [6, 7].includes(reciterId) ? reciterId : 7;

        await playVerseAudio({
            verseKey: `${chapterNumber}:${verse.verseNumber}`,
            recitationId: qfRecitationId,
            title: `Surah ${chapterNumber} ${chapterNumber}:${verse.verseNumber}`,
        });
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

    return (
        <Card
            className={cn(
                'group mb-4 border-0 shadow-none transition-all duration-300',
                isCurrentlyPlaying && 'bg-primary/5 ring-1 ring-primary/20',
                actions.isResourcesSheetOpen &&
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
                                            actions.setActiveResourceSection(
                                                undefined,
                                            );
                                            actions.setIsResourcesSheetOpen(
                                                true,
                                            );
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
                                    {actions.resourcesTooltip}
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            actions.setIsGraphV2ModalOpen(true)
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
                                            actions.setIsTafsirModalOpen(true)
                                        }
                                        className="h-8 w-8 p-0"
                                    >
                                        <BookOpen className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Tafsir</TooltipContent>
                            </Tooltip>

                            <VerseActionsDropdown actions={actions}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </VerseActionsDropdown>
                        </div>
                    )}
                </div>

                {/* Arabic Text */}
                <div className="mb-4 text-right">
                    {settings.showTajweed && verse.textTajweed ? (
                        <TajweedText
                            className="font-arabic leading-[2.2] text-slate-900 dark:text-slate-100"
                            dir="rtl"
                            style={{
                                fontSize:
                                    arabicFontSize ?? `${settings.fontSize}rem`,
                            }}
                            text={verse.textTajweed}
                        />
                    ) : (
                        <AnnotatedArabicText
                            as="div"
                            annotations={annotations}
                            className="font-arabic leading-[2.2] text-slate-900 dark:text-slate-100"
                            dir="rtl"
                            interactive
                            onAnnotationCreated={onAnnotationCreated}
                            onSearch={onSearch}
                            highlightText={highlightText}
                            style={{
                                fontSize:
                                    arabicFontSize ?? `${settings.fontSize}rem`,
                            }}
                            text={verse.text}
                            verseId={verse.id}
                        />
                    )}
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

            <VerseActionsModals actions={actions} verse={verse} />
        </Card>
    );
}
