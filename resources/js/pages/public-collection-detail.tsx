import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Globe,
    Lock,
    Loader2,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import PublicLayout from '@/layouts/public-layout';

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
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono text-xs">
                            {verse.verse_key}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            {verse.chapter.name_simple}
                        </span>
                    </div>
                    <p
                        className="text-right font-arabic text-2xl leading-relaxed mb-2"
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

    if (isLoading) {
        return (
            <PublicLayout>
                <Head title="Collection - From Quran" />
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
            <Head title={`${collection.name} - From Quran`} />
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
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className="h-8 w-1.5 rounded-full"
                                    style={{ backgroundColor: collection.color }}
                                />
                                <h1 className="text-3xl font-bold">{collection.name}</h1>
                                
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
                                    {collection.is_public ? 'Public' : 'Private'}
                                </Badge>
                            </div>
                            {collection.description && (
                                <p className="text-muted-foreground">
                                    {collection.description}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-2">
                                {verses.length} {verses.length === 1 ? 'verse' : 'verses'}
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
                            <PublicVerseItem
                                key={verse.id}
                                verse={verse}
                            />
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
