import * as React from 'react';
import { ChaptersPanel } from '@/components/quran/chapters-panel';
import {
    Sidebar,
    SidebarRail,
} from '@/components/ui/sidebar';

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    romanName: string;
    englishNameTranslation: string;
    revelationType: 'Meccan' | 'Medinan';
    verses: number;
}

interface QuranSidebarProps extends React.ComponentProps<typeof Sidebar> {
    chapters: Chapter[];
    selectedChapter?: number;
    onChapterSelect: (chapterId: number) => void;
}

export function QuranSidebar({
    chapters,
    selectedChapter,
    onChapterSelect,
    ...props
}: QuranSidebarProps) {
    return (
        <Sidebar className="border-r-0 bg-background" {...props}>
            <ChaptersPanel
                chapters={chapters}
                selectedChapter={selectedChapter}
                onChapterSelect={onChapterSelect}
            />
            <SidebarRail />
        </Sidebar>
    );
}
