import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Field,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layouts/auth-layout';
import { store as confirmStore } from '@/routes/password/confirm';
import { Form, Head } from '@inertiajs/react';

export default function ConfirmPassword() {
    return (
        <AuthLayout>
            <Head title="Confirm password" />

            <Form action={confirmStore().url} method="post" resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <div className="flex w-full flex-col gap-6">
                        <Card className="overflow-hidden p-0">
                            <CardContent className="grid p-0 md:grid-cols-2">
                                <div className="p-6 md:p-8">
                                    <FieldGroup>
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <h1 className="text-2xl font-bold">
                                                Confirm your password
                                            </h1>
                                            <p className="text-balance text-muted-foreground">
                                                This is a secure area of the
                                                application. Please confirm your
                                                password before continuing.
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
                                                placeholder="Password"
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </Field>

                                        <Field>
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={processing}
                                                data-test="confirm-password-button"
                                            >
                                                Confirm password
                                            </Button>
                                        </Field>
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
