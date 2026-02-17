import { LoginForm } from '@/components/login-form';
import AuthLayout from '@/layouts/auth-layout';
import { Head } from '@inertiajs/react';

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
            <LoginForm
                status={status}
                canResetPassword={canResetPassword}
                canRegister={canRegister}
            />
        </AuthLayout>
    );
}
