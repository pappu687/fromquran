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
import AuthLayout from '@/layouts/auth-layout';
import { store as confirmStore } from '@/routes/password/confirm';
import { Form, Head } from '@inertiajs/react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function ConfirmPassword() {
    return (
        <AuthLayout>
            <Head title="Confirm password" />

            <Form
                action={confirmStore().url}
                method="post"
                resetOnSuccess={['password']}
                className="w-full"
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8">
                        <div className="hidden flex-col justify-center rounded-[32px] border border-border/60 bg-background/75 p-8 shadow-sm shadow-black/[0.03] md:flex md:p-10">
                            <Badge
                                variant="outline"
                                className="w-fit rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase"
                            >
                                Secure Access
                            </Badge>
                            <div className="mt-6 space-y-4">
                                <h1 className="font-young text-4xl tracking-tight text-foreground">
                                    Confirm it is still you.
                                </h1>
                                <p className="text-base leading-7 text-muted-foreground">
                                    This area needs an extra confirmation before
                                    you can continue.
                                </p>
                            </div>

                            <div className="mt-8 space-y-4 rounded-[28px] border border-border/60 bg-muted/20 p-5">
                                <div className="flex gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm shadow-black/[0.03]">
                                        <ShieldCheck className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        This step helps protect sensitive parts
                                        of your account.
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
                                        Secure Access
                                    </Badge>
                                    <h1 className="font-young text-3xl tracking-tight text-foreground md:text-4xl">
                                        Confirm your password
                                    </h1>
                                    <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                        Please confirm your password before
                                        continuing.
                                    </p>
                                </div>

                                <Field>
                                    <FieldLabel htmlFor="password">
                                        Password
                                    </FieldLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        required
                                        autoFocus
                                        autoComplete="current-password"
                                        className="h-11 rounded-xl border-border/70 bg-background"
                                    />
                                    <InputError message={errors.password} />
                                </Field>

                                <Field>
                                    <Button
                                        type="submit"
                                        className="h-11 w-full rounded-full text-sm font-medium"
                                        disabled={processing}
                                        data-test="confirm-password-button"
                                    >
                                        <LockKeyhole className="mr-2 h-4 w-4" />
                                        Confirm password
                                        {!processing && (
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        )}
                                    </Button>
                                </Field>

                                <FieldDescription className="border-t border-border/60 pt-1 text-center">
                                    This confirmation is only for this secure
                                    step.
                                </FieldDescription>
                            </FieldGroup>
                        </div>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
