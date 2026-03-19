import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
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
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import { store as loginStore } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpenText, Heart, Layers3 } from 'lucide-react';

interface LoginFormProps {
    className?: string;
    status?: string;
    canResetPassword?: boolean;
    canRegister?: boolean;
}

export function LoginForm({
    className,
    status,
    canResetPassword = true,
    canRegister = true,
}: LoginFormProps) {
    const page = usePage<{ googleAuthEnabled?: boolean }>();
    const googleAuthEnabled = Boolean(page.props.googleAuthEnabled);
    const highlights = [
        {
            icon: Layers3,
            label: 'Collections',
            description: 'Keep your saved verse sets organized.',
        },
        {
            icon: Heart,
            label: 'Favorites',
            description: 'Return quickly to the ayat you revisit most.',
        },
        {
            icon: BookOpenText,
            label: 'Reading flow',
            description:
                'Continue with a calmer, more focused study experience.',
        },
    ];

    return (
        <Form
            action={loginStore().url}
            method="post"
            resetOnSuccess={['password']}
            className={cn('w-full', className)}
        >
            {({ processing, errors }) => (
                <div className="grid gap-6 md:grid-cols-[minmax(0,0.95fr)_1px_minmax(0,1.05fr)] md:gap-8">
                    <div className="hidden flex-col justify-center px-6 py-6 md:flex md:px-8 md:py-8">
                        <Badge
                            variant="outline"
                            className="w-fit rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase"
                        >
                            Welcome Back
                        </Badge>
                        <div className="mt-6 space-y-4">
                            <h1 className="font-young text-4xl tracking-tight text-foreground">
                                Return to your reading with clarity.
                            </h1>
                            <p className="text-base leading-7 text-muted-foreground">
                                Sign in to continue where you left off across
                                saved collections, favorites, and your study
                                history.
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
                                    Welcome Back
                                </Badge>
                                <h1 className="font-young text-3xl tracking-tight text-foreground md:text-4xl">
                                    Sign in
                                </h1>
                                <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                    Access your saved reading, contributions,
                                    favorites, and collections.
                                </p>
                            </div>

                            {status && (
                                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                    {status}
                                </div>
                            )}

                            <div className="space-y-5">
                                <Field>
                                    <FieldLabel htmlFor="email">
                                        Email
                                    </FieldLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        className="h-11 rounded-xl border-border/70 bg-background"
                                    />
                                    <InputError message={errors.email} />
                                </Field>

                                <Field>
                                    <div className="flex items-center gap-4">
                                        <FieldLabel htmlFor="password">
                                            Password
                                        </FieldLabel>
                                        {canResetPassword && (
                                            <TextLink
                                                href={request()}
                                                className="ml-auto text-sm text-muted-foreground no-underline hover:text-foreground"
                                                tabIndex={5}
                                            >
                                                Forgot password?
                                            </TextLink>
                                        )}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        className="h-11 rounded-xl border-border/70 bg-background"
                                    />
                                    <InputError message={errors.password} />
                                </Field>
                            </div>

                            <Field>
                                <Button
                                    type="submit"
                                    className="h-11 w-full rounded-full text-sm font-medium"
                                    tabIndex={4}
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing && <Spinner />}
                                    Sign in
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

                            {canRegister && (
                                <FieldDescription className="border-t border-border/60 pt-1 text-center">
                                    Don&apos;t have an account?{' '}
                                    <TextLink href={register()} tabIndex={5}>
                                        Create one
                                    </TextLink>
                                </FieldDescription>
                            )}
                        </FieldGroup>
                    </div>
                </div>
            )}
        </Form>
    );
}
