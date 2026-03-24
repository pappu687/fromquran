import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { BookOpen, MapPin } from 'lucide-react';

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    romanName?: string;
    englishNameTranslation: string;
    revelationType: 'Meccan' | 'Medinan';
    verses: number;
}

interface ChapterInfoHeaderProps {
    chapter?: Chapter;
}

export function ChapterInfoHeader({ chapter }: ChapterInfoHeaderProps) {
    if (!chapter) {
        return (
            <div className="bg-muted/50 mx-auto h-24 w-full max-w-3xl rounded-xl animate-pulse" />
        );
    }

    return (
        <div className="mx-auto w-full max-w-3xl rounded-xl bg-muted/50 p-6">
            <div className="flex items-start justify-between gap-4">
                {/* Left side - Chapter info */}
                <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                            {chapter.number}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">
                                {chapter.romanName ?? chapter.englishName}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {chapter.englishNameTranslation}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right side - Arabic name and metadata */}
                <div className="text-right">
                    <h3
                        className="font-arabic mb-2 text-2xl"
                        dir="rtl"
                        style={{ fontFamily: 'Amiri, serif' }}
                    >
                        {chapter.name}
                    </h3>
                    <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{chapter.revelationType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span>{chapter.verses} verses</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                router.visit(`/related/${chapter.number}`)
                            }
                        >
                            All resources
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
