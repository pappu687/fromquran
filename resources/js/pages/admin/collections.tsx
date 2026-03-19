import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    Check,
    ExternalLink,
    Globe,
    Lock,
    Search,
    Trash2,
    X,
} from 'lucide-react';
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
    user: User | null;
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
        const classes: Record<CollectionItem['status'], string> = {
            pending:
                'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
            approved:
                'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
            rejected:
                'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
        };

        return (
            <Badge variant="outline" className={classes[status]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <>
            <Head title="Collections - Admin - From Quran" />
            <AdminLayout title="Collections">
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.16)_100%)] px-5 py-6 shadow-sm shadow-black/[0.03] md:px-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl space-y-2">
                                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                    Collections moderation
                                </h2>
                                <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                    Review public and private collections with a
                                    cleaner moderation queue.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-xl border border-border/60 bg-background/90 px-4 py-3">
                                    <p className="text-lg font-semibold">
                                        {stats.total}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Total
                                    </p>
                                </div>
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                                    <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                                        {stats.pending}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Pending
                                    </p>
                                </div>
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                                    <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                                        {stats.approved}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Approved
                                    </p>
                                </div>
                                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                                    <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                                        {stats.rejected}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Rejected
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/96 shadow-sm shadow-black/[0.03]">
                        <div className="border-b border-border/70 px-5 py-5 md:px-7">
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
                                            className="h-11 rounded-lg border-border/70 bg-background pl-9"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="h-11 rounded-lg px-5 text-sm"
                                    >
                                        Search
                                    </Button>
                                </form>

                                <div className="flex gap-2">
                                    <Select
                                        value={filters.status}
                                        onValueChange={(value) =>
                                            handleFilter('status', value)
                                        }
                                    >
                                        <SelectTrigger className="h-11 w-[140px] rounded-lg border-border/70 bg-background">
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
                                        <SelectTrigger className="h-11 w-[140px] rounded-lg border-border/70 bg-background">
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
                        </div>

                        <div className="overflow-x-auto">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/70 bg-muted/20">
                                            <th className="p-3 text-left text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                                Collection
                                            </th>
                                            <th className="p-3 text-left text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                                User
                                            </th>
                                            <th className="p-3 text-left text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                                Visibility
                                            </th>
                                            <th className="p-3 text-left text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                                Status
                                            </th>
                                            <th className="p-3 text-left text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                                Verses
                                            </th>
                                            <th className="p-3 text-left text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                                Date
                                            </th>
                                            <th className="p-3 text-right text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
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
                                            collections.data.map(
                                                (collection) => (
                                                    <tr
                                                        key={collection.id}
                                                        className="border-b border-border/60 align-top hover:bg-muted/20"
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
                                                                    {
                                                                        collection.slug
                                                                    }
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
                                                                    {collection
                                                                        .user
                                                                        ?.name ??
                                                                        'Unknown user'}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {collection
                                                                        .user
                                                                        ?.email ??
                                                                        'No email available'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge
                                                                variant="outline"
                                                                className="flex w-fit items-center gap-1 rounded-md border-border/70 bg-background"
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
                                                            {
                                                                collection.verses_count
                                                            }
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
                                                                        className="rounded-lg"
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
                                                                        className="rounded-lg"
                                                                        disabled
                                                                    >
                                                                        <ExternalLink className="mr-1 h-4 w-4" />
                                                                        View
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    size="sm"
                                                                    className="rounded-lg"
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
                                                                    className="rounded-lg"
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
                                                                    className="rounded-lg"
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
                                                ),
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {collections.links.length > 3 && (
                                <div className="mt-6 flex flex-wrap gap-2 px-5 pb-5 md:px-7">
                                    {collections.links.map((link, index) => (
                                        <Button
                                            key={`${link.label}-${index}`}
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            className="rounded-lg"
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url &&
                                                router.visit(link.url)
                                            }
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}
