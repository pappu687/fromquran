import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
    user: User | null;
    verse: Verse | null;
    resource_type_id: number;
    resource_url: string;
    resource_title: string | null;
    comment: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    resource_type: ResourceType | null;
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
        const classes: Record<string, string> = {
            pending:
                'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
            approved:
                'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
            rejected:
                'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
        };

        return (
            <Badge variant="outline" className={classes[status] || ''}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <>
            <Head title="Resource Submissions - Admin - From Quran" />
            <AdminLayout title="Resource Submissions">
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.2)_100%)] px-5 py-6 shadow-sm shadow-black/[0.03] md:px-7 md:py-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl space-y-3">
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                                        Resource submissions
                                    </h1>
                                    <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                        Review submitted resources, keep the
                                        queue moving, and process approvals with
                                        less noise.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-xl border border-border/60 bg-background/90 px-4 py-3">
                                    <p className="text-xl font-semibold text-foreground md:text-2xl">
                                        {stats.total}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Total
                                    </p>
                                </div>
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                                    <p className="text-xl font-semibold text-amber-700 md:text-2xl dark:text-amber-300">
                                        {stats.pending}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Pending
                                    </p>
                                </div>
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                                    <p className="text-xl font-semibold text-emerald-700 md:text-2xl dark:text-emerald-300">
                                        {stats.approved}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Approved
                                    </p>
                                </div>
                                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                                    <p className="text-xl font-semibold text-red-700 md:text-2xl dark:text-red-300">
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
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <form
                                    onSubmit={handleSearch}
                                    className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-xl"
                                >
                                    <div className="relative flex-1">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by user, URL, or type..."
                                            value={searchInput}
                                            onChange={(e) =>
                                                setSearchInput(e.target.value)
                                            }
                                            className="h-11 rounded-lg border-border/70 bg-background pl-9"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="h-11 rounded-lg px-5 text-sm font-medium"
                                    >
                                        Search
                                    </Button>
                                </form>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Select
                                        value={filters.status}
                                        onValueChange={(value) =>
                                            handleFilter('status', value)
                                        }
                                    >
                                        <SelectTrigger className="h-11 w-full rounded-lg border-border/70 bg-background sm:w-[150px]">
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
                                            handleFilter(
                                                'resource_type_id',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-11 w-full rounded-lg border-border/70 bg-background sm:w-[190px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Types
                                            </SelectItem>
                                            {Object.entries(
                                                resourceTypeLabels,
                                            ).map(([value, label]) => (
                                                <SelectItem
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {selectedIds.length > 0 && (
                                <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-sm font-medium text-foreground">
                                        {selectedIds.length} selected
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            className="h-9 rounded-lg px-4 text-sm"
                                            onClick={handleBulkApprove}
                                            disabled={isProcessing}
                                        >
                                            <Check className="mr-1 h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="h-9 rounded-lg px-4 text-sm"
                                            onClick={handleBulkReject}
                                            disabled={isProcessing}
                                        >
                                            <X className="mr-1 h-4 w-4" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto bg-white">
                            <table className="min-w-full bg-white">
                                <thead>
                                    <tr className="border-b border-border/70 bg-muted/20 text-left">
                                        <th className="w-12 px-4 py-3 md:px-5">
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
                                        <th className="px-4 py-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase md:px-5">
                                            User
                                        </th>
                                        <th className="px-4 py-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase md:px-5">
                                            Verse
                                        </th>
                                        <th className="px-4 py-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase md:px-5">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase md:px-5">
                                            Resource
                                        </th>
                                        <th className="px-4 py-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase md:px-5">
                                            Comment
                                        </th>
                                        <th className="px-4 py-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase md:px-5">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase md:px-5">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase md:px-5">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="px-4 py-14 text-center text-sm text-muted-foreground md:px-5"
                                            >
                                                No submissions found.
                                            </td>
                                        </tr>
                                    ) : (
                                        submissions.data.map((submission) => (
                                            <tr
                                                key={submission.id}
                                                className="border-b border-border/60 align-top transition-colors hover:bg-muted/20"
                                            >
                                                <td className="px-4 py-4 md:px-5">
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
                                                <td className="px-4 py-4 md:px-5">
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-foreground">
                                                            {submission.user?.name || 'Unknown User'}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {submission.user?.email || 'Unknown Email'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 md:px-5">
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-md border-border/70 bg-background"
                                                    >
                                                        {submission.verse?.verse_key || 'Unknown'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 md:px-5">
                                                    <span className="text-sm text-foreground">
                                                        {submission
                                                            .resource_type
                                                            ?.name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 md:px-5">
                                                    <div className="flex max-w-sm flex-col gap-1.5">
                                                        <span className="text-sm font-medium text-foreground">
                                                            {submission.resource_title ||
                                                                '-'}
                                                        </span>
                                                        <a
                                                            href={
                                                                submission.resource_url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex max-w-xs items-center gap-1.5 truncate text-xs text-primary hover:underline"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                                            <span className="truncate">
                                                                {
                                                                    submission.resource_url
                                                                }
                                                            </span>
                                                        </a>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 md:px-5">
                                                    <span className="block max-w-xs text-sm leading-6 text-muted-foreground">
                                                        {submission.comment ||
                                                            '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 md:px-5">
                                                    {getStatusBadge(
                                                        submission.status,
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 md:px-5">
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(
                                                            submission.created_at,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                timeZone: 'UTC',
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            },
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 md:px-5">
                                                    <div className="flex justify-end gap-1.5">
                                                        {submission.status ===
                                                            'pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 rounded-md p-0"
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
                                                                    <Check className="h-4 w-4 text-emerald-600" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 rounded-md p-0"
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
                                                            className="h-8 w-8 rounded-md p-0"
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

                        {submissions.last_page > 1 && (
                            <div className="flex flex-col gap-4 border-t border-border/70 px-5 py-5 md:px-7 lg:flex-row lg:items-center lg:justify-between">
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
                                <div className="flex flex-wrap gap-2">
                                    {submissions.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveState
                                            preserveScroll
                                            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                                link.active
                                                    ? 'bg-foreground text-background'
                                                    : link.url
                                                      ? 'text-foreground/70 hover:bg-muted hover:text-foreground'
                                                      : 'cursor-not-allowed opacity-40'
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}
