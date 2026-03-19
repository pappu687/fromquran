import { LoginForm } from '@/components/login-form';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    return (
        <div className="min-h-svh bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.32)_100%)] px-4 py-8 sm:px-6 md:px-8 md:py-12">
            <div className="mx-auto mb-6 flex w-full max-w-5xl justify-start">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                </Link>
            </div>
            <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl items-center justify-center">
                <LoginForm className="w-full" />
            </div>
        </div>
    );
}
