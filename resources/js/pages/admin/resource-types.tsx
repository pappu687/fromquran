import { ResourceTypeFormDialog } from '@/components/admin/resource-type-form-dialog';
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
    Tags,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface ResourceType {
    id: number;
    slug: string;
    name: string;
    display_order: number;
    user_verse_resources_count: number;
    created_at: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    data: ResourceType[];
}

interface Filters {
    search: string;
    sort_column: string;
    sort_direction: SortDirection;
}

interface AdminResourceTypesProps {
    resourceTypes: PaginationData;
    filters: Filters;
}

export default function AdminResourceTypes({
    resourceTypes: initialResourceTypes,
    filters,
}: AdminResourceTypesProps) {
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedResourceType, setSelectedResourceType] =
        useState<ResourceType | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [resourceTypeToDelete, setResourceTypeToDelete] =
        useState<ResourceType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSort = (column: string, direction: SortDirection) => {
        router.get(
            '/admin/resource-types',
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
            '/admin/resource-types',
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
            '/admin/resource-types',
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

    const handleAddResourceType = () => {
        setSelectedResourceType(null);
        setIsFormDialogOpen(true);
    };

    const handleEditResourceType = (resourceType: ResourceType) => {
        setSelectedResourceType(resourceType);
        setIsFormDialogOpen(true);
    };

    const handleDeleteResourceType = (resourceType: ResourceType) => {
        setResourceTypeToDelete(resourceType);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!resourceTypeToDelete) return;

        setIsDeleting(true);
        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(
                `/admin/resource-types/${resourceTypeToDelete.id}`,
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
                throw new Error(
                    data.message || 'Failed to delete resource type',
                );
            }

            setDeleteDialogOpen(false);
            setResourceTypeToDelete(null);

            // Reload the page data
            router.reload();
        } catch (error) {
            console.error('Failed to delete resource type:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete resource type',
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFormSuccess = () => {
        router.reload();
    };

    const columns: Column<ResourceType>[] = [
        {
            key: 'id',
            title: 'ID',
            sortable: true,
            cell: (resourceType) => (
                <span className="text-muted-foreground">
                    #{resourceType.id}
                </span>
            ),
        },
        {
            key: 'name',
            title: 'Name',
            sortable: true,
            cell: (resourceType) => (
                <div className="flex items-center gap-2">
                    <Tags className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{resourceType.name}</span>
                </div>
            ),
        },
        {
            key: 'slug',
            title: 'Slug',
            sortable: true,
            cell: (resourceType) => (
                <code className="rounded bg-muted px-2 py-1 text-sm">
                    {resourceType.slug}
                </code>
            ),
        },
        {
            key: 'display_order',
            title: 'Order',
            sortable: true,
            cell: (resourceType) => (
                <Badge variant="outline">{resourceType.display_order}</Badge>
            ),
        },
        {
            key: 'user_verse_resources_count',
            title: 'Resources',
            sortable: true,
            cell: (resourceType) => (
                <Badge
                    variant={
                        resourceType.user_verse_resources_count > 0
                            ? 'default'
                            : 'secondary'
                    }
                >
                    {resourceType.user_verse_resources_count}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            title: 'Created',
            sortable: true,
            cell: (resourceType) =>
                new Date(resourceType.created_at).toLocaleDateString('en-US', {
                    timeZone: 'UTC',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                }),
        },
    ];

    const actions = (resourceType: ResourceType) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => handleEditResourceType(resourceType)}
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleDeleteResourceType(resourceType)}
                    className="text-destructive focus:text-destructive"
                    disabled={resourceType.user_verse_resources_count > 0}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <>
            <Head title="Resource Types - Admin - From Quran" />
            <AdminLayout title="Resource Types">
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.16)_100%)] px-5 py-6 shadow-sm shadow-black/[0.03] md:px-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl space-y-2">
                                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                    Resource types management
                                </h2>
                                <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                    Manage the taxonomy used for categorizing
                                    verse-linked resources.
                                </p>
                            </div>
                            <Button
                                onClick={handleAddResourceType}
                                className="h-10 rounded-lg px-4 text-sm"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create Type
                            </Button>
                        </div>
                    </div>

                    <DataTable
                        data={initialResourceTypes.data}
                        columns={columns}
                        pagination={{
                            current_page: initialResourceTypes.current_page,
                            last_page: initialResourceTypes.last_page,
                            per_page: initialResourceTypes.per_page,
                            total: initialResourceTypes.total,
                            from: initialResourceTypes.from,
                            to: initialResourceTypes.to,
                        }}
                        onPageChange={handlePageChange}
                        onSort={handleSort}
                        sortColumn={filters.sort_column}
                        sortDirection={filters.sort_direction}
                        isLoading={false}
                        onSearch={handleSearch}
                        searchPlaceholder="Search resource types..."
                        actions={actions}
                        emptyMessage="No resource types found"
                    />
                </div>

                {/* Add/Edit Resource Type Dialog */}
                <ResourceTypeFormDialog
                    open={isFormDialogOpen}
                    onOpenChange={setIsFormDialogOpen}
                    resourceType={selectedResourceType}
                    onSuccess={handleFormSuccess}
                />

                {/* Delete Confirmation Dialog */}
                <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete Resource Type
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete the resource
                                type "{resourceTypeToDelete?.name}"?
                                {(resourceTypeToDelete?.user_verse_resources_count ??
                                    0) > 0 && (
                                    <>
                                        {' '}
                                        This action cannot be undone as it has
                                        associated resources.
                                    </>
                                )}
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
                                    'Delete Type'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </AdminLayout>
        </>
    );
}
