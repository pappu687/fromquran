import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email as emailStore } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { ArrowRight, LoaderCircle, MailCheck, ShieldCheck } from 'lucide-react';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout>
            <Head title="Forgot password" />

            <Form action={emailStore().url} method="post" className="w-full">
                {({ processing, errors }) => (
                    <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_1px_minmax(0,1.1fr)] md:gap-8">
                        <div className="hidden flex-col justify-center md:flex md:py-2">
                            <Badge
                                variant="outline"
                                className="w-fit rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase"
                            >
                                Password Help
                            </Badge>
                            <div className="mt-6 space-y-4">
                                <h1 className="font-young text-4xl tracking-tight text-foreground">
                                    Regain access without friction.
                                </h1>
                                <p className="text-base leading-7 text-muted-foreground">
                                    Enter your email and we will send a secure
                                    link to reset your password.
                                </p>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm shadow-black/[0.03]">
                                        <MailCheck className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Check your inbox, and if needed, your
                                        spam or promotions folder as well.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm shadow-black/[0.03]">
                                        <ShieldCheck className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        The reset link is time-sensitive and
                                        meant only for your account.
                                    </p>
                                </div>
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
                                        Password Help
                                    </Badge>
                                    <h1 className="font-young text-3xl tracking-tight text-foreground md:text-4xl">
                                        Forgot password
                                    </h1>
                                    <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                        Enter your email to receive a password
                                        reset link.
                                    </p>
                                </div>

                                {status && (
                                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                        {status}
                                    </div>
                                )}

                                <Field>
                                    <FieldLabel htmlFor="email">
                                        Email address
                                    </FieldLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        placeholder="email@example.com"
                                        className="h-11 rounded-xl border-border/70 bg-background"
                                    />
                                    <InputError message={errors.email} />
                                </Field>

                                <Field>
                                    <Button
                                        type="submit"
                                        className="h-11 w-full rounded-full text-sm font-medium"
                                        disabled={processing}
                                        data-test="email-password-reset-link-button"
                                    >
                                        {processing && (
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Send reset link
                                        {!processing && (
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        )}
                                    </Button>
                                </Field>

                                <FieldDescription className="border-t border-border/60 pt-1 text-center">
                                    Remember your password?{' '}
                                    <TextLink href={login().url}>
                                        Log in
                                    </TextLink>
                                </FieldDescription>
                            </FieldGroup>
                        </div>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
