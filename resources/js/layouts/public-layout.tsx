import { type ReactNode } from 'react';
import { NavActions } from '@/components/nav-actions';
import { Link } from '@inertiajs/react';
import { SidebarProvider } from '@/components/ui/sidebar';

interface PublicLayoutProps {
    children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
    return (
        <SidebarProvider defaultOpen={false}>
            <div className="flex min-h-screen w-full flex-col bg-background">
                <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                        <span>FromQuran</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <NavActions />
                    </div>
                </header>
                <main className="flex-1 w-full">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
