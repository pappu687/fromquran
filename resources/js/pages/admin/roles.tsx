import { RoleFormDialog } from '@/components/admin/role-form-dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DataTable,
    type Column,
    type SortDirection,
} from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import {
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Shield,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    users_count: number;
    created_at: string;
    permissions: string[];
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    data: Role[];
}

interface Stats {
    total: number;
    with_users: number;
    permissions: number;
}

interface Filters {
    search: string;
    sort_column: string;
    sort_direction: SortDirection;
}

interface AdminRolesProps {
    roles: PaginationData;
    allPermissions: Permission[];
    stats: Stats;
    filters: Filters;
}

export default function AdminRoles({
    roles: initialRoles,
    allPermissions,
    stats,
    filters,
}: AdminRolesProps) {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSort = (column: string, direction: SortDirection) => {
        router.get(
            '/admin/roles',
            {
                ...filters,
                sort_column: column,
                sort_direction: direction,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSearch = (query: string) => {
        router.get(
            '/admin/roles',
            {
                ...filters,
                search: query,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            '/admin/roles',
            {
                ...filters,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleAddRole = () => {
        setSelectedRole(null);
        setIsFormDialogOpen(true);
    };

    const handleEditRole = (role: Role) => {
        setSelectedRole(role);
        setIsFormDialogOpen(true);
    };

    const handleDeleteRole = (role: Role) => {
        setRoleToDelete(role);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!roleToDelete) return;

        setIsDeleting(true);
        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(`/admin/roles/${roleToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete role');
            }

            setDeleteDialogOpen(false);
            setRoleToDelete(null);

            // Reload the page data
            router.reload();
        } catch (error) {
            console.error('Failed to delete role:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete role',
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFormSuccess = () => {
        router.reload();
    };

    const columns: Column<Role>[] = [
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            cell: (role) => (
                <span className="text-muted-foreground">#{role.id}</span>
            ),
        },
        {
            key: 'name',
            title: 'Role Name',
            sortable: true,
            cell: (role) => (
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{role.name}</span>
                </div>
            ),
        },
        {
            key: 'permissions',
            title: 'Permissions',
            sortable: false,
            cell: (role) => (
                <div className="flex flex-wrap gap-1">
                    {role.permissions && role.permissions.length > 0 ? (
                        <>
                            {role.permissions
                                .slice(0, 3)
                                .map((permission, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {permission}
                                    </Badge>
                                ))}
                            {role.permissions.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{role.permissions.length - 3} more
                                </Badge>
                            )}
                        </>
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            No permissions
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'users_count',
            title: 'Users',
            sortable: true,
            cell: (role) => (
                <Badge variant="outline">
                    {role.users_count}{' '}
                    {role.users_count === 1 ? 'user' : 'users'}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            title: 'Created',
            sortable: true,
            cell: (role) => new Date(role.created_at).toLocaleDateString(),
        },
    ];

    const actions = (role: Role) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditRole(role)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleDeleteRole(role)}
                    className="text-destructive focus:text-destructive"
                    disabled={['Admin', 'Super Admin'].includes(role.name)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <>
            <Head title="Roles & Permissions - Admin - From Quran" />
            <AdminLayout title="Roles & Permissions">
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.16)_100%)] px-5 py-6 shadow-sm shadow-black/[0.03] md:px-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl space-y-2">
                                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                    Roles management
                                </h2>
                                <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                    Manage roles, review permission coverage,
                                    and keep assignments deliberate.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-border/60 bg-background/90 px-4 py-3">
                                        <p className="text-lg font-semibold">
                                            {stats.total}
                                        </p>
                                        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                            Roles
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border/60 bg-background/90 px-4 py-3">
                                        <p className="text-lg font-semibold">
                                            {stats.with_users}
                                        </p>
                                        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                            In Use
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border/60 bg-background/90 px-4 py-3">
                                        <p className="text-lg font-semibold">
                                            {stats.permissions}
                                        </p>
                                        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                            Permissions
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleAddRole}
                                    className="h-10 rounded-lg px-4 text-sm"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Role
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DataTable
                        data={initialRoles.data}
                        columns={columns}
                        pagination={{
                            current_page: initialRoles.current_page,
                            last_page: initialRoles.last_page,
                            per_page: initialRoles.per_page,
                            total: initialRoles.total,
                            from: initialRoles.from,
                            to: initialRoles.to,
                        }}
                        onPageChange={handlePageChange}
                        onSort={handleSort}
                        sortColumn={filters.sort_column}
                        sortDirection={filters.sort_direction}
                        isLoading={false}
                        onSearch={handleSearch}
                        searchPlaceholder="Search roles..."
                        actions={actions}
                        emptyMessage="No roles found"
                    />
                </div>

                {/* Add/Edit Role Dialog */}
                <RoleFormDialog
                    open={isFormDialogOpen}
                    onOpenChange={setIsFormDialogOpen}
                    role={selectedRole}
                    allPermissions={allPermissions}
                    onSuccess={handleFormSuccess}
                />

                {/* Delete Confirmation Dialog */}
                <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Role</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete the role "
                                {roleToDelete?.name}"? This action cannot be
                                undone. Users with this role will lose their
                                permissions.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Role'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </AdminLayout>
        </>
    );
}
