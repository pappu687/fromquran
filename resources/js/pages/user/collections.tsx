import { CollectionTagList } from '@/components/collections/collection-tag-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PublicLayout from '@/layouts/public-layout';
import { api } from '@/lib/api-client';
import { type CollectionTag } from '@/types/collections';
import { Head, router, usePage } from '@inertiajs/react';
import {
    ChevronRight,
    Eye,
    Folder,
    FolderPlus,
    Loader2,
    Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Collection {
    id: number;
    name: string;
    description?: string;
    color: string;
    is_public: boolean;
    status: 'pending' | 'approved' | 'rejected';
    verses_count: number;
    views_count: number;
    slug: string;
    created_at: string;
    tags: CollectionTag[];
}

interface PublicCollectionsPagePayload {
    collections: Collection[];
    tags: CollectionTag[];
}

function parseTagSlugs(url: string): string[] {
    const queryString = url.split('?')[1] ?? '';
    const params = new URLSearchParams(queryString);

    return params.getAll('tags[]');
}

function formatDate(date: string) {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString('en-US', {
        timeZone: 'UTC',
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
    const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>(
        parseTagSlugs(page.url),
    );
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const urlTags = parseTagSlugs(page.url);

        setSelectedTagSlugs((current) =>
            current.join('|') === urlTags.join('|') ? current : urlTags,
        );
    }, [page.url]);

    useEffect(() => {
        loadCollections(selectedTagSlugs);
    }, [selectedTagSlugs]);

    const loadCollections = async (tagSlugs: string[] = []) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            tagSlugs.forEach((slug) => params.append('tags[]', slug));

            const data = await api.get<PublicCollectionsPagePayload>(
                `/api/collections/public-page${params.toString() ? `?${params.toString()}` : ''}`,
            );
            setCollections(data.collections);
            setAvailableTags(data.tags);
            setErrors({});
        } catch (error) {
            console.error('Failed to load collections:', error);
            setErrors({
                general: 'Failed to load collections. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTagFilter = (slug: string) => {
        setSelectedTagSlugs((prev) =>
            prev.includes(slug)
                ? prev.filter((item) => item !== slug)
                : [...prev, slug],
        );
    };

    const clearFilters = () => {
        setSelectedTagSlugs([]);
        setSearchQuery('');
    };

    const handleViewCollection = (slug: string) => {
        router.visit(`/collections/${slug}`);
    };

    const filteredCollections = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return collections.filter((collection) => {
            if (!normalizedSearch) {
                return true;
            }

            const matchesName = collection.name
                .toLowerCase()
                .includes(normalizedSearch);
            const matchesDescription = (collection.description ?? '')
                .toLowerCase()
                .includes(normalizedSearch);
            const matchesTag = collection.tags.some((tag) =>
                tag.name.toLowerCase().includes(normalizedSearch),
            );

            return matchesName || matchesDescription || matchesTag;
        });
    }, [collections, searchQuery]);

    if (isLoading) {
        return (
            <PublicLayout>
                <Head title="Public Collections - From Quran" />
                <div className="flex flex-1 flex-col bg-[#fafaf8]">
                    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-4 px-4 py-10 sm:px-6">
                        <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
                        <p className="text-sm text-slate-500">
                            Loading collections...
                        </p>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <Head title="Public Collections - From Quran" />
            <div className="flex flex-1 flex-col bg-[#f7f4ef]">
                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
                    <section className="relative overflow-hidden border-b border-slate-200 pb-6">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/40 to-transparent" />
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
                                    Collections
                                </p>
                                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                                    Community collections
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                                    Explore collections curated by the
                                    community. Discover themed verses gathered
                                    for reflection, study, and remembrance.
                                </p>
                            </div>
                            <Button
                                onClick={() => router.visit('/')}
                                className="gap-2 self-start rounded-full px-5 sm:self-auto"
                            >
                                <FolderPlus className="h-4 w-4" />
                                Browse Quran
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="mt-5 grid gap-3 border-t border-slate-300/80 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="search"
                                    placeholder="Search collections by title, description, or tag..."
                                    value={searchQuery}
                                    onChange={(event) =>
                                        setSearchQuery(event.target.value)
                                    }
                                    className="h-11 rounded-full border-slate-200 bg-white pr-4 pl-11 shadow-none focus-visible:ring-slate-300"
                                />
                            </div>
                            <div className="text-sm text-slate-500">
                                {filteredCollections.length} collection
                                {filteredCollections.length === 1 ? '' : 's'}
                            </div>
                        </div>
                    </section>

                    {errors.general && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errors.general}
                        </div>
                    )}

                    {availableTags.length > 0 && (
                        <section className="border-y border-slate-300/80 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="mr-2 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                                    Filter by tag
                                </p>
                                {availableTags.map((tag) => {
                                    const isSelected =
                                        selectedTagSlugs.includes(tag.slug);

                                    return (
                                        <button
                                            key={`${tag.type}-${tag.slug}`}
                                            type="button"
                                            onClick={() =>
                                                toggleTagFilter(tag.slug)
                                            }
                                            className={
                                                isSelected
                                                    ? 'rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white'
                                                    : 'rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-white'
                                            }
                                        >
                                            {tag.name}
                                        </button>
                                    );
                                })}
                                {(selectedTagSlugs.length > 0 ||
                                    searchQuery) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-full px-3 text-slate-500"
                                        onClick={clearFilters}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </section>
                    )}

                    {filteredCollections.length === 0 ? (
                        <section className="border-y border-slate-200 bg-white/55 py-16 text-center backdrop-blur-sm">
                            <Folder className="mx-auto h-12 w-12 text-slate-300" />
                            <h2 className="mt-4 text-xl font-semibold text-slate-950">
                                No collections found
                            </h2>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                                No public collections match your current filters
                                or search.
                            </p>
                            {(selectedTagSlugs.length > 0 || searchQuery) && (
                                <Button
                                    onClick={clearFilters}
                                    className="mt-6 rounded-full px-5"
                                >
                                    Clear filters
                                </Button>
                            )}
                        </section>
                    ) : (
                        <section className="grid gap-0 border-y border-slate-200 bg-white/45 backdrop-blur-sm sm:grid-cols-2">
                            {filteredCollections.map((collection, index) => (
                                <article
                                    key={collection.id}
                                    className={
                                        index % 2 === 0
                                            ? 'border-t border-r-0 border-l-0 border-slate-200 px-4 py-5 transition-colors hover:bg-white/75 sm:border-r sm:px-6'
                                            : 'border-t border-r-0 border-l-0 border-slate-200 bg-slate-50/35 px-4 py-5 transition-colors hover:bg-white/75 sm:px-6'
                                    }
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <button
                                            type="button"
                                            className="min-w-0 flex-1 text-left"
                                            onClick={() =>
                                                handleViewCollection(
                                                    collection.slug,
                                                )
                                            }
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="h-3 w-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            collection.color,
                                                    }}
                                                />
                                                <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">
                                                    {collection.name}
                                                </h2>
                                            </div>

                                            {collection.description && (
                                                <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">
                                                    {truncateDescription(
                                                        collection.description,
                                                    )}
                                                </p>
                                            )}
                                        </button>

                                        <Badge
                                            variant="secondary"
                                            className="rounded-full bg-slate-100 px-3 py-1 text-slate-600"
                                        >
                                            {collection.verses_count} Ayah
                                            {collection.verses_count === 1
                                                ? ''
                                                : 's'}
                                        </Badge>
                                    </div>

                                    <div className="mt-4">
                                        <CollectionTagList
                                            tags={collection.tags}
                                            className="mt-0"
                                            getHref={(tag) =>
                                                `/collections?tags[]=${encodeURIComponent(tag.slug)}`
                                            }
                                        />
                                    </div>

                                    <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                                        <div className="space-y-1 text-xs text-slate-400">
                                            <p>
                                                Created{' '}
                                                {formatDate(
                                                    collection.created_at,
                                                )}
                                            </p>
                                            <p className="inline-flex items-center gap-1.5">
                                                <Eye className="h-3.5 w-3.5" />
                                                {collection.views_count.toLocaleString()}{' '}
                                                views
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full px-3 text-slate-700"
                                            onClick={() =>
                                                handleViewCollection(
                                                    collection.slug,
                                                )
                                            }
                                        >
                                            View collection
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </article>
                            ))}
                        </section>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
