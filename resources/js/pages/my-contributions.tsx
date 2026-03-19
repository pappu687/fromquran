import { Badge } from '@/components/ui/badge';
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
import {
    CheckCircle2,
    Clock,
    ExternalLink,
    FileUp,
    Loader2,
    XCircle,
} from 'lucide-react';
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
        href: '/contributions',
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

    const getStatusBadge = (status: Contribution['status']) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="rounded-full bg-emerald-600 px-2.5 py-1 text-white hover:bg-emerald-700">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Approved
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge
                        variant="destructive"
                        className="rounded-full px-2.5 py-1"
                    >
                        <XCircle className="mr-1 h-3 w-3" />
                        Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge
                        variant="secondary"
                        className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700"
                    >
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                );
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
                <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
                    <section className="border-b border-slate-200 pb-6">
                        <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                            My Contributions
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                            Submitted resources
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
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
                            <section className="grid grid-cols-3 gap-2 sm:gap-3">
                                <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                                    <CardContent className="px-3 py-2.5 sm:px-5 sm:py-5">
                                        <p className="text-xs text-slate-500 sm:text-sm">
                                            Total
                                        </p>
                                        <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
                                            {pagination.total}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                                    <CardContent className="px-3 py-2.5 sm:px-5 sm:py-5">
                                        <p className="text-xs text-slate-500 sm:text-sm">
                                            Pending
                                        </p>
                                        <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
                                            {pendingCount}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-3xl border-slate-200 bg-white shadow-none">
                                    <CardContent className="px-3 py-2.5 sm:px-5 sm:py-5">
                                        <p className="text-xs text-slate-500 sm:text-sm">
                                            Approved
                                        </p>
                                        <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
                                            {approvedCount}
                                        </p>
                                    </CardContent>
                                </Card>
                            </section>

                            <section>
                                <div className="flex flex-wrap gap-2">
                                    {resourceTypeCounts.map((resourceType) => (
                                        <Badge
                                            key={resourceType.name}
                                            variant="secondary"
                                            className="rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-none"
                                        >
                                            {resourceType.name}:
                                            {resourceType.count}
                                        </Badge>
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
                    ) : (
                        <>
                            <section className="divide-y divide-slate-200 border-t border-slate-200">
                                {contributions.map((contribution) => (
                                    <article
                                        key={contribution.id}
                                        className="py-5 first:pt-0"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {contribution.verse && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 rounded-full border-slate-200 bg-white px-3 font-mono text-xs text-slate-700 shadow-none"
                                                            onClick={() => {
                                                                const key =
                                                                    contribution
                                                                        .verse
                                                                        ?.verse_key;
                                                                if (!key) {
                                                                    return;
                                                                }

                                                                const [
                                                                    chStr,
                                                                    vStr,
                                                                ] =
                                                                    key.split(
                                                                        ':',
                                                                    );
                                                                const chapterNumber =
                                                                    Number(
                                                                        chStr,
                                                                    );
                                                                const verseNumber =
                                                                    Number(
                                                                        vStr,
                                                                    );

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
                                                                contribution
                                                                    .verse
                                                                    .verse_key
                                                            }
                                                        </Button>
                                                    )}
                                                    <Badge
                                                        variant="secondary"
                                                        className="rounded-full bg-stone-100 px-2.5 py-1 text-slate-600"
                                                    >
                                                        {contribution
                                                            .resource_type
                                                            ?.name || 'N/A'}
                                                    </Badge>
                                                    {getStatusBadge(
                                                        contribution.status,
                                                    )}
                                                </div>

                                                <a
                                                    href={
                                                        contribution.resource_url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-3 inline-flex max-w-full items-center gap-2 text-sm font-medium text-slate-900 hover:text-slate-600"
                                                >
                                                    <span className="truncate">
                                                        {
                                                            contribution.resource_url
                                                        }
                                                    </span>
                                                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                                </a>

                                                {contribution.comment && (
                                                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                                                        {(() => {
                                                            const {
                                                                text,
                                                                isTruncated,
                                                            } = truncateWords(
                                                                contribution.comment,
                                                                20,
                                                            );

                                                            return (
                                                                <>
                                                                    {text}
                                                                    {isTruncated && (
                                                                        <Button
                                                                            variant="link"
                                                                            className="h-auto px-1.5 font-medium text-slate-900"
                                                                            onClick={() =>
                                                                                setSelectedComment(
                                                                                    contribution.comment ||
                                                                                        '',
                                                                                )
                                                                            }
                                                                        >
                                                                            See
                                                                            more
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-slate-400 sm:flex-col sm:items-end">
                                                <span>
                                                    Submitted{' '}
                                                    {new Date(
                                                        contribution.created_at,
                                                    ).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        },
                                                    )}
                                                </span>
                                                {contribution.status !==
                                                    'pending' && (
                                                    <span>
                                                        Updated{' '}
                                                        {new Date(
                                                            contribution.updated_at,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            },
                                                        )}
                                                    </span>
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
