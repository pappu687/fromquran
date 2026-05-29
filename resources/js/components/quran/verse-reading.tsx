import { useReaderSettings } from '@/contexts/reader-settings-context';
import { cn } from '@/lib/utils';
import { type VerseAnnotation, type VerseListItem } from '@/types/quran';
import { AnnotatedArabicText } from './annotated-arabic-text';
import { TajweedText } from './tajweed-text';

interface VerseReadingProps {
    verses: VerseListItem[];
    className?: string;
    annotationsByVerse?: Record<number, VerseAnnotation[]>;
    highlightedAyah?: number | null;
    onSearch?: (text: string) => void;
}

export function VerseReading({
    verses,
    className,
    annotationsByVerse = {},
    highlightedAyah,
    onSearch,
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
                                <p
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
                                            <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-[40%] bg-gray-400/20 align-middle text-sm font-semibold">
                                                {verse.verseNumber}
                                            </span>
                                            {index <
                                                versesByPage[page].length - 1 &&
                                                ' '}
                                        </span>
                                    ))}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
