import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { update as updateStore } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    return (
        <AuthLayout>
            <Head title="Reset password" />

            <Form
                action={updateStore().url}
                method="post"
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="w-full"
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8">
                        <div className="hidden flex-col justify-center rounded-[32px] border border-border/60 bg-background/75 p-8 shadow-sm shadow-black/[0.03] md:flex md:p-10">
                            <Badge
                                variant="outline"
                                className="w-fit rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase"
                            >
                                Reset Password
                            </Badge>
                            <div className="mt-6 space-y-4">
                                <h1 className="font-young text-4xl tracking-tight text-foreground">
                                    Create a new password and continue.
                                </h1>
                                <p className="text-base leading-7 text-muted-foreground">
                                    Choose a strong password for this account,
                                    then sign back in with your updated details.
                                </p>
                            </div>

                            <div className="mt-8 space-y-4 rounded-[28px] border border-border/60 bg-muted/20 p-5">
                                <div className="flex gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm shadow-black/[0.03]">
                                        <KeyRound className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        The reset is tied to{' '}
                                        <span className="font-medium text-foreground">
                                            {email}
                                        </span>
                                        .
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm shadow-black/[0.03]">
                                        <ShieldCheck className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Use a password you do not reuse
                                        elsewhere.
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
                                        Reset Password
                                    </Badge>
                                    <h1 className="font-young text-3xl tracking-tight text-foreground md:text-4xl">
                                        Set a new password
                                    </h1>
                                    <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                        Please enter your new password below.
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <Field>
                                        <FieldLabel htmlFor="email">
                                            Email
                                        </FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            value={email}
                                            readOnly
                                            className="h-11 rounded-xl border-border/70 bg-muted/35"
                                        />
                                        <InputError message={errors.email} />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="password">
                                            Password
                                        </FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            autoComplete="new-password"
                                            className="h-11 rounded-xl border-border/70 bg-background"
                                            autoFocus
                                        />
                                        <InputError message={errors.password} />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="password_confirmation">
                                            Confirm password
                                        </FieldLabel>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                            autoComplete="new-password"
                                            className="h-11 rounded-xl border-border/70 bg-background"
                                        />
                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                        />
                                    </Field>
                                </div>

                                <Button
                                    type="submit"
                                    className="h-11 w-full rounded-full text-sm font-medium"
                                    disabled={processing}
                                    data-test="reset-password-button"
                                >
                                    {processing && <Spinner />}
                                    Reset password
                                    {!processing && (
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    )}
                                </Button>

                                <FieldDescription className="border-t border-border/60 pt-1 text-center">
                                    Use your new password the next time you sign
                                    in.
                                </FieldDescription>
                            </FieldGroup>
                        </div>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
