import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    Bookmark,
    FolderOpen,
    Heart,
    Loader2,
    LucideIcon,
    NotebookPen,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface CollectionSummary {
    id: number;
    name: string;
    slug: string;
    verses_count: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

interface BookmarkSummary {
    id: number;
    created_at: string;
    verse: {
        verse_number: number;
        text_uthmani: string;
        translation?: string;
    };
    chapter: {
        chapter_number: number;
        name_simple: string;
        name_roman?: string;
        name_arabic: string;
    };
}

interface ContributionSummary {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    resource_url: string;
    comment?: string | null;
    created_at: string;
    verse?: {
        verse_key?: string;
    } | null;
}

interface BookmarkResponse {
    data: BookmarkSummary[];
    count: number;
}

interface ContributionResponse {
    data: ContributionSummary[];
    total: number;
}

interface DashboardData {
    collections: CollectionSummary[];
    collectionsCount: number;
    bookmarks: BookmarkSummary[];
    bookmarksCount: number;
    contributions: ContributionSummary[];
    contributionsCount: number;
}

interface SectionCardProps {
    title: string;
    description: string;
    count: number;
    icon: LucideIcon;
    accentClassName: string;
    viewAllHref: string;
    onOpen: () => void;
    children: React.ReactNode;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const initialDashboardData: DashboardData = {
    collections: [],
    collectionsCount: 0,
    bookmarks: [],
    bookmarksCount: 0,
    contributions: [],
    contributionsCount: 0,
};

function DashboardSectionCard({
    title,
    description,
    count,
    icon: Icon,
    accentClassName,
    viewAllHref,
    onOpen,
    children,
}: SectionCardProps) {
    return (
        <Card
            className="group flex h-full cursor-pointer flex-col border-border/60 bg-card/80 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            onClick={onOpen}
        >
            <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentClassName}`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
                <div className="flex items-end justify-between gap-4 border-t border-border/70 pt-4">
                    <div>
                        <div className="text-3xl font-semibold tracking-tight">
                            {count}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Total items
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={(event) => {
                            event.stopPropagation();
                            router.visit(viewAllHref);
                        }}
                    >
                        View all
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pt-0">{children}</CardContent>
            <CardFooter className="pt-0">
                <div className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground/80">
                    Open {title.toLowerCase()}
                </div>
            </CardFooter>
        </Card>
    );
}

export default function DashboardPage() {
    const [dashboardData, setDashboardData] =
        useState<DashboardData>(initialDashboardData);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const loadDashboard = async () => {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const csrfToken = document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content');

                const headers = {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                };

                const [
                    collectionsResponse,
                    bookmarksResponse,
                    contributionsResponse,
                ] = await Promise.all([
                    fetch('/api/collections', {
                        headers,
                        credentials: 'include',
                    }),
                    fetch('/api/bookmarks', {
                        headers,
                        credentials: 'include',
                    }),
                    fetch('/user-resources', {
                        headers,
                        credentials: 'include',
                    }),
                ]);

                const responses = [
                    collectionsResponse,
                    bookmarksResponse,
                    contributionsResponse,
                ];

                if (responses.some((response) => response.status === 401)) {
                    router.visit('/login');
                    return;
                }

                if (responses.some((response) => !response.ok)) {
                    throw new Error('Failed to load dashboard');
                }

                const collections =
                    (await collectionsResponse.json()) as CollectionSummary[];
                const bookmarksPayload =
                    (await bookmarksResponse.json()) as BookmarkResponse;
                const contributionsPayload =
                    (await contributionsResponse.json()) as ContributionResponse;

                setDashboardData({
                    collections: collections.slice(0, 5),
                    collectionsCount: collections.length,
                    bookmarks: (bookmarksPayload.data || []).slice(0, 5),
                    bookmarksCount: bookmarksPayload.count || 0,
                    contributions: (contributionsPayload.data || []).slice(
                        0,
                        5,
                    ),
                    contributionsCount: contributionsPayload.total || 0,
                });
            } catch (error) {
                console.error('Failed to load dashboard:', error);
                setErrorMessage(
                    'Dashboard data could not be loaded right now. Please try again.',
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const openCollection = (slug: string) => {
        router.visit(`/my-collections/${slug}`);
    };

    const openBookmark = (bookmark: BookmarkSummary) => {
        router.visit(
            `/${bookmark.chapter.chapter_number}/${bookmark.verse.verse_number}`,
        );
    };

    const openContribution = (contribution: ContributionSummary) => {
        const verseKey = contribution.verse?.verse_key;

        if (!verseKey) {
            router.visit('/my-contributions');
            return;
        }

        const [chapterNumber, verseNumber] = verseKey.split(':');

        if (!chapterNumber || !verseNumber) {
            router.visit('/my-contributions');
            return;
        }

        router.visit(`/${chapterNumber}/${verseNumber}`);
    };

    const renderCollectionItems = () => {
        if (dashboardData.collections.length === 0) {
            return (
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
                    No collections yet. Start saving verses to organize your
                    study.
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {dashboardData.collections.map((collection) => (
                    <button
                        key={collection.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                        onClick={(event) => {
                            event.stopPropagation();
                            openCollection(collection.slug);
                        }}
                    >
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                                {collection.name}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {collection.verses_count} verses
                            </p>
                        </div>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground capitalize">
                            {collection.status}
                        </span>
                    </button>
                ))}
            </div>
        );
    };

    const renderBookmarkItems = () => {
        if (dashboardData.bookmarks.length === 0) {
            return (
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
                    No favorites yet. Bookmark verses while reading to see them
                    here.
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {dashboardData.bookmarks.map((bookmark) => (
                    <button
                        key={bookmark.id}
                        type="button"
                        className="flex w-full items-start gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                        onClick={(event) => {
                            event.stopPropagation();
                            openBookmark(bookmark);
                        }}
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-xs font-semibold text-rose-700">
                            {bookmark.verse.verse_number}
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                                {bookmark.chapter.name_roman ||
                                    bookmark.chapter.name_simple}
                            </div>
                            <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                                {bookmark.verse.translation ||
                                    bookmark.verse.text_uthmani}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    const renderContributionItems = () => {
        if (dashboardData.contributions.length === 0) {
            return (
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
                    No contributions yet. Submit resources while reading and
                    track them here.
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {dashboardData.contributions.map((contribution) => (
                    <button
                        key={contribution.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                        onClick={(event) => {
                            event.stopPropagation();
                            openContribution(contribution);
                        }}
                    >
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                                {contribution.verse?.verse_key ||
                                    'Contribution'}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                                {contribution.comment?.trim() ||
                                    contribution.resource_url}
                            </p>
                        </div>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground capitalize">
                            {contribution.status}
                        </span>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - From Quran" />
            <div className="flex flex-1 flex-col bg-gradient-to-b from-background to-muted/20">
                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            Dashboard
                        </h1>
                        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                            Quick access to your collections, recent
                            contributions, and favorite verses.
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {errorMessage}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="grid gap-4 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Card key={index} className="min-h-[320px]">
                                    <CardContent className="flex h-full items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-3">
                            <DashboardSectionCard
                                title="Collections"
                                description="Your saved verse groups"
                                count={dashboardData.collectionsCount}
                                icon={FolderOpen}
                                accentClassName="bg-blue-100 text-blue-700"
                                viewAllHref="/my-collections"
                                onOpen={() => router.visit('/my-collections')}
                            >
                                {renderCollectionItems()}
                            </DashboardSectionCard>

                            <DashboardSectionCard
                                title="Favorites"
                                description="Recently bookmarked verses"
                                count={dashboardData.bookmarksCount}
                                icon={Heart}
                                accentClassName="bg-rose-100 text-rose-700"
                                viewAllHref="/favorites"
                                onOpen={() => router.visit('/favorites')}
                            >
                                {renderBookmarkItems()}
                            </DashboardSectionCard>

                            <DashboardSectionCard
                                title="Contributions"
                                description="Your submitted resources"
                                count={dashboardData.contributionsCount}
                                icon={NotebookPen}
                                accentClassName="bg-amber-100 text-amber-700"
                                viewAllHref="/my-contributions"
                                onOpen={() => router.visit('/my-contributions')}
                            >
                                {renderContributionItems()}
                            </DashboardSectionCard>
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-3">
                        <Button
                            variant="outline"
                            className="justify-between"
                            onClick={() => router.visit('/my-collections')}
                        >
                            <span className="flex items-center gap-2">
                                <FolderOpen className="h-4 w-4" />
                                Manage collections
                            </span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-between"
                            onClick={() => router.visit('/favorites')}
                        >
                            <span className="flex items-center gap-2">
                                <Bookmark className="h-4 w-4" />
                                Open favorites
                            </span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-between"
                            onClick={() => router.visit('/my-contributions')}
                        >
                            <span className="flex items-center gap-2">
                                <NotebookPen className="h-4 w-4" />
                                Review contributions
                            </span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
