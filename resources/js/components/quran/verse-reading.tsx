import { useReaderSettings } from '@/contexts/reader-settings-context';
import { useVerseActions } from '@/hooks/use-verse-actions';
import { cn } from '@/lib/utils';
import { type VerseAnnotation, type VerseListItem } from '@/types/quran';
import { type ReactNode } from 'react';
import { AnnotatedArabicText } from './annotated-arabic-text';
import { TajweedText } from './tajweed-text';
import { VerseActionsDropdown } from './verse-actions-dropdown';
import { VerseActionsModals } from './verse-actions-modals';

interface VerseReadingProps {
    verses: VerseListItem[];
    className?: string;
    annotationsByVerse?: Record<number, VerseAnnotation[]>;
    highlightedAyah?: number | null;
    onSearch?: (text: string) => void;
    bookmarkedVerses?: Set<string>;
    onBookmarkToggle?: (verse: VerseListItem) => void;
    onCopy?: (verseId: number, text: string) => void;
    totalVerses?: number;
}

function VerseActionsWrapper({
    verse,
    totalVerses,
    isBookmarked,
    hasResources,
    resourceCount,
    onBookmarkToggle,
    onCopy,
    children,
}: {
    verse: VerseListItem;
    totalVerses?: number;
    isBookmarked: boolean;
    hasResources: boolean;
    resourceCount: number;
    onBookmarkToggle?: (verse: VerseListItem) => void;
    onCopy?: (verseId: number, text: string) => void;
    children: ReactNode;
}) {
    const actions = useVerseActions({
        verse,
        totalVerses,
        isBookmarked,
        hasResources,
        resourceCount,
        onBookmarkToggle: () => onBookmarkToggle?.(verse),
        onCopy,
    });

    return (
        <>
            <VerseActionsDropdown actions={actions} excludeCopyTranslation>
                {children}
            </VerseActionsDropdown>
            <VerseActionsModals actions={actions} verse={verse} />
        </>
    );
}

export function VerseReading({
    verses,
    className,
    annotationsByVerse = {},
    highlightedAyah,
    onSearch,
    bookmarkedVerses,
    onBookmarkToggle,
    onCopy,
    totalVerses,
}: VerseReadingProps) {
    const { settings } = useReaderSettings();
    if (verses.length === 0) {
        return null;
    }

    // Group verses by pageNumber
    const versesByPage = verses.reduce(
        (acc, verse) => {
            const page = verse.pageNumber;
            if (!acc[page]) {
                acc[page] = [];
            }
            acc[page].push(verse);
            return acc;
        },
        {} as Record<number, VerseListItem[]>,
    );

    const pages = Object.keys(versesByPage)
        .map(Number)
        .sort((a, b) => a - b);

    return (
        <div
            className={cn(
                'flex flex-col',
                'w-full',
                'max-w-full',
                'md:max-w-[280mm]',
                'md:mx-auto',
                className,
            )}
        >
            <div className="p-4">
                {pages.map((page) => {
                    return (
                        <div key={page} className="mb-8">
                            <div className="my-8 flex items-center">
                                <div className="h-px flex-1 bg-border"></div>
                                <span className="px-4 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                    Page {page}
                                </span>
                                <div className="h-px flex-1 bg-border"></div>
                            </div>
                            <div className="text-right" dir="rtl">
                                <div
                                    className="font-arabic text-justify leading-relaxed"
                                    style={{
                                        fontSize: `${settings.fontSize}rem`,
                                    }}
                                >
                                    {versesByPage[page].map((verse, index) => (
                                        <span
                                            key={verse.id}
                                            id={`verse-${verse.chapterId}-${verse.verseNumber}`}
                                            data-ayah-number={verse.verseNumber}
                                            className={cn(
                                                'rounded-2xl px-1 py-1 transition-colors duration-700',
                                                highlightedAyah ===
                                                    verse.verseNumber &&
                                                    'bg-amber-100/90 ring-1 ring-amber-300/60',
                                            )}
                                        >
                                            {settings.showTajweed &&
                                            verse.textTajweed ? (
                                                <TajweedText
                                                    className="inline"
                                                    dir="rtl"
                                                    text={verse.textTajweed}
                                                />
                                            ) : (
                                                <AnnotatedArabicText
                                                    as="span"
                                                    annotations={
                                                        annotationsByVerse[
                                                            verse.id
                                                        ] ?? []
                                                    }
                                                    className="inline"
                                                    text={verse.text}
                                                    verseId={verse.id}
                                                    interactive={true}
                                                    onSearch={onSearch}
                                                />
                                            )}
                                            <VerseActionsWrapper
                                                verse={verse}
                                                totalVerses={totalVerses}
                                                isBookmarked={
                                                    bookmarkedVerses?.has(
                                                        verse.id.toString(),
                                                    ) ?? false
                                                }
                                                hasResources={
                                                    verse.hasResources ?? false
                                                }
                                                resourceCount={
                                                    verse.resourceCount ?? 0
                                                }
                                                onBookmarkToggle={
                                                    onBookmarkToggle
                                                }
                                                onCopy={onCopy}
                                            >
                                                <span className="mr-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[40%] bg-gray-400/20 align-middle text-sm font-semibold transition-colors hover:bg-black hover:text-white">
                                                    {verse.verseNumber}
                                                </span>
                                            </VerseActionsWrapper>
                                            {index <
                                                versesByPage[page].length - 1 &&
                                                ' '}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
