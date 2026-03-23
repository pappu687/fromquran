import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ExternalLink, FileUp, Loader2, MoveRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Contribution {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    resource_url: string;
    comment?: string | null;
    created_at: string;
    updated_at: string;
    verse?: {
        verse_key?: string;
    } | null;
    resource_type?: {
        name?: string;
    } | null;
}

interface PaginationData {
    data: Contribution[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    resource_type_counts?: ResourceTypeCount[];
}

interface ResourceTypeCount {
    name: string;
    count: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Contributions',
        href: '/my-contributions',
    },
];

export default function ContributionsPage() {
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [pagination, setPagination] = useState<Omit<
        PaginationData,
        'data'
    > | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedComment, setSelectedComment] = useState<string | null>(null);
    const [resourceTypeCounts, setResourceTypeCounts] = useState<
        ResourceTypeCount[]
    >([]);
    const [activeStatus, setActiveStatus] = useState<
        'all' | Contribution['status']
    >('all');
    const [activeResourceType, setActiveResourceType] = useState<string>('all');

    const truncateWords = (str: string, numWords: number) => {
        const plain = str.replace(/<[^>]+>/g, '');
        const words = plain.split(/\s+/).filter(Boolean);

        if (words.length > numWords) {
            return {
                text: `${words.slice(0, numWords).join(' ')}...`,
                isTruncated: true,
            };
        }

        return { text: plain, isTruncated: false };
    };

    const getResourcePreview = (contribution: Contribution) => {
        const plainComment = (contribution.comment || '')
            .replace(/<[^>]+>/g, '')
            .trim();

        if (!plainComment) {
            return null;
        }

        try {
            const parsed = JSON.parse(plainComment);

            if (
                Array.isArray(parsed) &&
                parsed.every((item) => typeof item === 'string')
            ) {
                const previewItems = parsed.slice(0, 5);
                const remainingCount = parsed.length - previewItems.length;
                const resourceTypeName =
                    contribution.resource_type?.name?.toLowerCase() || '';
                const itemLabel = resourceTypeName.includes('verse')
                    ? 'related verses'
                    : 'linked items';

                return {
                    title: `${parsed.length} ${itemLabel}`,
                    preview: `${previewItems.join(', ')}${remainingCount > 0 ? ` +${remainingCount} more` : ''}`,
                    expandable: true,
                };
            }
        } catch {
            // Fall back to plain text preview below.
        }

        const { text, isTruncated } = truncateWords(plainComment, 18);

        return {
            title: 'Submission preview',
            preview: text,
            expandable: isTruncated,
        };
    };

    useEffect(() => {
        loadContributions();
    }, []);

    const loadContributions = async (page: number = 1) => {
        setIsLoading(true);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(`/user-resources?page=${page}`, {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
            });

            if (response.status === 401) {
                router.visit('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load contributions');
            }

            const data: PaginationData = await response.json();

            setContributions(data.data);
            setResourceTypeCounts(data.resource_type_counts || []);
            setPagination({
                current_page: data.current_page,
                last_page: data.last_page,
                per_page: data.per_page,
                total: data.total,
                from: data.from,
                to: data.to,
                resource_type_counts: data.resource_type_counts || [],
            });
            setErrors({});
        } catch (error) {
            console.error('Failed to load contributions:', error);
            setErrors({
                general: 'Failed to load contributions. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getVisiblePages = () => {
        if (!pagination) {
            return [];
        }

        const maxVisiblePages = 5;

        if (pagination.last_page <= maxVisiblePages) {
            return Array.from(
                { length: pagination.last_page },
                (_, index) => index + 1,
            );
        }

        if (pagination.current_page <= 3) {
            return [1, 2, 3, 4, pagination.last_page];
        }

        if (pagination.current_page >= pagination.last_page - 2) {
            return [
                1,
                pagination.last_page - 3,
                pagination.last_page - 2,
                pagination.last_page - 1,
                pagination.last_page,
            ];
        }

        return [
            1,
            pagination.current_page - 1,
            pagination.current_page,
            pagination.current_page + 1,
            pagination.last_page,
        ];
    };

    const pendingCount = contributions.filter(
        (contribution) => contribution.status === 'pending',
    ).length;
    const approvedCount = contributions.filter(
        (contribution) => contribution.status === 'approved',
    ).length;
    const rejectedCount = contributions.filter(
        (contribution) => contribution.status === 'rejected',
    ).length;
    const filteredContributions = contributions.filter((contribution) => {
        const matchesStatus =
            activeStatus === 'all' || contribution.status === activeStatus;
        const matchesType =
            activeResourceType === 'all' ||
            (contribution.resource_type?.name || 'N/A') === activeResourceType;

        return matchesStatus && matchesType;
    });
    const filterItems = [
        {
            key: 'all',
            label: 'All',
            count: pagination?.total ?? contributions.length,
        },
        {
            key: 'approved',
            label: 'Approved',
            count: approvedCount,
        },
        {
            key: 'pending',
            label: 'Pending',
            count: pendingCount,
        },
        {
            key: 'rejected',
            label: 'Rejected',
            count: rejectedCount,
        },
    ] as const;
    const resourceTypeFilters = [
        {
            key: 'all',
            label: 'All Types',
            count: pagination?.total ?? contributions.length,
        },
        ...resourceTypeCounts.map((resourceType) => ({
            key: resourceType.name,
            label: resourceType.name,
            count: resourceType.count,
        })),
    ];

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="My Contributions - From Quran" />
                <div className="flex flex-1 flex-col bg-[#fafaf8]">
                    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-4 py-10 sm:px-6">
                        <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
                        <p className="text-sm text-slate-500">
                            Loading contributions...
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Contributions - From Quran" />
            <div className="flex flex-1 flex-col bg-[#fafaf8]">
                <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
                    <section className="border-b border-slate-200 pb-5">
                        <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                            My Contributions
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                            Submitted resources
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                            A simple record of what you have shared, how it is
                            categorized, and where it stands in review.
                        </p>
                    </section>

                    {errors.general && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errors.general}
                        </div>
                    )}

                    {pagination && pagination.total > 0 && (
                        <>
                            <section className="grid grid-cols-3 gap-2">
                                <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-none">
                                    <CardContent className="px-3 py-3 sm:px-4 sm:py-3.5">
                                        <p className="text-[11px] tracking-[0.16em] text-slate-400 uppercase">
                                            Total
                                        </p>
                                        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                                            {pagination.total}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-none">
                                    <CardContent className="px-3 py-3 sm:px-4 sm:py-3.5">
                                        <p className="text-[11px] tracking-[0.16em] text-slate-400 uppercase">
                                            Pending
                                        </p>
                                        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                                            {pendingCount}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-none">
                                    <CardContent className="px-3 py-3 sm:px-4 sm:py-3.5">
                                        <p className="text-[11px] tracking-[0.16em] text-slate-400 uppercase">
                                            Approved
                                        </p>
                                        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                                            {approvedCount}
                                        </p>
                                    </CardContent>
                                </Card>
                            </section>

                            <section>
                                <div className="flex flex-wrap gap-2">
                                    {filterItems.map((item) => (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() =>
                                                setActiveStatus(
                                                    item.key as
                                                        | 'all'
                                                        | Contribution['status'],
                                                )
                                            }
                                            className={
                                                activeStatus === item.key
                                                    ? 'rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white'
                                                    : 'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-950'
                                            }
                                        >
                                            {item.label} ({item.count})
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 flex flex-nowrap gap-2 overflow-x-auto pb-1">
                                    {resourceTypeFilters.map((resourceType) => (
                                        <button
                                            key={resourceType.key}
                                            type="button"
                                            onClick={() =>
                                                setActiveResourceType(
                                                    resourceType.key,
                                                )
                                            }
                                            className={
                                                activeResourceType ===
                                                resourceType.key
                                                    ? 'rounded-full border border-stone-300 bg-stone-100 px-3 py-1.5 text-xs font-medium text-slate-900'
                                                    : 'rounded-full border border-transparent bg-transparent px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-900'
                                            }
                                        >
                                            {resourceType.label} (
                                            {resourceType.count})
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {contributions.length === 0 ? (
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                            <CardContent className="py-16 text-center">
                                <FileUp className="mx-auto h-12 w-12 text-slate-300" />
                                <h2 className="mt-4 text-xl font-semibold text-slate-950">
                                    No contributions yet
                                </h2>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                                    Start contributing by submitting resources
                                    while reading the Quran.
                                </p>
                                <Button
                                    onClick={() => router.visit('/')}
                                    className="mt-6 rounded-full px-5"
                                >
                                    Browse Quran
                                </Button>
                            </CardContent>
                        </Card>
                    ) : filteredContributions.length === 0 ? (
                        <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                            <CardContent className="py-14 text-center">
                                <h2 className="text-xl font-semibold text-slate-950">
                                    No matching contributions
                                </h2>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                                    Try a different status or resource type
                                    filter.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <section className="border-t border-slate-200">
                                {filteredContributions.map((contribution) => (
                                    <article
                                        key={contribution.id}
                                        className="grid gap-4 border-b border-slate-200 py-5 md:grid-cols-[140px_minmax(0,1fr)_170px] md:gap-6"
                                    >
                                        <div className="min-w-0">
                                            {contribution.verse?.verse_key ? (
                                                <button
                                                    type="button"
                                                    className="font-mono text-sm font-semibold text-slate-950 transition-colors hover:text-slate-600"
                                                    onClick={() => {
                                                        const key =
                                                            contribution.verse
                                                                ?.verse_key;
                                                        if (!key) {
                                                            return;
                                                        }

                                                        const [chStr, vStr] =
                                                            key.split(':');
                                                        const chapterNumber =
                                                            Number(chStr);
                                                        const verseNumber =
                                                            Number(vStr);

                                                        if (
                                                            Number.isFinite(
                                                                chapterNumber,
                                                            ) &&
                                                            Number.isFinite(
                                                                verseNumber,
                                                            )
                                                        ) {
                                                            router.visit(
                                                                `/${chapterNumber}/${verseNumber}`,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {
                                                        contribution.verse
                                                            .verse_key
                                                    }
                                                </button>
                                            ) : (
                                                <p className="font-mono text-sm font-semibold text-slate-950">
                                                    Submission
                                                </p>
                                            )}
                                            <p className="mt-1 text-sm text-slate-500">
                                                {contribution.resource_type
                                                    ?.name || 'N/A'}
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            {(() => {
                                                const preview =
                                                    getResourcePreview(
                                                        contribution,
                                                    );

                                                return (
                                                    <>
                                                        {preview ? (
                                                            <>
                                                                <p className="text-sm font-medium text-slate-900">
                                                                    {
                                                                        preview.title
                                                                    }
                                                                </p>
                                                                <p className="mt-1 text-sm leading-7 text-slate-500">
                                                                    {
                                                                        preview.preview
                                                                    }
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm leading-7 text-slate-400">
                                                                No preview
                                                                available.
                                                            </p>
                                                        )}

                                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                                            <a
                                                                href={
                                                                    contribution.resource_url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 transition-colors hover:text-slate-600"
                                                            >
                                                                Open resource
                                                                <ExternalLink className="h-3.5 w-3.5" />
                                                            </a>
                                                            {preview?.expandable && (
                                                                <Button
                                                                    variant="link"
                                                                    className="h-auto px-0 text-sm font-medium text-slate-600"
                                                                    onClick={() =>
                                                                        setSelectedComment(
                                                                            contribution.comment ||
                                                                                '',
                                                                        )
                                                                    }
                                                                >
                                                                    View details
                                                                    <MoveRight className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <div className="flex flex-row flex-wrap items-start justify-between gap-3 md:flex-col md:items-end">
                                            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                {contribution.status
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    contribution.status.slice(
                                                        1,
                                                    )}
                                            </div>
                                            <div className="space-y-1 text-left text-xs text-slate-400 md:text-right">
                                                <p>
                                                    Submitted{' '}
                                                    {new Date(
                                                        contribution.created_at,
                                                    ).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            timeZone: 'UTC',
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        },
                                                    )}
                                                </p>
                                                {contribution.status !==
                                                    'pending' && (
                                                    <p>
                                                        Updated{' '}
                                                        {new Date(
                                                            contribution.updated_at,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                timeZone: 'UTC',
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            },
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </section>

                            {pagination && pagination.last_page > 1 && (
                                <section className="flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-sm text-slate-500">
                                        Showing {pagination.from} to{' '}
                                        {pagination.to} of {pagination.total}{' '}
                                        contributions
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {getVisiblePages().map(
                                            (page, index, pages) => {
                                                const previousPage =
                                                    pages[index - 1];
                                                const shouldShowGap =
                                                    previousPage !==
                                                        undefined &&
                                                    page - previousPage > 1;

                                                return (
                                                    <div
                                                        key={page}
                                                        className="flex items-center gap-2"
                                                    >
                                                        {shouldShowGap && (
                                                            <span className="px-1 text-sm text-slate-400">
                                                                ...
                                                            </span>
                                                        )}
                                                        <Button
                                                            variant={
                                                                page ===
                                                                pagination.current_page
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                loadContributions(
                                                                    page,
                                                                )
                                                            }
                                                            className="min-w-10 rounded-full shadow-none"
                                                        >
                                                            {page}
                                                        </Button>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                </section>
                            )}
                        </>
                    )}

                    <Dialog
                        open={!!selectedComment}
                        onOpenChange={(open) =>
                            !open && setSelectedComment(null)
                        }
                    >
                        <DialogContent className="max-w-3xl rounded-3xl border-slate-200">
                            <DialogHeader>
                                <DialogTitle>Full Description</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[50vh] overflow-y-auto">
                                <div
                                    className="text-sm leading-7 whitespace-pre-wrap text-slate-700"
                                    dangerouslySetInnerHTML={{
                                        __html: selectedComment || '',
                                    }}
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    className="rounded-full"
                                    onClick={() => setSelectedComment(null)}
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </AppLayout>
    );
}
