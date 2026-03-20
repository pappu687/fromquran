import { CollectionTagList } from '@/components/collections/collection-tag-list';
import { type CollectionTag } from '@/types/collections';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ChevronRight,
    Folder,
    FolderPlus,
    Globe,
    Lock,
    Loader2,
} from 'lucide-react';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PublicLayout from '@/layouts/public-layout';

interface Collection {
    id: number;
    name: string;
    description?: string;
    color: string;
    is_public: boolean;
    status: 'pending' | 'approved' | 'rejected';
    verses_count: number;
    slug: string;
    created_at: string;
    tags: CollectionTag[];
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function truncateDescription(description?: string, maxLength: number = 120) {
    if (!description) return null;
    if (description.length <= maxLength) return description;

    return `${description.slice(0, maxLength).trimEnd()}...`;
}

export default function CollectionsPage() {
    const page = usePage();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [availableTags, setAvailableTags] = useState<CollectionTag[]>([]);
    const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const queryString = page.url.split('?')[1] ?? '';
        const params = new URLSearchParams(queryString);
        const urlTags = params.getAll('tags[]');
        setSelectedTagSlugs(urlTags);
    }, [page.url]);

    useEffect(() => {
        loadAvailableTags();
    }, []);

    useEffect(() => {
        loadCollections(selectedTagSlugs);
    }, [selectedTagSlugs]);

    const loadCollections = async (tagSlugs: string[] = []) => {
        setIsLoading(true);
        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const params = new URLSearchParams();
            tagSlugs.forEach((slug) => params.append('tags[]', slug));

            const response = await fetch(
                `/api/collections/public?${params.toString()}`,
                {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                },
            );

            if (response.status === 401) {
                router.visit('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load collections');
            }

            const data = await response.json();
            setCollections(data);
        } catch (error) {
            console.error('Failed to load collections:', error);
            setErrors({
                general: 'Failed to load collections. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const loadAvailableTags = async () => {
        try {
            const response = await fetch('/api/tags', {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to load tags');
            }

            const data = (await response.json()) as CollectionTag[];
            setAvailableTags(data);
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    };

    const toggleTagFilter = (slug: string) => {
        setSelectedTagSlugs((prev) =>
            prev.includes(slug)
                ? prev.filter((item) => item !== slug)
                : [...prev, slug],
        );
    };

    const handleViewCollection = (slug: string) => {
        router.visit(`/collections/${slug}`);
    };

    if (isLoading) {
        return (
            <PublicLayout>
                <Head title="Public Collections - From Quran" />
                <section className="border-b border-slate-200 bg-[#fafaf8]">
                    <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-16 sm:px-6">
                        <div className="rounded-[2rem] bg-white px-8 py-10 text-center ring-1 ring-slate-200">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
                            <p className="mt-4 text-sm text-slate-500">
                                Loading public collections...
                            </p>
                        </div>
                    </div>
                </section>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <Head title="Public Collections - From Quran" />

            <section className="border-b border-slate-200 bg-[#fafaf8]">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                        <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                            Public Collections
                        </p>
                        <h1 className="font-young mt-3 text-[2.3rem] leading-[0.98] tracking-[-0.05em] text-slate-950 sm:text-[3.25rem]">
                            Community-curated verse sets.
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                            Browse how others organize ayat into themes for
                            reflection, teaching, memorization, and study.
                        </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                onClick={() => router.visit('/my-collections')}
                                className="h-11 rounded-full px-5"
                            >
                                <Folder className="h-4 w-4" />
                                My Collections
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:max-w-md sm:grid-cols-2">
                            <div className="rounded-3xl bg-white px-4 py-4 ring-1 ring-slate-200">
                                <div className="text-2xl font-semibold tracking-tight text-slate-950">
                                    {collections.length}
                                </div>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    public collections available
                                </p>
                            </div>
                            <div className="rounded-3xl bg-white px-4 py-4 ring-1 ring-slate-200">
                                <div className="text-2xl font-semibold tracking-tight text-slate-950">
                                    {collections.reduce(
                                        (sum, collection) =>
                                            sum + collection.verses_count,
                                        0,
                                    )}
                                </div>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    verses gathered across lists
                                </p>
                            </div>
                    </div>

                    {availableTags.length > 0 && (
                        <div className="mt-6 flex flex-wrap items-center gap-2">
                            <p className="mr-2 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                                Filter by tag
                            </p>
                            {availableTags.map((tag) => {
                                const isSelected = selectedTagSlugs.includes(
                                    tag.slug,
                                );

                                return (
                                    <button
                                        key={`${tag.type}-${tag.slug}`}
                                        type="button"
                                        onClick={() =>
                                            toggleTagFilter(tag.slug)
                                        }
                                        className={
                                            isSelected
                                                ? 'rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-medium text-white'
                                                : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-slate-300'
                                        }
                                    >
                                        {tag.name}
                                    </button>
                                );
                            })}
                            {selectedTagSlugs.length > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full px-3 text-slate-500"
                                    onClick={() => setSelectedTagSlugs([])}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-[#fafaf8] py-10 sm:py-12 lg:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    {errors.general && (
                        <div className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                            {errors.general}
                        </div>
                    )}

                    {collections.length === 0 ? (
                        <Card className="rounded-[2rem] border-0 bg-white text-center shadow-none ring-1 ring-slate-200">
                            <CardContent className="py-16">
                                <Globe className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                                <h2 className="mb-2 text-xl font-semibold text-slate-950">
                                    No public collections yet
                                </h2>
                                <p className="mx-auto mb-6 max-w-md text-slate-500">
                                    Be the first to share a collection with the
                                    community.
                                </p>
                                <Button
                                    onClick={() =>
                                        router.visit('/my-collections')
                                    }
                                    className="rounded-full px-6"
                                >
                                    <FolderPlus className="mr-2 h-4 w-4" />
                                    Create a Collection
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {collections.map((collection) => {
                                const shortDescription = truncateDescription(
                                    collection.description,
                                    132,
                                );

                                return (
                                    <Card
                                        key={collection.id}
                                        className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border-0 bg-white shadow-none ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:ring-slate-300"
                                    >
                                        <div
                                            className="absolute inset-x-0 top-0 h-1.5"
                                            style={{
                                                backgroundColor:
                                                    collection.color,
                                            }}
                                        />

                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="h-3 w-3 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    collection.color,
                                                            }}
                                                        />
                                                        <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                                                            Collection
                                                        </p>
                                                    </div>
                                                    <h3 className="mt-3 line-clamp-2 text-xl font-semibold tracking-tight text-slate-950">
                                                        {collection.name}
                                                    </h3>
                                                </div>

                                                <Badge
                                                    variant="secondary"
                                                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 text-slate-700"
                                                >
                                                    {collection.is_public ? (
                                                        <Globe className="mr-1 h-3 w-3" />
                                                    ) : (
                                                        <Lock className="mr-1 h-3 w-3" />
                                                    )}
                                                    {collection.is_public
                                                        ? 'Public'
                                                        : 'Private'}
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex flex-1 flex-col pt-0">
                                            <div className="min-h-[4.5rem] text-sm leading-7 text-slate-500">
                                                {shortDescription ? (
                                                    <p>{shortDescription}</p>
                                                ) : (
                                                    <p className="italic text-slate-400">
                                                        No description
                                                        provided.
                                                    </p>
                                                )}
                                            </div>

                                            <CollectionTagList
                                                tags={collection.tags}
                                                className="mt-4"
                                                getHref={(tag) =>
                                                    `/collections?tags[]=${encodeURIComponent(tag.slug)}`
                                                }
                                            />

                                            <div className="mt-6 grid grid-cols-2 gap-3">
                                                <div className="rounded-2xl bg-stone-50 px-4 py-3">
                                                    <p className="text-xl font-semibold tracking-tight text-slate-950">
                                                        {collection.verses_count}
                                                    </p>
                                                    <p className="mt-1 text-xs tracking-[0.14em] text-slate-400 uppercase">
                                                        Verses
                                                    </p>
                                                </div>
                                                <div className="rounded-2xl bg-stone-50 px-4 py-3">
                                                    <p className="text-sm font-semibold text-slate-950">
                                                        {formatDate(
                                                            collection.created_at,
                                                        )}
                                                    </p>
                                                    <p className="mt-1 text-xs tracking-[0.14em] text-slate-400 uppercase">
                                                        Added
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="pt-0">
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    handleViewCollection(
                                                        collection.slug,
                                                    )
                                                }
                                                className="h-11 w-full justify-between rounded-full border-slate-200 bg-white px-5 text-sm font-medium shadow-none"
                                            >
                                                <span>View Collection</span>
                                                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}
