import { cn } from '@/lib/utils';

interface Verse {
    id: number;
    verseNumber: number;
    text: string;
    translation?: string;
    audioUrl?: string;
    juzNumber: number;
    pageNumber: number;
}

interface VerseReadingProps {
    verses: Verse[];
    className?: string;
}

export function VerseReading({ verses, className }: VerseReadingProps) {
    if (verses.length === 0) {
        return null;
    }

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
                <div className="text-right" dir="rtl">
                    <p className="font-arabic text-3xl leading-relaxed text-justify">
                        {verses.map((verse, index) => (
                            <span key={verse.id}>
                                {verse.text}
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[40%] bg-gray-400/20 mr-2 text-sm font-semibold align-middle">
                                    {verse.verseNumber}
                                </span>
                                {index < verses.length - 1 && ' '}
                            </span>
                        ))}
                    </p>
                </div>
            </div>
        </div>
    );
}
