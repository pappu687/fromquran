import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex min-h-svh flex-col bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.32)_100%)]">
            <div className="hidden border-b border-border/70 bg-background/75 backdrop-blur md:block">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <Link href={home()} className="flex items-center gap-2">
                        <AppLogoIcon className="h-6 w-6 fill-current text-black" />
                        <span className="text-sm font-semibold">FromQuran</span>
                    </Link>
                    <Link
                        href={home()}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Back to home
                    </Link>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 md:px-8 md:py-12">
                <div className="w-full max-w-5xl">
                    <Link
                        href={home()}
                        className="mb-6 inline-flex items-center gap-2 md:hidden"
                    >
                        <AppLogoIcon className="h-8 w-8 fill-current text-black" />
                        <span className="text-base font-semibold">
                            FromQuran
                        </span>
                    </Link>
                    {children}
                </div>
            </div>
        </div>
    );
}
