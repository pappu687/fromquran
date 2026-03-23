import { NavActions } from '@/components/nav-actions';
import { ChapterInfoSheet } from '@/components/quran/chapter-info-sheet';
import { JumpToAyah } from '@/components/quran/jump-to-ayah';
import { QuranSidebar } from '@/components/quran/quran-sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { type BreadcrumbItem as AppBreadcrumbItem } from '@/types';
import { type ChapterSummary } from '@/types/quran';
import { Link } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface QuranReaderLayoutProps {
    children: ReactNode;
    chapters: ChapterSummary[];
    selectedChapter?: number;
    onChapterSelect: (chapterId: number) => void;
    currentAyah?: number;
    onJumpToAyah?: (ayahNumber: number) => Promise<boolean>;
    breadcrumbs?: AppBreadcrumbItem[];
}

export default function QuranReaderLayout({
    children,
    chapters,
    selectedChapter,
    onChapterSelect,
    currentAyah = 1,
    onJumpToAyah,
    breadcrumbs = [],
}: QuranReaderLayoutProps) {
    const [isChapterInfoOpen, setIsChapterInfoOpen] = useState(false);
    const chapter = selectedChapter
        ? chapters.find((c) => c.id === selectedChapter)
        : null;

    return (
        <SidebarProvider>
            <QuranSidebar
                chapters={chapters}
                selectedChapter={selectedChapter}
                onChapterSelect={onChapterSelect}
            />
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-background">
                    <div className="flex flex-1 items-center gap-2 px-3">
                        <SidebarTrigger />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumbs.length > 0 ? (
                                    breadcrumbs.map((item, index) => {
                                        const isLast =
                                            index === breadcrumbs.length - 1;

                                        return (
                                            <BreadcrumbItem key={item.href}>
                                                {isLast ? (
                                                    <BreadcrumbPage className="line-clamp-1">
                                                        {item.title}
                                                    </BreadcrumbPage>
                                                ) : (
                                                    <>
                                                        <BreadcrumbLink asChild>
                                                            <Link
                                                                href={item.href}
                                                            >
                                                                {item.title}
                                                            </Link>
                                                        </BreadcrumbLink>
                                                        <BreadcrumbSeparator />
                                                    </>
                                                )}
                                            </BreadcrumbItem>
                                        );
                                    })
                                ) : (
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="line-clamp-1">
                                            {chapter ? (
                                                <div className="flex items-center gap-2">
                                                    <span>
                                                        {chapter.romanName ??
                                                            chapter.englishName}{' '}
                                                        ({chapter.name})
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0"
                                                        onClick={() =>
                                                            setIsChapterInfoOpen(
                                                                true,
                                                            )
                                                        }
                                                        title="About this Surah"
                                                    >
                                                        <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                'Quran Reader'
                                            )}
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                )}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto flex items-center gap-1 px-3">
                        {chapter && chapter.verses && onJumpToAyah && (
                            <JumpToAyah
                                totalAyahs={chapter.verses}
                                currentAyah={currentAyah}
                                onJump={onJumpToAyah}
                            />
                        )}
                        <NavActions />
                    </div>
                </header>
                {children}

                {chapter && (
                    <ChapterInfoSheet
                        open={isChapterInfoOpen}
                        onOpenChange={setIsChapterInfoOpen}
                        chapterNumber={chapter.number}
                        chapterName={chapter.romanName ?? chapter.englishName}
                    />
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
