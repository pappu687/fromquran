// Components
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send as sendStore } from '@/routes/verification';
import { Form, Head } from '@inertiajs/react';

export default function VerifyEmail({ status }: { status?: string }) {
    const linkSent = status === 'verification-link-sent';

    return (
        <AuthLayout>
            <Head title="Email verification" />

            <Form action={sendStore().url} method="post">
                {({ processing }) => (
                    <div className="flex w-full flex-col gap-6">
                        <Card className="overflow-hidden p-0">
                            <CardContent className="grid p-0 md:grid-cols-2">
                                <div className="p-6 md:p-8">
                                    <FieldGroup>
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <h1 className="text-2xl font-bold">
                                                Verify your email
                                            </h1>
                                            <p className="text-balance text-muted-foreground">
                                                We emailed a verification link
                                                to your address. Please click
                                                the link to finish setting up
                                                your account.
                                            </p>
                                        </div>

                                        <FieldDescription className="text-center">
                                            Make sure to also check your
                                            <span className="font-semibold">
                                                {' '}
                                                spam
                                            </span>{' '}
                                            or
                                            <span className="font-semibold">
                                                {' '}
                                                promotions
                                            </span>{' '}
                                            folder.
                                        </FieldDescription>

                                        {linkSent && (
                                            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                                                A new verification link has been
                                                sent to the email address you
                                                provided during registration.
                                            </div>
                                        )}

                                        <Field>
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={processing}
                                                data-test="resend-verification-email-button"
                                            >
                                                {processing && <Spinner />}
                                                Resend verification email
                                            </Button>
                                        </Field>

                                        <FieldDescription className="text-center">
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
                                <div className="relative hidden bg-muted md:block">
                                    <img
                                        src="/fromquran-logo.svg"
                                        alt="From Quran logo"
                                        className="absolute top-1/2 left-1/2 max-h-[120px] max-w-[120px] -translate-x-1/2 -translate-y-1/2"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
