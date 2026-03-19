import * as React from 'react';
import { ChaptersPanel } from '@/components/quran/chapters-panel';
import { type ChapterSummary } from '@/types/quran';
import {
    Sidebar,
    SidebarRail,
} from '@/components/ui/sidebar';

interface QuranSidebarProps extends React.ComponentProps<typeof Sidebar> {
    chapters: ChapterSummary[];
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
