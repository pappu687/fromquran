import { useReaderSettings } from '@/contexts/reader-settings-context';
import { cn } from '@/lib/utils';
import { type VerseListItem } from '@/types/quran';

interface VerseReadingProps {
    verses: VerseListItem[];
    className?: string;
}

export function VerseReading({ verses, className }: VerseReadingProps) {
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
                                        <span key={verse.id}>
                                            {verse.text}
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
