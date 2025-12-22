import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import { type BreadcrumbItem } from '@/types';
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

interface Submission {
    id: number;
    user: User;
    verse: Verse;
    resource_type: string;
    resource_url: string;
    comment: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
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
        resource_type: string;
    };
}

const resourceTypeLabels: Record<string, string> = {
    youtube_tafseer: 'YouTube Tafseer',
    podcast: 'Podcast',
    article: 'Article',
    shan_e_nuzul: 'Shan e Nuzul',
    hadith: 'Related Hadith',
    fiqh_ruling: 'Fiqh Ruling',
    fatwa: 'Fatwa',
    scholarly_commentary: 'Scholarly Commentary',
    other: 'Other',
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Resource Submissions',
        href: admin.resourceSubmissions().url,
    },
];

export default function ResourceSubmissions({ submissions, stats, filters }: Props) {
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
            setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
        }
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            '/admin/resource-submissions',
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, preserveScroll: true }
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
                }
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
                }
            );
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this submission? This cannot be undone.')) {
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
                }
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
                }
            );
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Resource Submissions" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Resource Submissions</h1>
                    <p className="text-muted-foreground">
                        Manage user-submitted Quran verse resources
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total</CardDescription>
                            <CardTitle className="text-3xl">{stats.total}</CardTitle>
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
                            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by user, URL, or type..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Button type="submit">Search</Button>
                            </form>

                            {/* Filters */}
                            <div className="flex gap-2">
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) => handleFilter('status', value)}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={filters.resource_type}
                                    onValueChange={(value) => handleFilter('resource_type', value)}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {Object.entries(resourceTypeLabels).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-md">
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
                                        <th className="text-left p-3 w-12">
                                            <Checkbox
                                                checked={
                                                    submissions.data.length > 0 &&
                                                    selectedIds.length === submissions.data.length
                                                }
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </th>
                                        <th className="text-left p-3">User</th>
                                        <th className="text-left p-3">Verse</th>
                                        <th className="text-left p-3">Type</th>
                                        <th className="text-left p-3">Resource</th>
                                        <th className="text-left p-3">Comment</th>
                                        <th className="text-left p-3">Status</th>
                                        <th className="text-left p-3">Date</th>
                                        <th className="text-right p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center p-8 text-muted-foreground">
                                                No submissions found
                                            </td>
                                        </tr>
                                    ) : (
                                        submissions.data.map((submission) => (
                                            <tr key={submission.id} className="border-b hover:bg-muted/50">
                                                <td className="p-3">
                                                    <Checkbox
                                                        checked={selectedIds.includes(submission.id)}
                                                        onCheckedChange={(checked) =>
                                                            handleSelectOne(submission.id, checked as boolean)
                                                        }
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <div>
                                                        <div className="font-medium">{submission.user.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {submission.user.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant="outline">{submission.verse.verse_key}</Badge>
                                                </td>
                                                <td className="p-3">
                                                    <span className="text-sm">
                                                        {resourceTypeLabels[submission.resource_type]}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <a
                                                        href={submission.resource_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline max-w-xs truncate"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        <span className="truncate">{submission.resource_url}</span>
                                                    </a>
                                                </td>
                                                <td className="p-3">
                                                    <span className="text-sm text-muted-foreground max-w-xs truncate block">
                                                        {submission.comment || '-'}
                                                    </span>
                                                </td>
                                                <td className="p-3">{getStatusBadge(submission.status)}</td>
                                                <td className="p-3">
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(submission.created_at).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex justify-end gap-1">
                                                        {submission.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleApprove(submission.id)}
                                                                    disabled={isProcessing}
                                                                    title="Approve"
                                                                >
                                                                    <Check className="h-4 w-4 text-green-600" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleReject(submission.id)}
                                                                    disabled={isProcessing}
                                                                    title="Reject"
                                                                >
                                                                    <X className="h-4 w-4 text-red-600" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDelete(submission.id)}
                                                            disabled={isProcessing}
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
                                    Showing {(submissions.current_page - 1) * submissions.per_page + 1} to{' '}
                                    {Math.min(submissions.current_page * submissions.per_page, submissions.total)} of{' '}
                                    {submissions.total} results
                                </div>
                                <div className="flex gap-1">
                                    {submissions.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveState
                                            preserveScroll
                                            className={`px-3 py-1 rounded text-sm ${
                                                link.active
                                                    ? 'bg-primary text-primary-foreground'
                                                    : link.url
                                                    ? 'hover:bg-muted'
                                                    : 'opacity-50 cursor-not-allowed'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
