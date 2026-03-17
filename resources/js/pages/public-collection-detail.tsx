import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PublicLayout from '@/layouts/public-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Globe, Loader2, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Verse {
    id: number;
    verse_key: string;
    verse_number: number;
    text_uthmani: string;
    text_imlaei_simple?: string;
    chapter: {
        id: number;
        chapter_number: number;
        name_simple: string;
        name_arabic: string;
    };
    pivot: {
        display_order: number;
    };
}

interface Collection {
    id: number;
    name: string;
    description?: string;
    color: string;
    is_public: boolean;
    slug: string;
    created_at: string;
    verses: Verse[];
}

function PublicVerseItem({ verse }: { verse: Verse }) {
    return (
        <div className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                            {verse.verse_key}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            {verse.chapter.name_simple}
                        </span>
                    </div>
                    <p
                        className="font-arabic mb-2 text-right text-2xl leading-relaxed"
                        dir="rtl"
                    >
                        {verse.text_uthmani}
                    </p>
                    {verse.text_imlaei_simple && (
                        <p className="text-sm text-muted-foreground">
                            {verse.text_imlaei_simple}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PublicCollectionDetailPage({ slug }: { slug: string }) {
    const [collection, setCollection] = useState<Collection | null>(null);
    const [verses, setVerses] = useState<Verse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

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
        loadCollection();
    }, [slug]);

    const loadCollection = async () => {
        setIsLoading(true);
        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(`/api/collections/${slug}`, {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
            });

            if (response.status === 404) {
                router.visit('/collections');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load collection');
            }

            const data = await response.json();
            setCollection(data);
            setVerses(data.verses || []);
        } catch (error) {
            console.error('Failed to load collection:', error);
            setErrors({
                general: 'Failed to load collection. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const pageTitle = collection
        ? `${collection.name} - Quran Collection`
        : 'Quran Collection';
    const pageDescription = collection?.description
        ? collection.description
        : 'Explore a curated public collection of Quran verses on From Quran.';

    if (isLoading) {
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
            <div className="container mx-auto px-4 py-8">
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
                                <p className="text-muted-foreground">
                                    {collection.description}
                                </p>
                            )}
                            <p className="mt-2 text-sm text-muted-foreground">
                                {verses.length}{' '}
                                {verses.length === 1 ? 'verse' : 'verses'}
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
                {verses.length === 0 ? (
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
                        {verses.map((verse) => (
                            <PublicVerseItem key={verse.id} verse={verse} />
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
