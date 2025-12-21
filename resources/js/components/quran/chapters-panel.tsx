import { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: 'Meccan' | 'Medinan';
    verses: number;
}

interface ChaptersPanelProps {
    chapters: Chapter[];
    selectedChapter?: number;
    onChapterSelect: (chapterId: number) => void;
    className?: string;
}

export function ChaptersPanel({
    chapters,
    selectedChapter,
    onChapterSelect,
    className
}: ChaptersPanelProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredChapters = chapters.filter(chapter =>
        chapter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chapter.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chapter.englishNameTranslation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Search Bar */}
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search chapters..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                    {filteredChapters.map((chapter) => (
                        <Button
                            key={chapter.id}
                            variant={selectedChapter === chapter.id ? "secondary" : "ghost"}
                            className={cn(
                                'w-full justify-start h-auto p-3 mb-1',
                                selectedChapter === chapter.id && 'bg-primary/10 border-primary/20'
                            )}
                            onClick={() => onChapterSelect(chapter.id)}
                        >
                            <div className="flex items-start gap-3 w-full">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                                    {chapter.number}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-medium text-sm">
                                        {chapter.englishName}
                                    </div>
                                    <div className="text-xs text-muted-foreground" dir="rtl">
                                        {chapter.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {chapter.englishNameTranslation}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                            {chapter.verses} verses
                                        </span>
                                        <span className={cn(
                                            'text-xs px-2 py-0.5 rounded-full',
                                            chapter.revelationType === 'Meccan'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-green-100 text-green-700'
                                        )}>
                                            {chapter.revelationType}
                                        </span>
                                    </div>
                                </div>
                                <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            </div>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}