import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, Link, router } from '@inertiajs/react';
import { Check, ExternalLink, Search, Trash2, X } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Verse {
    id: number;
    verse_key: string;
    chapter_id: number;
}

interface ResourceType {
    id: number;
    slug: string;
    name: string;
}

interface Submission {
    id: number;
    user: User;
    verse: Verse;
    resource_type_id: number;
    resource_url: string;
    comment: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    resource_type: ResourceType;
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
    submissions: {
        data: Submission[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: Stats;
    filters: {
        status: string;
        search: string;
        resource_type_id: string;
    };
    resourceTypeLabels: Record<string, string>;
}

export default function ResourceSubmissions({
    submissions,
    stats,
    filters,
    resourceTypeLabels,
}: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchInput, setSearchInput] = useState(filters.search);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(submissions.data.map((s) => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(
                selectedIds.filter((selectedId) => selectedId !== id),
            );
        }
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            '/admin/resource-submissions',
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        handleFilter('search', searchInput);
    };

    const handleApprove = (id: number) => {
        if (confirm('Are you sure you want to approve this submission?')) {
            setIsProcessing(true);
            router.post(
                `/admin/resource-submissions/${id}/approve`,
                {},
                {
                    onFinish: () => {
                        setIsProcessing(false);
                        setSelectedIds(selectedIds.filter((sid) => sid !== id));
                    },
                },
            );
        }
    };

    const handleReject = (id: number) => {
        if (confirm('Are you sure you want to reject this submission?')) {
            setIsProcessing(true);
            router.post(
                `/admin/resource-submissions/${id}/reject`,
                {},
                {
                    onFinish: () => {
                        setIsProcessing(false);
                        setSelectedIds(selectedIds.filter((sid) => sid !== id));
                    },
                },
            );
        }
    };

    const handleDelete = (id: number) => {
        if (
            confirm(
                'Are you sure you want to delete this submission? This cannot be undone.',
            )
        ) {
            setIsProcessing(true);
            router.delete(`/admin/resource-submissions/${id}`, {
                onFinish: () => {
                    setIsProcessing(false);
                    setSelectedIds(selectedIds.filter((sid) => sid !== id));
                },
            });
        }
    };

    const handleBulkApprove = () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Approve ${selectedIds.length} submission(s)?`)) {
            setIsProcessing(true);
            router.post(
                '/admin/resource-submissions/bulk-approve',
                { ids: selectedIds },
                {
                    onFinish: () => {
                        setIsProcessing(false);
                        setSelectedIds([]);
                    },
                },
            );
        }
    };

    const handleBulkReject = () => {
        if (selectedIds.length === 0) return;
        if (confirm(`Reject ${selectedIds.length} submission(s)?`)) {
            setIsProcessing(true);
            router.post(
                '/admin/resource-submissions/bulk-reject',
                { ids: selectedIds },
                {
                    onFinish: () => {
                        setIsProcessing(false);
                        setSelectedIds([]);
                    },
                },
            );
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive'
        > = {
            pending: 'secondary',
            approved: 'default',
            rejected: 'destructive',
        };
        return (
            <Badge variant={variants[status] || 'default'}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <>
            <Head title="Resource Submissions - Admin - From Quran" />
            <AdminLayout title="Resource Submissions">
                {/* Stats Cards */}
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
                            {/* Search */}
                            <form
                                onSubmit={handleSearch}
                                className="flex flex-1 gap-2"
                            >
                                <div className="relative max-w-sm flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by user, URL, or type..."
                                        value={searchInput}
                                        onChange={(e) =>
                                            setSearchInput(e.target.value)
                                        }
                                        className="pl-9"
                                    />
                                </div>
                                <Button type="submit">Search</Button>
                            </form>

                            {/* Filters */}
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
                                    value={filters.resource_type_id}
                                    onValueChange={(value) =>
                                        handleFilter('resource_type_id', value)
                                    }
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Types
                                        </SelectItem>
                                        {Object.entries(resourceTypeLabels).map(
                                            ([value, label]) => (
                                                <SelectItem
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedIds.length > 0 && (
                            <div className="mt-4 flex items-center gap-2 rounded-md bg-muted p-3">
                                <span className="text-sm font-medium">
                                    {selectedIds.length} selected
                                </span>
                                <Button
                                    size="sm"
                                    onClick={handleBulkApprove}
                                    disabled={isProcessing}
                                >
                                    <Check className="mr-1 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleBulkReject}
                                    disabled={isProcessing}
                                >
                                    <X className="mr-1 h-4 w-4" />
                                    Reject
                                </Button>
                            </div>
                        )}
                    </CardHeader>

                    <CardContent>
                        {/* Data Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="w-12 p-3 text-left">
                                            <Checkbox
                                                checked={
                                                    submissions.data.length >
                                                        0 &&
                                                    selectedIds.length ===
                                                        submissions.data.length
                                                }
                                                onCheckedChange={
                                                    handleSelectAll
                                                }
                                            />
                                        </th>
                                        <th className="p-3 text-left">User</th>
                                        <th className="p-3 text-left">Verse</th>
                                        <th className="p-3 text-left">Type</th>
                                        <th className="p-3 text-left">
                                            Resource
                                        </th>
                                        <th className="p-3 text-left">
                                            Comment
                                        </th>
                                        <th className="p-3 text-left">
                                            Status
                                        </th>
                                        <th className="p-3 text-left">Date</th>
                                        <th className="p-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                No submissions found
                                            </td>
                                        </tr>
                                    ) : (
                                        submissions.data.map((submission) => (
                                            <tr
                                                key={submission.id}
                                                className="border-b hover:bg-muted/50"
                                            >
                                                <td className="p-3">
                                                    <Checkbox
                                                        checked={selectedIds.includes(
                                                            submission.id,
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            handleSelectOne(
                                                                submission.id,
                                                                checked as boolean,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <div>
                                                        <div className="font-medium">
                                                            {
                                                                submission.user
                                                                    .name
                                                            }
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {
                                                                submission.user
                                                                    .email
                                                            }
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant="outline">
                                                        {
                                                            submission.verse
                                                                .verse_key
                                                        }
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    <span className="text-sm">
                                                        {submission
                                                            .resource_type
                                                            ?.name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <a
                                                        href={
                                                            submission.resource_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex max-w-xs items-center gap-1 truncate text-sm text-primary hover:underline"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        <span className="truncate">
                                                            {
                                                                submission.resource_url
                                                            }
                                                        </span>
                                                    </a>
                                                </td>
                                                <td className="p-3">
                                                    <span className="block max-w-xs truncate text-sm text-muted-foreground">
                                                        {submission.comment ||
                                                            '-'}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    {getStatusBadge(
                                                        submission.status,
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(
                                                            submission.created_at,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex justify-end gap-1">
                                                        {submission.status ===
                                                            'pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() =>
                                                                        handleApprove(
                                                                            submission.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isProcessing
                                                                    }
                                                                    title="Approve"
                                                                >
                                                                    <Check className="h-4 w-4 text-green-600" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() =>
                                                                        handleReject(
                                                                            submission.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isProcessing
                                                                    }
                                                                    title="Reject"
                                                                >
                                                                    <X className="h-4 w-4 text-red-600" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    submission.id,
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {submissions.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing{' '}
                                    {(submissions.current_page - 1) *
                                        submissions.per_page +
                                        1}{' '}
                                    to{' '}
                                    {Math.min(
                                        submissions.current_page *
                                            submissions.per_page,
                                        submissions.total,
                                    )}{' '}
                                    of {submissions.total} results
                                </div>
                                <div className="flex gap-1">
                                    {submissions.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveState
                                            preserveScroll
                                            className={`rounded px-3 py-1 text-sm ${
                                                link.active
                                                    ? 'bg-primary text-primary-foreground'
                                                    : link.url
                                                      ? 'hover:bg-muted'
                                                      : 'cursor-not-allowed opacity-50'
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </AdminLayout>
        </>
    );
}
