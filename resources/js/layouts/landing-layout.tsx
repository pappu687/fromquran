import AppLogo from '@/components/app-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

interface LandingLayoutProps {
    children: ReactNode;
    title?: string;
}

export default function LandingLayout({
    children,
    title = 'From Quran',
}: LandingLayoutProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();

    return (
        <>
            <Head title={title} />
            <div className="flex min-h-screen flex-col">
                {/* Simple Header */}
                <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto flex h-16 max-w-7xl items-center px-4">
                        <Link
                            href="/"
                            className="mr-6 flex items-center space-x-2"
                        >
                            <AppLogo />
                        </Link>

                        <nav className="me-5 flex flex-1 items-center justify-end gap-x-4 text-sm font-medium">
                            <Link
                                href="/about"
                                className="text-foreground/60 transition-colors hover:text-foreground/80"
                            >
                                About
                            </Link>
                            <Link
                                href="/contact"
                                className="text-foreground/60 transition-colors hover:text-foreground/80"
                            >
                                Contact
                            </Link>
                        </nav>

                        <div className="flex items-center gap-4">
                            {auth?.user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="relative h-9 w-9 rounded-full p-0"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage
                                                    src={auth.user.avatar}
                                                    alt={auth.user.name}
                                                />
                                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                    {getInitials(
                                                        auth.user.name,
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-56"
                                        align="end"
                                    >
                                        <UserMenuContent user={auth.user} />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <>
                                    <Button variant="ghost" asChild>
                                        <Link href="/login">Log in</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1">{children}</main>
            </div>
        </>
    );
}
