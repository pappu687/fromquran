import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: React.ReactNode;
    title?: string;
    description?: string;
}) {
    return (
        <AuthLayoutTemplate {...props}>
            <div className="space-y-2 text-center">
                {title && (
                    <h1 className="text-xl font-medium">{title}</h1>
                )}
                {description && (
                    <p className="text-center text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </AuthLayoutTemplate>
    );
}
