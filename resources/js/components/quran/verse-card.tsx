import { Copy, Bookmark, BookmarkCheck, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Verse {
    id: number;
    verseNumber: number;
    text: string;
    translation?: string;
    audioUrl?: string;
    juzNumber: number;
    pageNumber: number;
}

interface VerseCardProps {
    verse: Verse;
    isBookmarked?: boolean;
    onBookmarkToggle?: (verseId: number) => void;
    onCopy?: (verseId: number, text: string) => void;
    onPlayAudio?: (audioUrl: string) => void;
    showTranslation?: boolean;
    className?: string;
}

export function VerseCard({
    verse,
    isBookmarked = false,
    onBookmarkToggle,
    onCopy,
    onPlayAudio,
    showTranslation = true,
    className
}: VerseCardProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        if (onCopy) {
            onCopy(verse.id, verse.text);
        } else {
            await navigator.clipboard.writeText(verse.text);
        }
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleBookmark = () => {
        onBookmarkToggle?.(verse.id);
    };

    const handlePlayAudio = () => {
        if (verse.audioUrl) {
            onPlayAudio?.(verse.audioUrl);
        }
    };

    return (
        <Card className={cn('mb-4', className)}>
            <CardContent className="p-6">
                {/* Verse Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                            {verse.verseNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Juz {verse.juzNumber} • Page {verse.pageNumber}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                        {verse.audioUrl && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePlayAudio}
                                className="h-8 w-8 p-0"
                                title="Play audio"
                            >
                                <Volume2 className="h-4 w-4" />
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-8 w-8 p-0"
                            title={isCopied ? "Copied!" : "Copy verse"}
                        >
                            <Copy className={cn('h-4 w-4', isCopied && 'text-green-600')} />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBookmark}
                            className="h-8 w-8 p-0"
                            title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                        >
                            {isBookmarked ? (
                                <BookmarkCheck className="h-4 w-4 text-primary" />
                            ) : (
                                <Bookmark className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Arabic Text */}
                <div className="text-right mb-4">
                    <p className="text-2xl leading-relaxed font-arabic" dir="rtl">
                        {verse.text}
                    </p>
                </div>

                {/* Translation */}
                {showTranslation && verse.translation && (
                    <div className="border-t pt-4">
                        <p className="text-muted-foreground leading-relaxed">
                            {verse.translation}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}