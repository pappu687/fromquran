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
import { register } from '@/routes';
import { store as loginStore } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginProps) {
    return (
        <AuthLayout>
            <Head title="Log in" />
            <Form
                action={loginStore().url}
                method="post"
                resetOnSuccess={['password']}
            >
                {({ processing, errors }) => (
                    <div className="flex w-full flex-col gap-6">
                        <Card className="overflow-hidden p-0">
                            <CardContent className="grid p-0 md:grid-cols-2">
                                <div className="p-6 md:p-8">
                                    <FieldGroup>
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <h1 className="text-2xl font-bold">
                                                Welcome back
                                            </h1>
                                            <p className="text-balance text-muted-foreground">
                                                Login to your account
                                            </p>
                                        </div>

                                        {status && (
                                            <div className="text-center text-sm font-medium text-green-600">
                                                {status}
                                            </div>
                                        )}

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
                                                placeholder="m@example.com"
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </Field>

                                        <Field>
                                            <div className="flex items-center">
                                                <FieldLabel htmlFor="password">
                                                    Password
                                                </FieldLabel>
                                                {canResetPassword && (
                                                    <TextLink
                                                        href={request()}
                                                        className="ml-auto text-sm underline-offset-2 hover:underline"
                                                        tabIndex={5}
                                                    >
                                                        Forgot your password?
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
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </Field>

                                        <Field>
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                tabIndex={4}
                                                disabled={processing}
                                                data-test="login-button"
                                            >
                                                {processing && <Spinner />}
                                                Login
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
                                                    Login with Google
                                                </span>
                                            </Button>
                                        </Field>

                                        {canRegister && (
                                            <FieldDescription className="text-center">
                                                Don&apos;t have an account?{' '}
                                                <TextLink
                                                    href={register()}
                                                    tabIndex={5}
                                                >
                                                    Sign up
                                                </TextLink>
                                            </FieldDescription>
                                        )}
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
