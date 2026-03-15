import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function DashboardPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - From Quran" />
            <div className="flex flex-1 flex-col gap-4 px-4 py-10">
                <div className="mx-auto h-24 w-full max-w-3xl rounded-xl bg-muted/50" />
                <div className="mx-auto h-full w-full max-w-3xl rounded-xl bg-muted/50" />
            </div>
        </AppLayout>
    );
}
