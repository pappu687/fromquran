import { api, getErrorMessage } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import {
    type Collection,
    type CollectionDetail,
} from '@/store/use-user-content';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    type Dispatch,
    type SetStateAction,
    useCallback,
    useEffect,
    useState,
} from 'react';

interface UseCollectionsReturn {
    collections: Collection[];
    currentCollection: CollectionDetail | null;
    loading: boolean;
    loadingCollection: boolean;
    error: string | null;
    successMessage: string | null;
    selectedTagSlugs: string[];
    loadCollections: (tagSlugs?: string[]) => Promise<void>;
    loadCollection: (slug: string) => Promise<void>;
    deleteCollection: (slug: string) => Promise<boolean>;
    updateCollection: (
        slug: string,
        data: Partial<Collection>,
    ) => Promise<boolean>;
    reorderVerses: (
        slug: string,
        verses: { verse_id: number; display_order: number }[],
    ) => Promise<boolean>;
    removeVerseFromCollection: (
        slug: string,
        verseId: number,
    ) => Promise<boolean>;
    clearError: () => void;
    clearSuccessMessage: () => void;
    setSelectedTagSlugs: Dispatch<SetStateAction<string[]>>;
    clearCurrentCollection: () => void;
}

function getCollectionsUrl(tagSlugs: string[]) {
    const params = new URLSearchParams();
    tagSlugs.forEach((slug) => params.append('tags[]', slug));
    const queryString = params.toString();

    return `/api/collections${queryString ? `?${queryString}` : ''}`;
}

async function fetchCollections(tagSlugs: string[]) {
    return api.get<Collection[]>(getCollectionsUrl(tagSlugs));
}

export function useCollections(): UseCollectionsReturn {
    const queryClient = useQueryClient();
    const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
    const [currentCollection, setCurrentCollection] =
        useState<CollectionDetail | null>(null);
    const [loadingCollection, setLoadingCollection] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const collectionsQuery = useQuery({
        queryKey: queryKeys.userCollections(selectedTagSlugs),
        queryFn: () => fetchCollections(selectedTagSlugs),
    });

    useEffect(() => {
        if (collectionsQuery.error) {
            setError(getErrorMessage(collectionsQuery.error));
        }
    }, [collectionsQuery.error]);

    const deleteCollectionMutation = useMutation({
        mutationFn: async (slug: string) => {
            await api.delete(`/api/collections/${slug}`);

            return slug;
        },
        onSuccess: async (slug) => {
            queryClient.setQueryData<Collection[]>(
                queryKeys.userCollections(selectedTagSlugs),
                (current = []) =>
                    current.filter((collection) => collection.slug !== slug),
            );

            if (currentCollection?.slug === slug) {
                setCurrentCollection(null);
            }

            setSuccessMessage('Collection deleted successfully');
            setError(null);
        },
        onError: (mutationError) => {
            setError(getErrorMessage(mutationError));
        },
    });

    const updateCollectionMutation = useMutation({
        mutationFn: async ({
            slug,
            data,
        }: {
            slug: string;
            data: Partial<Collection>;
        }) => {
            await api.put(`/api/collections/${slug}`, data);

            return { slug, data };
        },
        onSuccess: async ({ slug, data }) => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.userCollections(selectedTagSlugs),
            });

            setCurrentCollection((current) =>
                current?.slug === slug ? { ...current, ...data } : current,
            );
            setSuccessMessage('Collection updated successfully');
            setError(null);
        },
        onError: (mutationError) => {
            setError(getErrorMessage(mutationError));
        },
    });

    const reorderVersesMutation = useMutation({
        mutationFn: async ({
            slug,
            verses,
        }: {
            slug: string;
            verses: { verse_id: number; display_order: number }[];
        }) => {
            await api.post(`/api/collections/${slug}/reorder`, {
                verses,
            });

            return { slug, verses };
        },
        onSuccess: ({ slug, verses }) => {
            setCurrentCollection((current) => {
                if (!current || current.slug !== slug) {
                    return current;
                }

                return {
                    ...current,
                    verses: current.verses.map((verse) => {
                        const updatedOrder = verses.find(
                            (item) => item.verse_id === verse.id,
                        );

                        return updatedOrder
                            ? {
                                  ...verse,
                                  pivot: {
                                      ...verse.pivot,
                                      display_order: updatedOrder.display_order,
                                  },
                              }
                            : verse;
                    }),
                };
            });
            setSuccessMessage('Verses reordered successfully');
            setError(null);
        },
        onError: (mutationError) => {
            setError(getErrorMessage(mutationError));
        },
    });

    const removeVerseMutation = useMutation({
        mutationFn: async ({
            slug,
            verseId,
        }: {
            slug: string;
            verseId: number;
        }) => {
            await api.delete(`/api/collections/${slug}/verses`, {
                body: JSON.stringify({ verse_id: verseId }),
            });

            return { slug, verseId };
        },
        onSuccess: ({ slug, verseId }) => {
            queryClient.setQueryData<Collection[]>(
                queryKeys.userCollections(selectedTagSlugs),
                (current = []) =>
                    current.map((collection) =>
                        collection.slug === slug
                            ? {
                                  ...collection,
                                  verses_count: Math.max(
                                      0,
                                      collection.verses_count - 1,
                                  ),
                              }
                            : collection,
                    ),
            );

            setCurrentCollection((current) => {
                if (!current || current.slug !== slug) {
                    return current;
                }

                return {
                    ...current,
                    verses: current.verses.filter(
                        (verse) => verse.id !== verseId,
                    ),
                    verses_count: Math.max(0, current.verses_count - 1),
                };
            });
            setSuccessMessage('Verse removed from collection');
            setError(null);
        },
        onError: (mutationError) => {
            setError(getErrorMessage(mutationError));
        },
    });

    const loadCollections = useCallback(
        async (tagSlugs?: string[]) => {
            if (tagSlugs) {
                setSelectedTagSlugs(tagSlugs);

                await queryClient.invalidateQueries({
                    queryKey: queryKeys.userCollections(tagSlugs),
                });

                return;
            }

            await queryClient.invalidateQueries({
                queryKey: queryKeys.userCollections(selectedTagSlugs),
            });
        },
        [queryClient, selectedTagSlugs],
    );

    const loadCollection = useCallback(async (slug: string) => {
        setLoadingCollection(true);
        setError(null);

        try {
            const data = await api.get<CollectionDetail>(
                `/api/collections/${slug}`,
            );
            setCurrentCollection(data);
        } catch (queryError) {
            setError(getErrorMessage(queryError));
            throw queryError;
        } finally {
            setLoadingCollection(false);
        }
    }, []);

    const deleteCollection = useCallback(
        async (slug: string) => {
            try {
                await deleteCollectionMutation.mutateAsync(slug);

                return true;
            } catch {
                return false;
            }
        },
        [deleteCollectionMutation],
    );

    const updateCollection = useCallback(
        async (slug: string, data: Partial<Collection>) => {
            try {
                await updateCollectionMutation.mutateAsync({ slug, data });

                return true;
            } catch {
                return false;
            }
        },
        [updateCollectionMutation],
    );

    const reorderVerses = useCallback(
        async (
            slug: string,
            verses: { verse_id: number; display_order: number }[],
        ) => {
            try {
                await reorderVersesMutation.mutateAsync({ slug, verses });

                return true;
            } catch {
                return false;
            }
        },
        [reorderVersesMutation],
    );

    const removeVerseFromCollection = useCallback(
        async (slug: string, verseId: number) => {
            try {
                await removeVerseMutation.mutateAsync({ slug, verseId });

                return true;
            } catch {
                return false;
            }
        },
        [removeVerseMutation],
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const clearSuccessMessage = useCallback(() => {
        setSuccessMessage(null);
    }, []);

    const clearCurrentCollection = useCallback(() => {
        setCurrentCollection(null);
    }, []);

    return {
        collections: collectionsQuery.data ?? [],
        currentCollection,
        loading:
            collectionsQuery.isLoading ||
            deleteCollectionMutation.isPending ||
            updateCollectionMutation.isPending,
        loadingCollection,
        error,
        successMessage,
        selectedTagSlugs,
        loadCollections,
        loadCollection,
        deleteCollection,
        updateCollection,
        reorderVerses,
        removeVerseFromCollection,
        clearError,
        clearSuccessMessage,
        setSelectedTagSlugs,
        clearCurrentCollection,
    };
}
