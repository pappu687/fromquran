import { NavActions } from '@/components/nav-actions';
import { QuranSidebar } from '@/components/quran/quran-sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ChapterInfoSheet } from '@/components/quran/chapter-info-sheet';

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

interface QuranReaderLayoutProps {
    children: ReactNode;
    chapters: Chapter[];
    selectedChapter?: number;
    onChapterSelect: (chapterId: number) => void;
}

export default function QuranReaderLayout({
    children,
    chapters,
    selectedChapter,
    onChapterSelect,
}: QuranReaderLayoutProps) {
    const [isChapterInfoOpen, setIsChapterInfoOpen] = useState(false);
    const chapter = selectedChapter ? chapters.find((c) => c.id === selectedChapter) : null;

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
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="line-clamp-1">
                                        {chapter ? (
                                            <div className="flex items-center gap-2">
                                                <span>
                                                    {chapter.romanName ?? chapter.englishName} ({chapter.name})
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => setIsChapterInfoOpen(true)}
                                                    title="About this Surah"
                                                >
                                                    <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                </Button>
                                            </div>
                                        ) : (
                                            'Quran Reader'
                                        )}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto px-3">
                        <NavActions />
                    </div>
                </header>
                {children}

                {chapter && (
                    <ChapterInfoSheet
                        open={isChapterInfoOpen}
                        onOpenChange={setIsChapterInfoOpen}
                        chapterNumber={chapter.number}
                        chapterName={chapter.englishName}
                    />
                )}
            </SidebarInset>
        </SidebarProvider>
    );
}
