import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    const [previewSubmission, setPreviewSubmission] = useState<Submission | null>(
        null,
    );
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
                        if (
                            previewSubmission &&
                            getSubmissionKey(previewSubmission) ===
                                getSubmissionKey(submission)
                        ) {
                            setPreviewSubmission(null);
                        }
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
                        if (
                            previewSubmission &&
                            getSubmissionKey(previewSubmission) ===
                                getSubmissionKey(submission)
                        ) {
                            setPreviewSubmission(null);
                        }
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

    const openPreview = (submission: Submission) => {
        setPreviewSubmission(submission);
    };

    const getEmbeddableUrl = (url: string) => {
        try {
            const parsed = new URL(url);
            const hostname = parsed.hostname.toLowerCase();

            if (
                hostname === 'youtu.be' ||
                hostname === 'www.youtu.be' ||
                hostname === 'youtube.com' ||
                hostname === 'www.youtube.com' ||
                hostname === 'm.youtube.com'
            ) {
                let videoId = '';

                if (hostname.includes('youtu.be')) {
                    videoId = parsed.pathname.replace('/', '');
                } else if (parsed.pathname === '/watch') {
                    videoId = parsed.searchParams.get('v') ?? '';
                } else if (parsed.pathname.startsWith('/embed/')) {
                    videoId = parsed.pathname.split('/embed/')[1] ?? '';
                } else if (parsed.pathname.startsWith('/shorts/')) {
                    videoId = parsed.pathname.split('/shorts/')[1] ?? '';
                }

                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}`;
                }
            }
        } catch {
            return null;
        }

        return null;
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
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openPreview(
                                                                    submission,
                                                                )
                                                            }
                                                            className="max-w-full text-left text-sm font-medium text-foreground hover:text-primary"
                                                        >
                                                            {submission.resource_title ||
                                                                '-'}
                                                        </button>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openPreview(
                                                                        submission,
                                                                    )
                                                                }
                                                                className="inline-flex max-w-xs items-center gap-1.5 truncate text-xs text-primary hover:underline"
                                                            >
                                                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate">
                                                                    {
                                                                        submission.resource_url
                                                                    }
                                                                </span>
                                                            </button>
                                                            <a
                                                                href={
                                                                    submission.resource_url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                                                            >
                                                                open
                                                            </a>
                                                        </div>
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

            <Dialog
                open={previewSubmission !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewSubmission(null);
                    }
                }}
            >
                <DialogContent className="flex h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[calc(100vw-2rem)]">
                    {previewSubmission && (
                        <>
                            {(() => {
                                const embeddableUrl = getEmbeddableUrl(
                                    previewSubmission.resource_url,
                                );

                                return (
                                    <>
                            <DialogHeader className="border-b border-border/70 px-5 py-4 pr-16">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <DialogTitle className="truncate text-base md:text-lg">
                                            {previewSubmission.resource_title ||
                                                previewSubmission.resource_type
                                                    ?.name ||
                                                'Resource preview'}
                                        </DialogTitle>
                                        <DialogDescription className="mt-1">
                                            {embeddableUrl
                                                ? 'Review this resource inline, then approve or reject without leaving the queue.'
                                                : 'This source cannot be embedded here. Review the details and open it in a new tab when needed.'}
                                        </DialogDescription>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {previewSubmission.status ===
                                            'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="h-9 rounded-lg px-4"
                                                    onClick={() =>
                                                        handleApprove(
                                                            previewSubmission,
                                                        )
                                                    }
                                                    disabled={isProcessing}
                                                >
                                                    <Check className="mr-1 h-4 w-4" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-9 rounded-lg px-4"
                                                    onClick={() =>
                                                        handleReject(
                                                            previewSubmission,
                                                        )
                                                    }
                                                    disabled={isProcessing}
                                                >
                                                    <X className="mr-1 h-4 w-4" />
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-9 rounded-lg px-4"
                                            onClick={() =>
                                                setPreviewSubmission(null)
                                            }
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="flex min-h-0 flex-1 flex-col">
                                <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-5 py-2.5">
                                    <a
                                        href={previewSubmission.resource_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="truncate text-sm text-primary hover:underline"
                                    >
                                        {previewSubmission.resource_url}
                                    </a>
                                    <a
                                        href={previewSubmission.resource_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 text-sm text-muted-foreground hover:text-foreground hover:underline"
                                    >
                                        Open in new tab
                                    </a>
                                </div>

                                <div className="min-h-0 flex-1 bg-muted/10">
                                    {embeddableUrl ? (
                                        <iframe
                                            key={getSubmissionKey(
                                                previewSubmission,
                                            )}
                                            src={embeddableUrl}
                                            title={
                                                previewSubmission.resource_title ||
                                                'Resource preview'
                                            }
                                            className="h-full w-full border-0 bg-black"
                                            loading="lazy"
                                            referrerPolicy="strict-origin-when-cross-origin"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center p-6">
                                            <div className="w-full max-w-3xl rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
                                                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                                                    Preview unavailable
                                                </p>
                                                <h3 className="mt-3 text-xl font-semibold text-foreground">
                                                    {previewSubmission.resource_title ||
                                                        'External resource'}
                                                </h3>
                                                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                                                    This website blocks
                                                    embedding in iframes, so the
                                                    browser will not render it
                                                    inside the modal. You can
                                                    still review the submission
                                                    from here and open the
                                                    source in a new tab.
                                                </p>
                                                {previewSubmission.comment && (
                                                    <p className="mt-5 rounded-xl bg-muted/40 px-4 py-3 text-sm leading-7 text-muted-foreground">
                                                        {
                                                            previewSubmission.comment
                                                        }
                                                    </p>
                                                )}
                                                <div className="mt-6 flex flex-wrap gap-3">
                                                    <Button asChild>
                                                        <a
                                                            href={
                                                                previewSubmission.resource_url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            Open source
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                                    </>
                                );
                            })()}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
