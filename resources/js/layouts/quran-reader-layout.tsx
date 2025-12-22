import { Separator } from '@/components/ui/separator';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { PanelLeft } from 'lucide-react';
import { type ReactNode } from 'react';

interface QuranReaderLayoutProps {
    children: ReactNode;
    chaptersPanel: ReactNode;
    className?: string;
}

export default function QuranReaderLayout({
    children,
    chaptersPanel,
    className,
}: QuranReaderLayoutProps) {
    return (
        <SidebarProvider>
            <div
                className={cn(
                    'flex min-h-screen w-full bg-background',
                    className,
                )}
            >
                {/* Left Sidebar - Chapters */}
                <Sidebar
                    collapsible="offcanvas"
                    variant="sidebar"
                    className="border-r"
                >
                    {chaptersPanel}
                </Sidebar>

                {/* Main Content - Verses Panel */}
                <SidebarInset>
                    <div className="flex min-h-svh flex-col">
                        {/* Top Bar with Menu Toggle */}
                        <div className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/95 px-3 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <SidebarTrigger className="h-8 w-8 rounded-md border">
                                <PanelLeft className="h-4 w-4" />
                            </SidebarTrigger>
                            <Separator
                                orientation="vertical"
                                className="h-6"
                            />
                            <h1 className="text-base font-semibold md:text-lg">
                                Quran Reader
                            </h1>
                        </div>
                        {/* Verses Content */}
                        <div className="flex-1 overflow-y-auto">{children}</div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
