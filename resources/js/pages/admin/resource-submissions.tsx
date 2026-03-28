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

interface Chapter {
    id: number;
    chapter_number: number;
    name_roman: string;
    name_arabic: string;
}

interface ChapterOption {
    id: number;
    chapter_number: number;
    name_roman: string;
}

interface ResourceType {
    id: number;
    slug: string;
    name: string;
}

interface Submission {
    id: number;
    scope: 'verse' | 'chapter';
    user: User | null;
    verse: Verse | null;
    chapter: Chapter | null;
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

interface Props {
    submissions: {
        data: Submission[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        status: string;
        search: string;
        resource_type_id: string;
        resource_scope: string;
        chapter_id: string;
    };
    resourceTypeLabels: Record<string, string>;
    chapterOptions: ChapterOption[];
}

export default function ResourceSubmissions({
    submissions,
    filters,
    resourceTypeLabels,
    chapterOptions,
}: Props) {
    const COMMENT_PREVIEW_LENGTH = 140;
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [expandedComments, setExpandedComments] = useState<string[]>([]);
    const [searchInput, setSearchInput] = useState(filters.search);
    const [isProcessing, setIsProcessing] = useState(false);
    const getSubmissionKey = (submission: Submission) =>
        `${submission.scope}-${submission.id}`;

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(
                submissions.data.map((submission) =>
                    getSubmissionKey(submission),
                ),
            );
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (key: string, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, key]);
        } else {
            setSelectedIds(
                selectedIds.filter((selectedId) => selectedId !== key),
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

    const handleApprove = (submission: Submission) => {
        if (confirm('Are you sure you want to approve this submission?')) {
            setIsProcessing(true);
            router.post(
                `/admin/resource-submissions/${submission.id}/approve`,
                { scope: submission.scope },
                {
                    onFinish: () => {
                        setIsProcessing(false);
                        setSelectedIds(
                            selectedIds.filter(
                                (selectedId) =>
                                    selectedId !== getSubmissionKey(submission),
                            ),
                        );
                    },
                },
            );
        }
    };

    const handleReject = (submission: Submission) => {
        if (confirm('Are you sure you want to reject this submission?')) {
            setIsProcessing(true);
            router.post(
                `/admin/resource-submissions/${submission.id}/reject`,
                { scope: submission.scope },
                {
                    onFinish: () => {
                        setIsProcessing(false);
                        setSelectedIds(
                            selectedIds.filter(
                                (selectedId) =>
                                    selectedId !== getSubmissionKey(submission),
                            ),
                        );
                    },
                },
            );
        }
    };

    const handleDelete = (submission: Submission) => {
        if (
            confirm(
                'Are you sure you want to delete this submission? This cannot be undone.',
            )
        ) {
            setIsProcessing(true);
            router.delete(`/admin/resource-submissions/${submission.id}`, {
                data: { scope: submission.scope },
                onFinish: () => {
                    setIsProcessing(false);
                    setSelectedIds(
                        selectedIds.filter(
                            (selectedId) =>
                                selectedId !== getSubmissionKey(submission),
                        ),
                    );
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
                {
                    ids: selectedIds.map((selectedId) => {
                        const [scope, id] = selectedId.split('-');

                        return {
                            scope,
                            id: Number(id),
                        };
                    }),
                },
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
                {
                    ids: selectedIds.map((selectedId) => {
                        const [scope, id] = selectedId.split('-');

                        return {
                            scope,
                            id: Number(id),
                        };
                    }),
                },
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

    const toggleComment = (id: string) => {
        setExpandedComments((current) =>
            current.includes(id)
                ? current.filter((commentId) => commentId !== id)
                : [...current, id],
        );
    };

    return (
        <>
            <Head title="Resource Submissions - Admin - From Quran" />
            <AdminLayout title="Resource Submissions">
                <div className="space-y-6">
                    <div className="max-w-3xl space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                            Resource submissions
                        </h1>
                        <p className="text-sm leading-6 text-muted-foreground md:text-base">
                            Review submitted resources, keep the queue moving,
                            and process approvals with less noise.
                        </p>
                    </div>

                    <div className="space-y-5">
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
                                    value={filters.resource_scope}
                                    onValueChange={(value) =>
                                        router.get(
                                            '/admin/resource-submissions',
                                            {
                                                ...filters,
                                                resource_scope: value,
                                                chapter_id:
                                                    value === 'chapter'
                                                        ? filters.chapter_id
                                                        : 'all',
                                                page: 1,
                                            },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                            },
                                        )
                                    }
                                >
                                    <SelectTrigger className="h-11 w-full rounded-lg border-border/70 bg-background sm:w-[170px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Scopes
                                        </SelectItem>
                                        <SelectItem value="verse">
                                            Verse Resources
                                        </SelectItem>
                                        <SelectItem value="chapter">
                                            Chapter Resources
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {filters.resource_scope === 'chapter' && (
                                    <Select
                                        value={filters.chapter_id}
                                        onValueChange={(value) =>
                                            handleFilter('chapter_id', value)
                                        }
                                    >
                                        <SelectTrigger className="h-11 w-full rounded-lg border-border/70 bg-background sm:w-[220px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Chapters
                                            </SelectItem>
                                            {chapterOptions.map((chapter) => (
                                                <SelectItem
                                                    key={chapter.id}
                                                    value={chapter.id.toString()}
                                                >
                                                    {chapter.chapter_number}.{' '}
                                                    {chapter.name_roman}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                <Select
                                    value={filters.resource_type_id}
                                    onValueChange={(value) =>
                                        handleFilter('resource_type_id', value)
                                    }
                                >
                                    <SelectTrigger className="h-11 w-full rounded-lg border-border/70 bg-background sm:w-[190px]">
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

                        {selectedIds.length > 0 && (
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                                            Target
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
                                                key={getSubmissionKey(
                                                    submission,
                                                )}
                                                className="border-b border-border/60 align-top transition-colors hover:bg-muted/20"
                                            >
                                                <td className="px-4 py-4 md:px-5">
                                                    <Checkbox
                                                        checked={selectedIds.includes(
                                                            getSubmissionKey(
                                                                submission,
                                                            ),
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            handleSelectOne(
                                                                getSubmissionKey(
                                                                    submission,
                                                                ),
                                                                checked as boolean,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-4 md:px-5">
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-foreground">
                                                            {submission.user
                                                                ?.name ||
                                                                'Unknown User'}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {submission.user
                                                                ?.email ||
                                                                'Unknown Email'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 md:px-5">
                                                    <div className="space-y-2">
                                                        <Badge
                                                            variant="outline"
                                                            className="rounded-md border-border/70 bg-background"
                                                        >
                                                            {submission.scope ===
                                                            'chapter'
                                                                ? 'Chapter Resource'
                                                                : 'Verse Resource'}
                                                        </Badge>
                                                        <Link
                                                            href={
                                                                submission.scope ===
                                                                'chapter'
                                                                    ? `/${submission.chapter?.chapter_number ?? ''}`
                                                                    : `/${submission.verse?.chapter_id ?? ''}/${submission.verse?.verse_key?.split(':')[1] ?? ''}`
                                                            }
                                                            className="block text-sm text-primary hover:underline"
                                                        >
                                                            {submission.scope ===
                                                            'chapter'
                                                                ? `Surah ${submission.chapter?.chapter_number ?? '-'}${submission.chapter?.name_roman ? ` · ${submission.chapter.name_roman}` : ''}`
                                                                : submission
                                                                      .verse
                                                                      ?.verse_key ||
                                                                  'Unknown'}
                                                        </Link>
                                                    </div>
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
                                                    {submission.comment ? (
                                                        <div className="max-w-xs">
                                                            <span className="block text-sm leading-6 text-muted-foreground">
                                                                {expandedComments.includes(
                                                                    getSubmissionKey(
                                                                        submission,
                                                                    ),
                                                                ) ||
                                                                submission
                                                                    .comment
                                                                    .length <=
                                                                    COMMENT_PREVIEW_LENGTH
                                                                    ? submission.comment
                                                                    : `${submission.comment.slice(0, COMMENT_PREVIEW_LENGTH)}...`}
                                                            </span>
                                                            {submission.comment
                                                                .length >
                                                                COMMENT_PREVIEW_LENGTH && (
                                                                <button
                                                                    type="button"
                                                                    className="mt-1 text-xs font-medium text-primary hover:underline"
                                                                    onClick={() =>
                                                                        toggleComment(
                                                                            getSubmissionKey(
                                                                                submission,
                                                                            ),
                                                                        )
                                                                    }
                                                                >
                                                                    {expandedComments.includes(
                                                                        getSubmissionKey(
                                                                            submission,
                                                                        ),
                                                                    )
                                                                        ? 'show less'
                                                                        : '... more'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="block max-w-xs text-sm leading-6 text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
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
                                                                            submission,
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
                                                                            submission,
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
                                                                    submission,
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
