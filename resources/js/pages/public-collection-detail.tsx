import { CollectionTagList } from '@/components/collections/collection-tag-list';
import { VerseCard } from '@/components/quran/verse-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCollectionDetailQuery } from '@/hooks';
import { type CollectionDetailData } from '@/hooks/api/use-collection-data';
import { useCollectionViewTracker } from '@/hooks/use-collection-view-tracker';
import PublicLayout from '@/layouts/public-layout';
import { isApiError } from '@/lib/api-client';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye, Globe, Loader2, Lock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function PublicCollectionDetailPage({ slug }: { slug: string }) {
    const [collection, setCollection] = useState<CollectionDetailData | null>(
        null,
    );
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const collectionRootRef = useRef<HTMLDivElement | null>(null);
    const {
        collection: fetchedCollection,
        isLoading: isCollectionLoading,
        error: collectionError,
    } = useCollectionDetailQuery(slug);

    const inertiaPage = usePage<{ appUrl?: string; siteName?: string }>();
    const url = inertiaPage.url;
    const appUrl =
        (inertiaPage.props.appUrl as string | undefined) ??
        'https://fromquran.com';
    const siteName =
        (inertiaPage.props.siteName as string | undefined) ??
        'From Quran - Explore everything stemming from Quran.';
    const baseUrl = appUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    const canonicalUrl = `${baseUrl}${path}`;
    const ogImage = `${baseUrl}/og-banner.png`;

    useEffect(() => {
        if (!fetchedCollection) {
            return;
        }

        setCollection(fetchedCollection);
        setIsDescriptionExpanded(false);
        setErrors((current) => ({ ...current, general: '' }));
    }, [fetchedCollection]);

    useEffect(() => {
        if (!collectionError || !isApiError(collectionError)) {
            return;
        }

        if (collectionError.status === 404) {
            router.visit('/collections');
            return;
        }

        setErrors({
            general: 'Failed to load collection. Please try again.',
        });
    }, [collectionError]);

    const pageTitle = collection
        ? `${collection.name} - Quran Collection`
        : 'Quran Collection';
    const pageDescription = collection?.description
        ? collection.description
        : 'Explore a curated public collection of Quran verses on From Quran.';
    const truncatedDescription =
        collection?.description && collection.description.length > 150
            ? `${collection.description.slice(0, 150).trimEnd()}...`
            : collection?.description;
    const shouldTruncateDescription =
        (collection?.description?.length ?? 0) > 150;

    useCollectionViewTracker({
        collectionId: collection?.id,
        collectionSlug: collection?.slug,
        enabled: Boolean(collection?.is_public),
        minVisibleMs: 2000,
        target: collectionRootRef.current,
        onTracked: (result) => {
            setCollection((current) =>
                current
                    ? {
                          ...current,
                          views_count: result.views_count,
                      }
                    : current,
            );
        },
    });

    if (isCollectionLoading && !collection) {
        return (
            <PublicLayout>
                <Head>
                    <title>{`${pageTitle} | From Quran`}</title>
                    <meta name="description" content={pageDescription} />
                    <meta
                        property="og:title"
                        content={`${pageTitle} | From Quran`}
                    />
                    <meta property="og:description" content={pageDescription} />
                    <meta property="og:type" content="article" />
                    <meta property="og:url" content={canonicalUrl} />
                    <meta property="og:image" content={ogImage} />
                    <meta property="og:site_name" content={siteName} />
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta
                        name="twitter:title"
                        content={`${pageTitle} | From Quran`}
                    />
                    <meta
                        name="twitter:description"
                        content={pageDescription}
                    />
                    <meta name="twitter:image" content={ogImage} />
                </Head>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </PublicLayout>
        );
    }

    if (!collection) {
        return null;
    }

    return (
        <PublicLayout>
            <Head>
                <title>{`${pageTitle} | From Quran`}</title>
                <meta name="description" content={pageDescription} />
                <meta
                    property="og:title"
                    content={`${pageTitle} | From Quran`}
                />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:site_name" content={siteName} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content={`${pageTitle} | From Quran`}
                />
                <meta name="twitter:description" content={pageDescription} />
                <meta name="twitter:image" content={ogImage} />
            </Head>
            <div
                ref={collectionRootRef}
                data-collection-view-root
                className="mx-auto max-w-7xl px-4 py-8 sm:px-6"
            >
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.visit('/collections')}
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Public Collections
                    </Button>

                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                                <div
                                    className="h-8 w-1.5 rounded-full"
                                    style={{
                                        backgroundColor: collection.color,
                                    }}
                                />
                                <h1 className="text-3xl font-bold">
                                    {collection.name}
                                </h1>

                                {/* Only show badge if needed, usually redundant if we know it's public, but good for confirmation */}
                                <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    {collection.is_public ? (
                                        <Globe className="h-3 w-3" />
                                    ) : (
                                        <Lock className="h-3 w-3" />
                                    )}
                                    {collection.is_public
                                        ? 'Public'
                                        : 'Private'}
                                </Badge>
                            </div>
                            {collection.description && (
                                <div className="max-w-3xl text-muted-foreground">
                                    <p>
                                        {isDescriptionExpanded
                                            ? collection.description
                                            : truncatedDescription}{' '}
                                        {shouldTruncateDescription && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsDescriptionExpanded(
                                                        (prev) => !prev,
                                                    )
                                                }
                                                className="font-medium text-foreground underline underline-offset-4"
                                            >
                                                {isDescriptionExpanded
                                                    ? 'Less'
                                                    : 'More..'}
                                            </button>
                                        )}
                                    </p>
                                </div>
                            )}
                            <CollectionTagList
                                tags={collection.tags}
                                className="mt-4"
                                getHref={(tag) =>
                                    `/collections?tags[]=${encodeURIComponent(tag.slug)}`
                                }
                            />
                            <p className="mt-2 text-sm text-muted-foreground">
                                {collection.verses.length}{' '}
                                {collection.verses.length === 1
                                    ? 'verse'
                                    : 'verses'}
                            </p>
                            <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
                                <Eye className="h-4 w-4" />
                                {(
                                    collection.views_count ?? 0
                                ).toLocaleString()}{' '}
                                views
                            </p>
                        </div>
                    </div>
                </div>

                {errors.general && (
                    <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                        {errors.general}
                    </div>
                )}

                {/* Verses List (Read Only) */}
                {collection.verses.length === 0 ? (
                    <Card className="text-center">
                        <CardContent className="py-16">
                            <h2 className="mb-2 text-xl font-semibold">
                                No verses yet
                            </h2>
                            <p className="mb-6 text-muted-foreground">
                                This collection is empty.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {collection.verses.map((verse) => (
                            <VerseCard
                                key={verse.id}
                                className="bg-transparent px-0 py-3 md:p-3"
                                hideHeaderActions
                                showTranslation
                                verseDisplayLabel={verse.verse_key}
                                verseDisplayHref={`/${verse.chapter.chapter_number}/${verse.verse_number}`}
                                verse={{
                                    id: verse.id,
                                    chapterId: verse.chapter.id,
                                    chapterNumber: verse.chapter.chapter_number,
                                    verseNumber: verse.verse_number,
                                    text: verse.text_uthmani,
                                    translations: verse.translations ?? [],
                                    juzNumber: verse.juz_number ?? 0,
                                    pageNumber: verse.page_number ?? 0,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
