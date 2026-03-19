import TextLink from '@/components/text-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send as sendStore } from '@/routes/verification';
import { Form, Head } from '@inertiajs/react';
import { ArrowRight, MailCheck, ShieldCheck } from 'lucide-react';

export default function VerifyEmail({ status }: { status?: string }) {
    const linkSent = status === 'verification-link-sent';

    return (
        <AuthLayout>
            <Head title="Email verification" />

            <Form action={sendStore().url} method="post" className="w-full">
                {({ processing }) => (
                    <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8">
                        <div className="hidden flex-col justify-center rounded-[32px] border border-border/60 bg-background/75 p-8 shadow-sm shadow-black/[0.03] md:flex md:p-10">
                            <Badge
                                variant="outline"
                                className="w-fit rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase"
                            >
                                Email Verification
                            </Badge>
                            <div className="mt-6 space-y-4">
                                <h1 className="font-young text-4xl tracking-tight text-foreground">
                                    One last step to activate your account.
                                </h1>
                                <p className="text-base leading-7 text-muted-foreground">
                                    Open the verification email we sent and
                                    follow the link to finish setup.
                                </p>
                            </div>

                            <div className="mt-8 space-y-4 rounded-[28px] border border-border/60 bg-muted/20 p-5">
                                <div className="flex gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm shadow-black/[0.03]">
                                        <MailCheck className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Also check spam or promotions if the
                                        email does not appear right away.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm shadow-black/[0.03]">
                                        <ShieldCheck className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Verification helps protect your account
                                        and keep recovery reliable.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[32px] border border-border/60 bg-background/92 p-6 shadow-sm shadow-black/[0.04] md:p-8">
                            <FieldGroup className="gap-6">
                                <div className="space-y-3 text-center md:text-left">
                                    <Badge
                                        variant="outline"
                                        className="rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase md:hidden"
                                    >
                                        Email Verification
                                    </Badge>
                                    <h1 className="font-young text-3xl tracking-tight text-foreground md:text-4xl">
                                        Verify your email
                                    </h1>
                                    <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                        We emailed a verification link to your
                                        address. Click it to finish setting up
                                        your account.
                                    </p>
                                </div>

                                {linkSent && (
                                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                        A new verification link has been sent to
                                        the email address you provided during
                                        registration.
                                    </div>
                                )}

                                <FieldDescription className="text-center md:text-left">
                                    Make sure to also check your{' '}
                                    <span className="font-semibold text-foreground">
                                        spam
                                    </span>{' '}
                                    or{' '}
                                    <span className="font-semibold text-foreground">
                                        promotions
                                    </span>{' '}
                                    folder.
                                </FieldDescription>

                                <Field>
                                    <Button
                                        type="submit"
                                        className="h-11 w-full rounded-full text-sm font-medium"
                                        disabled={processing}
                                        data-test="resend-verification-email-button"
                                    >
                                        {processing && <Spinner />}
                                        Resend verification email
                                        {!processing && (
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        )}
                                    </Button>
                                </Field>

                                <FieldDescription className="border-t border-border/60 pt-1 text-center">
                                    Logged in as a different email?{' '}
                                    <TextLink
                                        href={logout().url}
                                        method="post"
                                        as="button"
                                    >
                                        Log out
                                    </TextLink>
                                    .
                                </FieldDescription>
                            </FieldGroup>
                        </div>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
