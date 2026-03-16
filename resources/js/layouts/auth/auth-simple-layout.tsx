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
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex min-h-svh flex-col bg-background">
            {/* Desktop auth navbar */}
            <div className="hidden border-b md:block">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <Link href={home()} className="flex items-center gap-2">
                        <AppLogoIcon className="h-6 w-6 fill-current text-black" />
                        <span className="text-sm font-semibold">FromQuran</span>
                    </Link>
                    <Link
                        href={home()}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Back to home
                    </Link>
                </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-10">
                <div className="w-full max-w-4xl">
                    <div className="flex flex-col gap-2 md:gap-8">
                        <div className="flex flex-col items-center gap-4">
                            {/* Mobile logo above card */}
                            <Link
                                href={home()}
                                className="mb-2 flex items-center gap-2 md:hidden"
                            >
                                <AppLogoIcon className="h-8 w-8 fill-current text-black" />
                                <span className="text-base font-semibold">
                                    FromQuran
                                </span>
                            </Link>

                            {title && (
                                <div className="space-y-2 text-center">
                                    <h1 className="text-xl font-medium">
                                        {title}
                                    </h1>
                                    {description && (
                                        <p className="text-center text-sm text-muted-foreground">
                                            {description}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
