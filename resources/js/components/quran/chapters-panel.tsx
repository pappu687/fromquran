import { ReaderSidebarFooter } from '@/components/quran/reader-sidebar-footer';
import { Input } from '@/components/ui/input';
import {
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useReaderSettings } from '@/contexts/reader-settings-context';
import { type ChapterSummary } from '@/types/quran';
import { History, Search } from 'lucide-react';
import {
    OverlayScrollbarsComponent,
    type OverlayScrollbarsComponentRef,
} from 'overlayscrollbars-react';
import { useEffect, useRef, useState } from 'react';

interface ChaptersPanelProps {
    chapters: ChapterSummary[];
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
    const scrollAreaRef = useRef<OverlayScrollbarsComponentRef<'div'> | null>(
        null,
    );
    const chapterButtonRefs = useRef<Record<number, HTMLButtonElement | null>>(
        {},
    );
    const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const saved = window.localStorage.getItem('quran_recently_viewed');
        if (!saved) {
            return;
        }

        try {
            setRecentlyViewed(JSON.parse(saved) as number[]);
        } catch (e) {
            console.error('Failed to parse recently viewed', e);
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

    useEffect(() => {
        if (!selectedChapter || searchTerm) {
            return;
        }

        let frameId = 0;
        let attempts = 0;

        const alignSelectedChapter = () => {
            const viewport = scrollAreaRef.current
                ?.osInstance()
                ?.elements().viewport;
            const selectedButton = chapterButtonRefs.current[selectedChapter];

            if (!viewport || !selectedButton) {
                if (attempts < 10) {
                    attempts += 1;
                    frameId =
                        window.requestAnimationFrame(alignSelectedChapter);
                }

                return;
            }

            const viewportRect = viewport.getBoundingClientRect();
            const buttonRect = selectedButton.getBoundingClientRect();
            const targetTop =
                viewport.scrollTop + (buttonRect.top - viewportRect.top) - 12;
            const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;

            viewport.scrollTo({
                top: Math.max(0, Math.min(targetTop, maxScrollTop)),
                behavior: 'auto',
            });
        };

        frameId = window.requestAnimationFrame(alignSelectedChapter);

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [searchTerm, selectedChapter]);

    return (
        <>
            <SidebarHeader className="shrink-0">
                <div className="relative px-2 py-1.5">
                    <Search className="absolute top-1/2 left-5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search surahs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10 rounded-full border-slate-200 bg-white pl-10 shadow-none focus-visible:ring-1 focus-visible:ring-slate-900"
                    />
                </div>
            </SidebarHeader>

            <SidebarContent className="overflow-hidden">
                <OverlayScrollbarsComponent
                    ref={scrollAreaRef}
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
                                <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
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
                                                    className={`h-auto cursor-pointer rounded-2xl px-2 py-2 ${
                                                        selectedChapter ===
                                                        chapter.id
                                                            ? 'bg-stone-100 text-slate-900'
                                                            : 'hover:bg-stone-50'
                                                    }`}
                                                >
                                                    <div className="flex w-full items-center gap-3">
                                                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-slate-700">
                                                            {chapter.number}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <div className="truncate text-xs leading-none font-semibold tracking-tight">
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
                                            ref={(element) => {
                                                chapterButtonRefs.current[
                                                    chapter.id
                                                ] = element;
                                            }}
                                            onClick={() =>
                                                handleChapterClick(chapter.id)
                                            }
                                            isActive={
                                                selectedChapter === chapter.id
                                            }
                                            className={`h-auto cursor-pointer rounded-2xl px-2 py-3 ${
                                                selectedChapter === chapter.id
                                                    ? 'bg-stone-100 text-slate-950'
                                                    : 'hover:bg-stone-50'
                                            }`}
                                        >
                                            <div className="flex w-full items-start gap-3">
                                                <div
                                                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                                        selectedChapter ===
                                                        chapter.id
                                                            ? 'bg-slate-900 text-white'
                                                            : 'bg-stone-200 text-slate-700'
                                                    }`}
                                                >
                                                    {chapter.number}
                                                </div>
                                                <div className="min-w-0 flex-1 text-left">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <div className="truncate text-sm font-semibold tracking-tight">
                                                            {chapter.romanName ??
                                                                chapter.englishName}
                                                        </div>
                                                    </div>
                                                    <div className="mt-0.5 flex items-center justify-between">
                                                        <div
                                                            className={`text-xs ${
                                                                selectedChapter ===
                                                                chapter.id
                                                                    ? 'text-slate-600'
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
                                                                    ? 'text-slate-500'
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

            <SidebarFooter>
                <ReaderSidebarFooter />
            </SidebarFooter>
        </>
    );
}
