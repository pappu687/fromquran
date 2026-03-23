import { UserFormDialog } from '@/components/admin/user-form-dialog';
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
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    roles: Array<{ id: number; name: string }>;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    data: User[];
}

interface Stats {
    total: number;
    admins: number;
    moderators: number;
    reviewers: number;
}

interface Filters {
    search: string;
    role: string;
    sort_column: string;
    sort_direction: SortDirection;
}

interface AdminUsersProps {
    users: PaginationData;
    stats: Stats;
    filters: Filters;
}

export default function AdminUsers({
    users: initialUsers,
    stats,
    filters,
}: AdminUsersProps) {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSort = (column: string, direction: SortDirection) => {
        router.get(
            '/admin/users',
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
            '/admin/users',
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
            '/admin/users',
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

    const handleAddUser = () => {
        setSelectedUser(null);
        setIsFormDialogOpen(true);
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsFormDialogOpen(true);
    };

    const handleDeleteUser = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(
                `/api/admin/users/${userToDelete.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken || '',
                    },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete user');
            }

            setDeleteDialogOpen(false);
            setUserToDelete(null);

            // Reload the page data
            router.reload();
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete user',
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFormSuccess = () => {
        router.reload();
    };

    const columns: Column<User>[] = [
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            cell: (user) => (
                <span className="text-muted-foreground">#{user.id}</span>
            ),
        },
        {
            key: 'name',
            title: 'Name',
            sortable: true,
            cell: (user) => <span className="font-medium">{user.name}</span>,
        },
        {
            key: 'email',
            title: 'Email',
            sortable: true,
            cell: (user) => user.email,
        },
        {
            key: 'roles',
            title: 'Roles',
            sortable: false,
            cell: (user) => (
                <div className="flex flex-wrap gap-1">
                    {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                            <Badge key={role.id} variant="secondary">
                                {role.name}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            No roles
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'created_at',
            title: 'Created',
            sortable: true,
            cell: (user) =>
                new Date(user.created_at).toLocaleDateString('en-US', {
                    timeZone: 'UTC',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                }),
        },
    ];

    const actions = (user: User) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleDeleteUser(user)}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <>
            <Head title="Users - Admin - From Quran" />
            <AdminLayout title="Users">
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.16)_100%)] px-5 py-6 shadow-sm shadow-black/[0.03] md:px-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl space-y-2">
                                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                    User management
                                </h2>
                                <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                    Manage accounts, assign roles, and keep the
                                    admin user base tidy.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-border/60 bg-background/90 px-4 py-3">
                                        <p className="text-lg font-semibold">
                                            {stats.total}
                                        </p>
                                        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                            Total
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border/60 bg-background/90 px-4 py-3">
                                        <p className="text-lg font-semibold">
                                            {stats.admins}
                                        </p>
                                        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                            Admins
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border/60 bg-background/90 px-4 py-3">
                                        <p className="text-lg font-semibold">
                                            {stats.reviewers + stats.moderators}
                                        </p>
                                        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                            Staff
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleAddUser}
                                    className="h-10 rounded-lg px-4 text-sm"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add User
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DataTable
                        data={initialUsers.data}
                        columns={columns}
                        pagination={{
                            current_page: initialUsers.current_page,
                            last_page: initialUsers.last_page,
                            per_page: initialUsers.per_page,
                            total: initialUsers.total,
                            from: initialUsers.from,
                            to: initialUsers.to,
                        }}
                        onPageChange={handlePageChange}
                        onSort={handleSort}
                        sortColumn={filters.sort_column}
                        sortDirection={filters.sort_direction}
                        isLoading={false}
                        onSearch={handleSearch}
                        searchPlaceholder="Search by name or email..."
                        actions={actions}
                        emptyMessage="No users found"
                    />
                </div>

                {/* Add/Edit User Dialog */}
                <UserFormDialog
                    open={isFormDialogOpen}
                    onOpenChange={setIsFormDialogOpen}
                    user={selectedUser}
                    onSuccess={handleFormSuccess}
                />

                {/* Delete Confirmation Dialog */}
                <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete the user "
                                {userToDelete?.name}"? This action cannot be
                                undone and will remove all of the user's data
                                including bookmarks and collections.
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
                                    'Delete User'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </AdminLayout>
        </>
    );
}
