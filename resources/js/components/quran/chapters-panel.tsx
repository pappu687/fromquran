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
import { BookOpen, Search, History, Star, Clock } from 'lucide-react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useState, useEffect } from 'react';
import { useReaderSettings } from '@/contexts/reader-settings-context';

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
    romanName?: string;
    englishNameTranslation: string;
    revelationType: 'Meccan' | 'Medinan';
    verses: number;
    startJuz?: number;
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
    const { settings } = useReaderSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);

    // Load recently viewed from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('quran_recently_viewed');
        if (saved) {
            try {
                setRecentlyViewed(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse recently viewed', e);
            }
        }
    }, []);

    const saveRecentlyViewed = (id: number) => {
        const updated = [
            id,
            ...recentlyViewed.filter((cid) => cid !== id),
        ].slice(0, 5);
        setRecentlyViewed(updated);
        localStorage.setItem('quran_recently_viewed', JSON.stringify(updated));
    };

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
            chapter.romanName?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleChapterClick = (chapterId: number) => {
        onChapterSelect(chapterId);
        saveRecentlyViewed(chapterId);
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    const recentChapters = chapters
        .filter((c) => recentlyViewed.includes(c.id))
        .sort(
            (a, b) =>
                recentlyViewed.indexOf(a.id) - recentlyViewed.indexOf(b.id),
        );

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
                    {settings.showRecentlyViewed &&
                        recentChapters.length > 0 &&
                        !searchTerm && (
                            <SidebarGroup>
                                <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-wider text-rose-500/70 uppercase">
                                    <History className="h-3 w-3" />
                                    Recently Viewed
                                </div>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {recentChapters.map((chapter) => (
                                            <SidebarMenuItem
                                                key={`recent-${chapter.id}`}
                                            >
                                                <SidebarMenuButton
                                                    onClick={() =>
                                                        handleChapterClick(
                                                            chapter.id,
                                                        )
                                                    }
                                                    isActive={
                                                        selectedChapter ===
                                                        chapter.id
                                                    }
                                                    className={`h-auto cursor-pointer py-2 ${
                                                        selectedChapter ===
                                                        chapter.id
                                                            ? 'bg-rose-500/10 text-rose-600'
                                                            : 'hover:bg-rose-500/5'
                                                    }`}
                                                >
                                                    <div className="flex w-full items-center gap-3">
                                                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-rose-500/10 text-[10px] font-bold text-rose-600">
                                                            {chapter.number}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <div className="truncate text-xs leading-none font-semibold">
                                                                {chapter.romanName ??
                                                                    chapter.englishName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        )}

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
                                                <div className="min-w-0 flex-1 text-left">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <div className="truncate text-sm font-semibold">
                                                            {chapter.romanName ??
                                                                chapter.englishName}
                                                        </div>
                                                    </div>
                                                    <div className="mt-0.5 flex items-center justify-between">
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
                                                        <div
                                                            className={`text-[10px] font-medium ${
                                                                selectedChapter ===
                                                                chapter.id
                                                                    ? 'text-black/60'
                                                                    : 'text-muted-foreground/60'
                                                            }`}
                                                        >
                                                            {chapter.verses}{' '}
                                                            verses
                                                        </div>
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
