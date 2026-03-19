import AppLogo from '@/components/app-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
                            {!auth?.user && (
                                <Link
                                    href="/login"
                                    className="text-foreground/60 transition-colors hover:text-foreground/80"
                                >
                                    Log in
                                </Link>
                            )}
                        </nav>

                        <div className="flex items-center gap-4">
                            {auth?.user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="relative flex h-9 w-9 items-center justify-center rounded-full"
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
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-56"
                                        align="end"
                                    >
                                        <UserMenuContent user={auth.user} />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : null}
                        </div>
                    </div>
                </header>

                <main className="flex-1">{children}</main>

                <footer className="mt-10 border-t border-border/40 bg-background/80">
                    <div className="container mx-auto max-w-7xl px-4 py-10 md:py-12">
                        <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-start">
                            <div className="max-w-xs sm:flex-[1]">
                                <div className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                                    FromQuran
                                </div>
                            </div>

                            <div className="flex w-full flex-col gap-6 text-sm text-foreground/70 sm:flex-[3] sm:flex-row sm:justify-end sm:gap-10">
                                <div className="space-y-2">
                                    <h2 className="text-xs font-semibold tracking-wide text-foreground/60 uppercase">
                                        Connect
                                    </h2>
                                    <div className="flex flex-col space-y-1">
                                        <Link
                                            href="/contact"
                                            className="transition-colors hover:text-foreground"
                                        >
                                            Contact
                                        </Link>
                                        <Link
                                            href="/about"
                                            className="transition-colors hover:text-foreground"
                                        >
                                            About
                                        </Link>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-xs font-semibold tracking-wide text-foreground/60 uppercase">
                                        Product
                                    </h2>
                                    <div className="flex flex-col space-y-1">
                                        <Link
                                            href="/roadmap"
                                            className="transition-colors hover:text-foreground"
                                        >
                                            Roadmap
                                        </Link>
                                        <Link
                                            href="/support"
                                            className="transition-colors hover:text-foreground"
                                        >
                                            Support us
                                        </Link>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-xs font-semibold tracking-wide text-foreground/60 uppercase">
                                        Explore
                                    </h2>
                                    <div className="flex flex-col space-y-1">
                                        <Link
                                            href="/topics"
                                            className="transition-colors hover:text-foreground"
                                        >
                                            Topics index
                                        </Link>
                                        <Link
                                            href="/collections"
                                            className="transition-colors hover:text-foreground"
                                        >
                                            Collections
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
