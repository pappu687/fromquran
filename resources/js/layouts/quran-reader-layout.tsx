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
import { type ReactNode } from 'react';

interface Chapter {
    id: number;
    number: number;
    name: string;
    englishName: string;
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
    const chapter = selectedChapter ? chapters.find((c) => c.id === selectedChapter) : null;

    return (
        <SidebarProvider>
            <QuranSidebar
                chapters={chapters}
                selectedChapter={selectedChapter}
                onChapterSelect={onChapterSelect}
            />
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background">
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
                                            <span>
                                                {chapter.englishName} ({chapter.name})
                                            </span>
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
            </SidebarInset>
        </SidebarProvider>
    );
}
