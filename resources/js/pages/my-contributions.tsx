import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    FileUp,
    Loader2,
    CheckCircle2,
    Clock,
    XCircle,
    ExternalLink,
} from 'lucide-react';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Contribution {
    id: number;
    verse_id: number;
    resource_type: string;
    resource_url: string;
    comment?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    verse?: {
        id: number;
        verse_key: string;
        chapter_id: number;
    };
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    data: Contribution[];
}

export default function ContributionsPage() {
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [pagination, setPagination] = useState<Omit<PaginationData, 'data'> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

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

    const getResourceTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            'video': 'Video',
            'audio': 'Audio',
            'article': 'Article',
            'tafsir': 'Tafsir',
            'translation': 'Translation',
            'other': 'Other',
        };
        return types[type] || type;
    };

    if (isLoading) {
        return (
            <AppLayout>
                <Head title="My Contributions - From Quran" />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="My Contributions - From Quran" />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <FileUp className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">My Contributions</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Track your resource submissions and their approval status
                    </p>
                </div>

                {errors.general && (
                    <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                        {errors.general}
                    </div>
                )}

                {/* Stats */}
                {pagination && pagination.total > 0 && (
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total</p>
                                        <p className="text-2xl font-bold">{pagination.total}</p>
                                    </div>
                                    <FileUp className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pending</p>
                                        <p className="text-2xl font-bold">
                                            {contributions.filter(c => c.status === 'pending').length}
                                        </p>
                                    </div>
                                    <Clock className="h-8 w-8 text-yellow-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Approved</p>
                                        <p className="text-2xl font-bold">
                                            {contributions.filter(c => c.status === 'approved').length}
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
                                Start contributing by submitting resources while reading the Quran
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
                                <Card
                                    key={contribution.id}
                                    className="hover:shadow-md transition-all"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {contribution.verse && (
                                                        <Badge variant="outline" className="font-mono text-xs">
                                                            {contribution.verse.verse_key}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="secondary">
                                                        {getResourceTypeLabel(contribution.resource_type)}
                                                    </Badge>
                                                    {getStatusBadge(contribution.status)}
                                                </div>

                                                <a
                                                    href={contribution.resource_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline flex items-center gap-1 mb-2"
                                                >
                                                    {contribution.resource_url}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>

                                                {contribution.comment && (
                                                    <div className="mt-2 p-3 bg-muted/50 rounded-md">
                                                        <p className="text-sm">
                                                            {contribution.comment}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4 mt-3">
                                                    <span className="text-xs text-muted-foreground">
                                                        Submitted {new Date(contribution.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </span>
                                                    {contribution.status !== 'pending' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Updated {new Date(contribution.updated_at).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                            })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <p className="text-sm text-muted-foreground">
                                    Showing {pagination.from} to {pagination.to} of {pagination.total} contributions
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => loadContributions(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => loadContributions(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
