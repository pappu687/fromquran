import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

interface ChapterInfo {
    surah_number: number;
    surah_name: string;
    text: string;
    short_text: string;
}

interface ChapterInfoSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chapterNumber: number;
    chapterName?: string;
}

export function ChapterInfoSheet({
    open,
    onOpenChange,
    chapterNumber,
    chapterName,
}: ChapterInfoSheetProps) {
    const [info, setInfo] = useState<ChapterInfo | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && chapterNumber) {
            fetchChapterInfo();
        }
    }, [open, chapterNumber]);

    const fetchChapterInfo = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/quran/chapters/${chapterNumber}/info`);
            if (response.ok) {
                const data = await response.json();
                setInfo(data);
            }
        } catch (error) {
            console.error('Failed to fetch chapter info:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>
                        {chapterName || (info ? info.surah_name : `Surah ${chapterNumber}`)}
                    </SheetTitle>                    
                </SheetHeader>

                <div className="px-1">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[90%]" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[95%]" />
                        </div>
                    ) : info ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none px-5 surah-info">  
                            {info.text ? (
                                <div 
                                    className="chapter-info-content text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: info.text }} 
                                />
                            ) : (
                                <p className="text-muted-foreground italic">No detailed information available for this Surah.</p>
                            )}
                        </div>
                    ) : (
                        <div className="flex h-40 items-center justify-center text-center">
                            <p className="text-muted-foreground">
                                Failed to load chapter information.
                            </p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
