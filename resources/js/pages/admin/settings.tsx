import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';

export default function AdminSettings() {
    return (
        <>
            <Head title="Settings - Admin - From Quran" />
            <AdminLayout title="Settings">
                <div className="rounded-lg border bg-card shadow-sm">
                    <div className="border-b p-6">
                        <h2 className="text-lg font-semibold">
                            Application Settings
                        </h2>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-muted-foreground">
                            Application settings interface coming soon...
                        </p>
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}
