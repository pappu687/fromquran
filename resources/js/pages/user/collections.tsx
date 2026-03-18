import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Folder,
    FolderPlus,
    Globe,
    Lock,
    Loader2,
    Eye,
} from 'lucide-react';
import { Head, router } from '@inertiajs/react';
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
}

export default function CollectionsPage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        setIsLoading(true);
        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch('/api/collections/public', {
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

    const handleViewCollection = (slug: string) => {
        router.visit(`/collections/${slug}`);
    };

    if (isLoading) {
        return (
            <PublicLayout>
                <Head title="Public Collections - From Quran" />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
             <Head title="Public Collections - From Quran" />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Public Collections</h1>
                        <p className="text-muted-foreground">
                            Explore collections created by the community
                        </p>
                    </div>
                    <Button onClick={() => router.visit('/my-collections')}>
                        <Folder className="mr-2 h-4 w-4" />
                        My Collections
                    </Button>
                </div>

                {errors.general && (
                    <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                        {errors.general}
                    </div>
                )}

                {collections.length === 0 ? (
                    <Card className="text-center">
                        <CardContent className="py-16">
                            <Globe className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                            <h2 className="mb-2 text-xl font-semibold">
                                No public collections yet
                            </h2>
                            <p className="mb-6 text-muted-foreground">
                                Be the first to share a collection with the community!
                            </p>
                            <Button onClick={() => router.visit('/my-collections')}>
                                <FolderPlus className="mr-2 h-4 w-4" />
                                Create a Collection
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {collections.map((collection) => (
                            <Card
                                key={collection.id}
                                className="group relative transition-all hover:shadow-md"
                            >
                                <div
                                    className="absolute left-0 top-0 h-full w-1.5 rounded-l-lg"
                                    style={{ backgroundColor: collection.color }}
                                />
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="mb-1">
                                                {collection.name}
                                            </CardTitle>
                                            {collection.description && (
                                                <CardDescription className="line-clamp-2">
                                                    {collection.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="ml-2 flex items-center gap-1"
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
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>{collection.verses_count} verses</span>
                                        <span>
                                            {new Date(
                                                collection.created_at
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleViewCollection(collection.slug)
                                        }
                                        className="w-full"
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Collection
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
