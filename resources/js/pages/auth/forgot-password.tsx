// Components
import { login } from '@/routes';
import { email as emailStore } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout>
            <Head title="Forgot password" />

            <Form action={emailStore().url} method="post">
                {({ processing, errors }) => (
                    <div className="flex w-full flex-col gap-6">
                        <Card className="overflow-hidden p-0">
                            <CardContent className="grid p-0 md:grid-cols-2">
                                <div className="p-6 md:p-8">
                                    <FieldGroup>
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <h1 className="text-2xl font-bold">
                                                Forgot password
                                            </h1>
                                            <p className="text-balance text-muted-foreground">
                                                Enter your email to receive a
                                                password reset link
                                            </p>
                                        </div>

                                        {status && (
                                            <div className="text-center text-sm font-medium text-green-600">
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
                                            />
                                            <InputError message={errors.email} />
                                        </Field>

                                        <Field>
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={processing}
                                                data-test="email-password-reset-link-button"
                                            >
                                                {processing && (
                                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                )}
                                                Email password reset link
                                            </Button>
                                        </Field>

                                        <FieldDescription className="text-center">
                                            Remember your password?{' '}
                                            <TextLink href={login().url}>
                                                Log in
                                            </TextLink>
                                        </FieldDescription>
                                    </FieldGroup>
                                </div>
                                <div className="relative hidden bg-muted md:block">
                                    <img
                                        src="/fromquran-logo.svg"
                                        alt="Image"
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
