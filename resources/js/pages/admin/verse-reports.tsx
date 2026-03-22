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
import { Check, Search, X } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Verse {
    id: number;
    verse_key: string;
    verse_number: number;
    chapter_id: number;
}

interface Chapter {
    id: number;
    chapter_number: number;
    name_simple: string;
    name_arabic: string;
}

interface Report {
    id: number;
    user: User;
    verse: Verse | null;
    chapter: Chapter | null;
    chapter_id: number;
    verse_id: number;
    type: string;
    description: string;
    status: 'pending' | 'resolved' | 'dismissed';
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
    resolved: number;
    dismissed: number;
}

interface Props {
    reports: {
        data: Report[];
        links: PaginationLink[];
        total: number;
    };
    stats: Stats;
    typeOptions: string[];
    filters: {
        status: string;
        type: string;
        search: string;
    };
}

export default function VerseReports({
    reports,
    stats,
    typeOptions,
    filters,
}: Props) {
    const [searchInput, setSearchInput] = useState(filters.search);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFilter = (key: string, value: string) => {
        router.get(
            '/admin/verse-reports',
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        handleFilter('search', searchInput);
    };

    const updateStatus = (id: number, action: 'resolve' | 'dismiss') => {
        setIsProcessing(true);
        router.post(
            `/admin/verse-reports/${id}/${action}`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsProcessing(false),
            },
        );
    };

    const getStatusBadge = (status: Report['status']) => {
        const classes = {
            pending:
                'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
            resolved:
                'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
            dismissed:
                'border-slate-400/20 bg-slate-400/10 text-slate-700 dark:text-slate-300',
        };

        return (
            <Badge variant="outline" className={classes[status]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <>
            <Head title="Verse Reports - Admin - From Quran" />
            <AdminLayout title="Verse Reports">
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.2)_100%)] px-5 py-6 shadow-sm shadow-black/[0.03] md:px-7 md:py-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl space-y-2">
                                <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                                    Verse reports
                                </h1>
                                <p className="text-sm leading-6 text-muted-foreground md:text-base">
                                    Review Quran verse error reports submitted
                                    by users and keep the correction queue
                                    organized.
                                </p>
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
                                        {stats.resolved}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Resolved
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-400/20 bg-slate-400/10 px-4 py-3">
                                    <p className="text-xl font-semibold text-slate-700 md:text-2xl dark:text-slate-300">
                                        {stats.dismissed}
                                    </p>
                                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                                        Dismissed
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
                                            placeholder="Search by verse, chapter, user, or text..."
                                            value={searchInput}
                                            onChange={(event) =>
                                                setSearchInput(event.target.value)
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
                                            <SelectItem value="resolved">
                                                Resolved
                                            </SelectItem>
                                            <SelectItem value="dismissed">
                                                Dismissed
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={filters.type}
                                        onValueChange={(value) =>
                                            handleFilter('type', value)
                                        }
                                    >
                                        <SelectTrigger className="h-11 w-full rounded-lg border-border/70 bg-background sm:w-[220px]">
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Types
                                            </SelectItem>
                                            {typeOptions.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type.replace(/_/g, ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border/70 text-sm">
                                <thead className="bg-muted/30">
                                    <tr className="text-left text-xs tracking-[0.14em] text-muted-foreground uppercase">
                                        <th className="px-5 py-3 md:px-7">Report</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">User</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Submitted</th>
                                        <th className="px-5 py-3 text-right md:px-7">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {reports.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-5 py-12 text-center text-muted-foreground md:px-7"
                                            >
                                                No verse reports found for the
                                                current filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        reports.data.map((report) => (
                                            <tr key={report.id} className="align-top">
                                                <td className="px-5 py-4 md:px-7">
                                                    <div className="space-y-2">
                                                        <div className="font-medium text-foreground">
                                                            {report.verse?.verse_key ??
                                                                `${report.chapter?.chapter_number}:${report.verse?.verse_number ?? report.verse_id}`}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {report.chapter
                                                                ? `${report.chapter.chapter_number}. ${report.chapter.name_simple} (${report.chapter.name_arabic})`
                                                                : `Chapter ID ${report.chapter_id}`}
                                                        </div>
                                                        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                                            {report.description}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-muted-foreground">
                                                    {report.type.replace(/_/g, ' ')}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-foreground">
                                                            {report.user?.name ?? 'Unknown'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {report.user?.email ?? 'No email'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {getStatusBadge(report.status)}
                                                </td>
                                                <td className="px-5 py-4 text-muted-foreground">
                                                    {new Date(
                                                        report.created_at,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-4 md:px-7">
                                                    <div className="flex justify-end gap-2">
                                                        {report.status !==
                                                            'resolved' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={isProcessing}
                                                                className="h-8 rounded-lg border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                                                                onClick={() =>
                                                                    updateStatus(
                                                                        report.id,
                                                                        'resolve',
                                                                    )
                                                                }
                                                            >
                                                                <Check className="h-4 w-4" />
                                                                Resolve
                                                            </Button>
                                                        )}
                                                        {report.status !==
                                                            'dismissed' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={isProcessing}
                                                                className="h-8 rounded-lg border-slate-300/80 text-slate-700 hover:bg-slate-100"
                                                                onClick={() =>
                                                                    updateStatus(
                                                                        report.id,
                                                                        'dismiss',
                                                                    )
                                                                }
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Dismiss
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {reports.links.length > 3 && (
                            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border/70 px-5 py-4 md:px-7">
                                {reports.links.map((link, index) => (
                                    <Button
                                        key={`${link.label}-${index}`}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        asChild={Boolean(link.url)}
                                        className="rounded-lg"
                                    >
                                        {link.url ? (
                                            <Link
                                                href={link.url}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ) : (
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}
