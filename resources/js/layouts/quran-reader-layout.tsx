import { type ReactNode, useState } from 'react';
import { PanelLeft, PanelLeftOpen, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface QuranReaderLayoutProps {
    children: ReactNode;
    chaptersPanel: ReactNode;
    className?: string;
}

export default function QuranReaderLayout({
    children,
    chaptersPanel,
    className
}: QuranReaderLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className={cn('flex h-screen bg-background', className)}>
            {/* Left Sidebar - Chapters Panel */}
            <div
                className={cn(
                    'relative flex flex-col bg-card border-r transition-all duration-300 ease-in-out',
                    isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
                )}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-semibold text-lg">Chapters</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden"
                    >
                        <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                </div>

                {/* Chapters Content */}
                <div className="flex-1 overflow-y-auto">
                    {chaptersPanel}
                </div>
            </div>

            {/* Main Content - Verses Panel */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar with Menu Toggle */}
                <div className="flex items-center gap-2 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="h-8 w-8 p-0"
                    >
                        {isSidebarOpen ? <PanelLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <h1 className="font-semibold text-lg">Quran Reader</h1>
                </div>

                {/* Verses Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}