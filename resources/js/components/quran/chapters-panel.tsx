import { Input } from '@/components/ui/input';
import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { BookOpen, Search } from 'lucide-react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useState } from 'react';

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

interface ChaptersPanelProps {
    chapters: Chapter[];
    selectedChapter?: number;
    onChapterSelect: (chapterId: number) => void;
}

export function ChaptersPanel({
    chapters,
    selectedChapter,
    onChapterSelect,
}: ChaptersPanelProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const { isMobile, setOpenMobile } = useSidebar();

    const filteredChapters = chapters.filter(
        (chapter) =>
            chapter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chapter.englishName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            chapter.englishNameTranslation
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            chapter.romanName.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleChapterClick = (chapterId: number) => {
        onChapterSelect(chapterId);
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    return (
        <>
            <SidebarHeader className="shrink-0">
                <div className="relative p-1">
                    <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search surahs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </SidebarHeader>

            <SidebarContent className="overflow-hidden">
                <OverlayScrollbarsComponent
                    element="div"
                    className="h-full w-full"
                    options={{
                        scrollbars: {
                            autoHide: 'leave',
                            clickScroll: true,
                        },
                    }}
                    defer
                >
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {filteredChapters.map((chapter) => (
                                    <SidebarMenuItem key={chapter.id}>
                                        <SidebarMenuButton
                                            onClick={() =>
                                                handleChapterClick(chapter.id)
                                            }
                                            isActive={
                                                selectedChapter === chapter.id
                                            }
                                            className={`h-auto cursor-pointer py-3 ${
                                                selectedChapter === chapter.id
                                                    ? 'bg-rose-500 text-black hover:bg-rose-800'
                                                    : ''
                                            }`}
                                        >
                                            <div className="flex w-full items-start gap-3">
                                                <div
                                                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[30%] text-sm font-semibold ${
                                                        selectedChapter ===
                                                        chapter.id
                                                            ? 'border-2 border-rose-400/20 bg-rose-500/30'
                                                            : 'bg-gray-400/20'
                                                    }`}
                                                >
                                                    {chapter.number}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="text-sm font-medium">
                                                        {chapter.romanName}
                                                    </div>
                                                    <div
                                                        className={`text-xs ${
                                                            selectedChapter ===
                                                            chapter.id
                                                                ? 'text-black/80'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                        dir="rtl"
                                                    >
                                                        {chapter.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </OverlayScrollbarsComponent>
            </SidebarContent>
        </>
    );
}
