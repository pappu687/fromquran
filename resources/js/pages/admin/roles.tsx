import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';

export default function AdminRoles() {
    return (
        <>
            <Head title="Roles & Permissions - Admin - From Quran" />
            <AdminLayout title="Roles & Permissions">
                <div className="rounded-lg border bg-card shadow-sm">
                    <div className="border-b p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Roles & Permissions Management
                            </h2>
                            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                Create Role
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-muted-foreground">
                            Roles and permissions management interface coming
                            soon...
                        </p>
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}
