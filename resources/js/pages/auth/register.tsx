import { login } from '@/routes';
import { store as registerStore } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

export default function Register() {
    return (
        <AuthLayout>
            <Head title="Register" />
            <Form
                action={registerStore().url}
                method="post"
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
            >
                {({ processing, errors }) => (
                    <div className="flex w-full flex-col gap-6">
                        <Card className="overflow-hidden p-0">
                            <CardContent className="grid p-0 md:grid-cols-2">
                                <div className="p-6 md:p-8">
                                    <FieldGroup>
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <h1 className="text-2xl font-bold">
                                                Create an account
                                            </h1>
                                            <p className="text-balance text-muted-foreground">
                                                Sign up to get started
                                            </p>
                                        </div>

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
                                            />
                                            <InputError message={errors.name} />
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
                                                placeholder="m@example.com"
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
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </Field>

                                        <Field>
                                            <FieldLabel htmlFor="password_confirmation">
                                                Confirm Password
                                            </FieldLabel>
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                required
                                                tabIndex={4}
                                                autoComplete="new-password"
                                                name="password_confirmation"
                                            />
                                            <InputError
                                                message={
                                                    errors.password_confirmation
                                                }
                                            />
                                        </Field>

                                        <Field>
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                tabIndex={5}
                                                disabled={processing}
                                                data-test="register-user-button"
                                            >
                                                {processing && <Spinner />}
                                                Create account
                                            </Button>
                                        </Field>

                                        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                                            Or continue with
                                        </FieldSeparator>

                                        <Field className="grid">
                                            <Button
                                                variant="outline"
                                                type="button"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                                        fill="currentColor"
                                                    />
                                                </svg>
                                                <span className="sr-only">
                                                    Sign up with Google
                                                </span>
                                            </Button>
                                        </Field>

                                        <FieldDescription className="text-center">
                                            Already have an account?{' '}
                                            <TextLink
                                                href={login()}
                                                tabIndex={6}
                                            >
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
