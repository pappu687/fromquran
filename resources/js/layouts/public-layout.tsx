import AppLogo from '@/components/app-logo';
import { SidebarProvider } from '@/components/ui/sidebar';
import { NavActions } from '@/components/nav-actions';
import { Link } from '@inertiajs/react';
import { type ReactNode } from 'react';

interface PublicLayoutProps {
    children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
    return (
        <SidebarProvider defaultOpen={false}>
            <div className="flex min-h-screen w-full flex-col bg-background">
                <header className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                        <Link
                            href="/"
                            className="mr-6 flex items-center space-x-2"
                        >
                            <AppLogo />
                        </Link>
                        <div className="flex items-center gap-2">
                            <NavActions />
                        </div>
                    </div>
                </header>
                <main className="w-full flex-1">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
