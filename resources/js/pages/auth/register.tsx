import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { TurnstileWidget } from '@/components/turnstile-widget';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store as registerStore } from '@/routes/register';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpenText,
    Heart,
    Layers3,
} from 'lucide-react';

export default function Register() {
    const page = usePage<{
        googleAuthEnabled?: boolean;
        turnstile?: { enabled: boolean };
    }>();
    const googleAuthEnabled = Boolean(page.props.googleAuthEnabled);
    const turnstileEnabled = Boolean(page.props.turnstile?.enabled);
    const highlights = [
        {
            icon: Layers3,
            label: 'Collections',
            description: 'Build and revisit your own saved verse groups.',
        },
        {
            icon: Heart,
            label: 'Favorites',
            description: 'Keep meaningful ayat close as you read and reflect.',
        },
        {
            icon: BookOpenText,
            label: 'Contributions',
            description: 'Take part in shaping a better Quran study platform.',
        },
    ];

    return (
        <>
            <Head title="Register">
                {turnstileEnabled && (
                    <script
                        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                        async
                        defer
                    />
                )}
            </Head>
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
                    <Form
                        action={registerStore().url}
                        method="post"
                        resetOnSuccess={['password']}
                        disableWhileProcessing
                        className="w-full"
                    >
                        {({ processing, errors }) => (
                            <div className="grid gap-6 md:grid-cols-[minmax(0,0.95fr)_1px_minmax(0,1.05fr)] md:gap-8">
                                <div className="hidden flex-col justify-center md:flex md:py-2">
                                    <Badge
                                        variant="outline"
                                        className="w-fit rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase"
                                    >
                                        New Account
                                    </Badge>
                                    <div className="mt-6 space-y-4">
                                        <h1 className="font-young text-4xl tracking-tight text-foreground">
                                            Start with a clean, personal
                                            workspace.
                                        </h1>
                                        <p className="text-base leading-7 text-muted-foreground">
                                            Create an account to save favorites,
                                            build collections, and contribute
                                            with better continuity across the
                                            app.
                                        </p>
                                    </div>

                                    <div className="mt-8 divide-y divide-border/60">
                                        {highlights.map((item) => {
                                            const Icon = item.icon;

                                            return (
                                                <div
                                                    key={item.label}
                                                    className="flex gap-4 py-4"
                                                >
                                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground shadow-sm shadow-black/[0.03]">
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {item.label}
                                                        </p>
                                                        <p className="text-sm leading-6 text-muted-foreground">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="hidden bg-border/70 md:block" />

                                <div className="rounded-[32px] bg-background/92 p-6 md:p-8">
                                    <FieldGroup className="gap-6">
                                        <div className="space-y-3 text-center md:text-left">
                                            <Badge
                                                variant="outline"
                                                className="rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase md:hidden"
                                            >
                                                New Account
                                            </Badge>
                                            <h1 className="font-young text-3xl tracking-tight text-foreground md:text-4xl">
                                                Create an account
                                            </h1>
                                            <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                                Set up your account to start
                                                saving, organizing, and
                                                continuing your reading.
                                            </p>
                                        </div>

                                        <div className="space-y-5">
                                            <Field>
                                                <FieldLabel htmlFor="name">
                                                    Name
                                                </FieldLabel>
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="name"
                                                    name="name"
                                                    placeholder="Full name"
                                                    className="h-11 rounded-xl border-border/70 bg-background"
                                                />
                                                <InputError
                                                    message={errors.name}
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="email">
                                                    Email
                                                </FieldLabel>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="email"
                                                    name="email"
                                                    className="h-11 rounded-xl border-border/70 bg-background"
                                                />
                                                <InputError
                                                    message={errors.email}
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="password">
                                                    Password
                                                </FieldLabel>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    required
                                                    tabIndex={3}
                                                    autoComplete="new-password"
                                                    name="password"
                                                    className="h-11 rounded-xl border-border/70 bg-background"
                                                />
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </Field>
                                        </div>

                                        <Field>
                                            <TurnstileWidget />
                                            {errors.turnstile_token && (
                                                <p className="text-sm text-destructive">
                                                    {errors.turnstile_token}
                                                </p>
                                            )}
                                        </Field>

                                        <Field>
                                            <Button
                                                type="submit"
                                                className="h-11 w-full rounded-full text-sm font-medium"
                                                tabIndex={5}
                                                disabled={processing}
                                                data-test="register-user-button"
                                            >
                                                {processing && <Spinner />}
                                                Create account
                                                {!processing && (
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                )}
                                            </Button>
                                        </Field>

                                        {googleAuthEnabled && (
                                            <>
                                                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-background/92">
                                                    Or continue with
                                                </FieldSeparator>

                                                <Field className="grid">
                                                    <Button
                                                        variant="outline"
                                                        type="button"
                                                        className="h-11 rounded-full border-border/70 bg-background text-sm font-medium"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            className="h-4 w-4"
                                                        >
                                                            <path
                                                                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                                                fill="currentColor"
                                                            />
                                                        </svg>
                                                        Continue with Google
                                                    </Button>
                                                </Field>
                                            </>
                                        )}

                                        <FieldDescription className="border-t border-border/60 pt-1 text-center">
                                            Already have an account?{' '}
                                            <TextLink
                                                href={login().url}
                                                tabIndex={6}
                                            >
                                                Log in
                                            </TextLink>
                                        </FieldDescription>
                                    </FieldGroup>
                                </div>
                            </div>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}
