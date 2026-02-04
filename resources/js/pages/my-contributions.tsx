import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from '@/components/ui/item';
import { Badge } from '@/components/ui/badge';
import {
    FileUp,
    Loader2,
    CheckCircle2,
    Clock,
    XCircle,
    ExternalLink,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// ... (existing helper function code)

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Contributions',
        href: '/contributions',
    },
];

export default function ContributionsPage() {
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [pagination, setPagination] = useState<Omit<PaginationData, 'data'> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedComment, setSelectedComment] = useState<string | null>(null);

    const truncateWords = (str: string, numWords: number) => {
        const words = str.split(' ');
        if (words.length > numWords) {
            return {
                text: words.slice(0, numWords).join(' ') + '...',
                isTruncated: true,
            };
        }
        return { text: str, isTruncated: false };
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
            setPagination({
                current_page: data.current_page,
                last_page: data.last_page,
                per_page: data.per_page,
                total: data.total,
                from: data.from,
                to: data.to,
            });
        } catch (error) {
            console.error('Failed to load contributions:', error);
            setErrors({
                general: 'Failed to load contributions. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Approved
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                );
        }
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="My Contributions - From Quran" />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Contributions - From Quran" />
            <div className="container mx-auto px-4 py-8">
                {errors.general && (
                    <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                        {errors.general}
                    </div>
                )}

                {/* Stats */}
                {pagination && pagination.total > 0 && (
                    <div className="mb-6 grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Total
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {pagination.total}
                                        </p>
                                    </div>
                                    <FileUp className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Pending
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {
                                                contributions.filter(
                                                    (c) =>
                                                        c.status === 'pending',
                                                ).length
                                            }
                                        </p>
                                    </div>
                                    <Clock className="h-8 w-8 text-yellow-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Approved
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {
                                                contributions.filter(
                                                    (c) =>
                                                        c.status === 'approved',
                                                ).length
                                            }
                                        </p>
                                    </div>
                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {contributions.length === 0 ? (
                    <Card className="text-center">
                        <CardContent className="py-16">
                            <FileUp className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                            <h2 className="mb-2 text-xl font-semibold">
                                No contributions yet
                            </h2>
                            <p className="mb-6 text-muted-foreground">
                                Start contributing by submitting resources while
                                reading the Quran
                            </p>
                            <Button onClick={() => router.visit('/')}>
                                Browse Quran
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="space-y-4">
                            {contributions.map((contribution) => (
                                <Item
                                    key={contribution.id}
                                    variant="outline"
                                    className="transition-all hover:shadow-md"
                                >
                                    <ItemContent className="flex flex-col gap-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="mb-2 flex items-center gap-2">
                                                    {contribution.verse && (
                                                        <Badge
                                                            variant="outline"
                                                            className="font-mono text-xs"
                                                        >
                                                            {
                                                                contribution
                                                                    .verse
                                                                    .verse_key
                                                            }
                                                        </Badge>
                                                    )}
                                                    <Badge variant="secondary">
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
                                                    className="mb-2 flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    {contribution.resource_url}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>

                                                {contribution.comment && (
                                                    <div className="mt-2 rounded-md bg-muted/50 p-3">
                                                        <p className="text-sm">
                                                            {(() => {
                                                                const {
                                                                    text,
                                                                    isTruncated,
                                                                } =
                                                                    truncateWords(
                                                                        contribution.comment,
                                                                        20,
                                                                    );
                                                                return (
                                                                    <>
                                                                        {text}
                                                                        {isTruncated && (
                                                                            <Button
                                                                                variant="link"
                                                                                className="h-auto px-1 font-normal text-primary"
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
                                                    </div>
                                                )}

                                                <div className="mt-3 flex items-center gap-4">
                                                    <span className="text-xs text-muted-foreground">
                                                        Submitted{' '}
                                                        {new Date(
                                                            contribution.created_at,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                            },
                                                        )}
                                                    </span>
                                                    {contribution.status !==
                                                        'pending' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Updated{' '}
                                                            {new Date(
                                                                contribution.updated_at,
                                                            ).toLocaleDateString(
                                                                'en-US',
                                                                {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                },
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </ItemContent>
                                </Item>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing {pagination.from} to {pagination.to}{' '}
                                    of {pagination.total} contributions
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            loadContributions(
                                                pagination.current_page - 1,
                                            )
                                        }
                                        disabled={pagination.current_page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            loadContributions(
                                                pagination.current_page + 1,
                                            )
                                        }
                                        disabled={
                                            pagination.current_page ===
                                            pagination.last_page
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <Dialog
                    open={!!selectedComment}
                    onOpenChange={(open) => !open && setSelectedComment(null)}
                >
                    <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Full Description</DialogTitle>
                        </DialogHeader>
                        <DialogDescription className="whitespace-pre-wrap text-foreground">
                            {selectedComment}
                        </DialogDescription>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
