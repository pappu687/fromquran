import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, Link, router } from '@inertiajs/react';
import { Check, ExternalLink, Globe, Lock, Search, Trash2, X } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface CollectionItem {
    id: number;
    name: string;
    description?: string | null;
    color: string;
    is_public: boolean;
    status: 'pending' | 'approved' | 'rejected';
    slug: string;
    verses_count: number;
    created_at: string;
    deleted_at?: string | null;
    user: User;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Stats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

interface Props {
    collections: {
        data: CollectionItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: Stats;
    filters: {
        status: string;
        visibility: string;
        search: string;
    };
}

export default function CollectionsAdminPage({
    collections,
    stats,
    filters,
}: Props) {
    const [searchInput, setSearchInput] = useState(filters.search);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFilter = (key: string, value: string) => {
        router.get(
            '/admin/collections',
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        handleFilter('search', searchInput);
    };

    const handleApprove = (slug: string) => {
        if (confirm('Approve this collection?')) {
            setIsProcessing(true);
            router.post(
                `/admin/collections/${slug}/approve`,
                {},
                { onFinish: () => setIsProcessing(false) },
            );
        }
    };

    const handleReject = (slug: string) => {
        if (confirm('Reject this collection?')) {
            setIsProcessing(true);
            router.post(
                `/admin/collections/${slug}/reject`,
                {},
                { onFinish: () => setIsProcessing(false) },
            );
        }
    };

    const handleDelete = (slug: string) => {
        if (
            confirm(
                'Delete this collection? This will soft-delete it and remove it from normal views.',
            )
        ) {
            setIsProcessing(true);
            router.delete(`/admin/collections/${slug}`, {
                onFinish: () => setIsProcessing(false),
            });
        }
    };

    const getStatusBadge = (status: CollectionItem['status']) => {
        const variants: Record<
            CollectionItem['status'],
            'default' | 'secondary' | 'destructive'
        > = {
            pending: 'secondary',
            approved: 'default',
            rejected: 'destructive',
        };

        return (
            <Badge variant={variants[status]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <>
            <Head title="Collections - Admin - From Quran" />
            <AdminLayout title="Collections">
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total</CardDescription>
                            <CardTitle className="text-3xl">
                                {stats.total}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Pending</CardDescription>
                            <CardTitle className="text-3xl text-yellow-600">
                                {stats.pending}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Approved</CardDescription>
                            <CardTitle className="text-3xl text-green-600">
                                {stats.approved}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Rejected</CardDescription>
                            <CardTitle className="text-3xl text-red-600">
                                {stats.rejected}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <form
                                onSubmit={handleSearch}
                                className="flex flex-1 gap-2"
                            >
                                <div className="relative max-w-sm flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by collection or user..."
                                        value={searchInput}
                                        onChange={(e) =>
                                            setSearchInput(e.target.value)
                                        }
                                        className="pl-9"
                                    />
                                </div>
                                <Button type="submit">Search</Button>
                            </form>

                            <div className="flex gap-2">
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) =>
                                        handleFilter('status', value)
                                    }
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Status
                                        </SelectItem>
                                        <SelectItem value="pending">
                                            Pending
                                        </SelectItem>
                                        <SelectItem value="approved">
                                            Approved
                                        </SelectItem>
                                        <SelectItem value="rejected">
                                            Rejected
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={filters.visibility}
                                    onValueChange={(value) =>
                                        handleFilter('visibility', value)
                                    }
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Visibility
                                        </SelectItem>
                                        <SelectItem value="public">
                                            Public
                                        </SelectItem>
                                        <SelectItem value="private">
                                            Private
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-3 text-left">
                                            Collection
                                        </th>
                                        <th className="p-3 text-left">User</th>
                                        <th className="p-3 text-left">
                                            Visibility
                                        </th>
                                        <th className="p-3 text-left">
                                            Status
                                        </th>
                                        <th className="p-3 text-left">
                                            Verses
                                        </th>
                                        <th className="p-3 text-left">Date</th>
                                        <th className="p-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {collections.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                No collections found
                                            </td>
                                        </tr>
                                    ) : (
                                        collections.data.map((collection) => (
                                            <tr
                                                key={collection.id}
                                                className="border-b align-top hover:bg-muted/50"
                                            >
                                                <td className="p-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="h-3 w-3 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        collection.color,
                                                                }}
                                                            />
                                                            <span className="font-medium">
                                                                {
                                                                    collection.name
                                                                }
                                                            </span>
                                                            {collection.deleted_at && (
                                                                <Badge variant="outline">
                                                                    Deleted
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {collection.slug}
                                                        </div>
                                                        {collection.description && (
                                                            <p className="max-w-md text-sm text-muted-foreground">
                                                                {
                                                                    collection.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="space-y-1">
                                                        <div className="font-medium">
                                                            {
                                                                collection.user
                                                                    .name
                                                            }
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {
                                                                collection.user
                                                                    .email
                                                            }
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge
                                                        variant="secondary"
                                                        className="flex w-fit items-center gap-1"
                                                    >
                                                        {collection.is_public ? (
                                                            <Globe className="h-3 w-3" />
                                                        ) : (
                                                            <Lock className="h-3 w-3" />
                                                        )}
                                                        {collection.is_public
                                                            ? 'Public'
                                                            : 'Private'}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    {getStatusBadge(
                                                        collection.status,
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {collection.verses_count}
                                                </td>
                                                <td className="p-3 text-sm text-muted-foreground">
                                                    {new Date(
                                                        collection.created_at,
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex justify-end gap-2">
                                                        {collection.is_public &&
                                                        collection.status ===
                                                            'approved' &&
                                                        !collection.deleted_at ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={`/collections/${collection.slug}`}
                                                                >
                                                                    <ExternalLink className="mr-1 h-4 w-4" />
                                                                    View
                                                                </Link>
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled
                                                            >
                                                                <ExternalLink className="mr-1 h-4 w-4" />
                                                                View
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                handleApprove(
                                                                    collection.slug,
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing ||
                                                                collection.deleted_at !==
                                                                    null
                                                            }
                                                        >
                                                            <Check className="mr-1 h-4 w-4" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() =>
                                                                handleReject(
                                                                    collection.slug,
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing ||
                                                                collection.deleted_at !==
                                                                    null
                                                            }
                                                        >
                                                            <X className="mr-1 h-4 w-4" />
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    collection.slug,
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing ||
                                                                collection.deleted_at !==
                                                                    null
                                                            }
                                                        >
                                                            <Trash2 className="mr-1 h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {collections.links.length > 3 && (
                            <div className="mt-6 flex flex-wrap gap-2">
                                {collections.links.map((link, index) => (
                                    <Button
                                        key={`${link.label}-${index}`}
                                        variant={
                                            link.active
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.visit(link.url)
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </AdminLayout>
        </>
    );
}
