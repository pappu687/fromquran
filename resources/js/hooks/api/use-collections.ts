import { useCollectionsStore, type Collection, type CollectionDetail } from '@/store/use-user-content';
import { useCallback, useEffect } from 'react';

interface UseCollectionsReturn {
    // Data
    collections: Collection[];
    currentCollection: CollectionDetail | null;

    // State
    loading: boolean;
    loadingCollection: boolean;
    error: string | null;
    successMessage: string | null;

    // Filters
    selectedTagSlugs: string[];

    // Actions - Collections
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

    // Actions - UI
    clearError: () => void;
    clearSuccessMessage: () => void;
    setSelectedTagSlugs: (slugs: string[]) => void;
    clearCurrentCollection: () => void;
}

/**
 * Hook for managing user collections
 * 
 * Features:
 * - Load and manage user collections
 * - Filter collections by tags
 * - CRUD operations for collections
 * - Verse management within collections
 * - Reorder verses with drag-and-drop support
 * 
 * @example
 * ```tsx
 * const { 
 *   collections, loading, loadCollections, deleteCollection 
 * } = useCollections();
 * 
 * useEffect(() => {
 *   loadCollections();
 * }, [loadCollections]);
 * 
 * const handleDelete = async (slug) => {
 *   if (confirm('Delete this collection?')) {
 *     const success = await deleteCollection(slug);
 *     if (success) showToast('Collection deleted');
 *   }
 * };
 * 
 * return (
 *   <div>
 *     {collections.map(collection => (
 *       <CollectionCard 
 *         key={collection.id}
 *         collection={collection}
 *         onDelete={() => handleDelete(collection.slug)}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useCollections(): UseCollectionsReturn {
    const {
        collections,
        currentCollection,
        loading,
        loadingCollection,
        error,
        successMessage,
        selectedTagSlugs,
        loadCollections: storeLoadCollections,
        loadCollection: storeLoadCollection,
        deleteCollection: storeDeleteCollection,
        updateCollection: storeUpdateCollection,
        reorderVerses: storeReorderVerses,
        removeVerseFromCollection: storeRemoveVerseFromCollection,
        setSuccessMessage,
        setError,
        setSelectedTagSlugs: storeSetSelectedTagSlugs,
        clearCurrentCollection: storeClearCurrentCollection,
    } = useCollectionsStore();

    const loadCollections = useCallback(
        async (tagSlugs?: string[]) => {
            return storeLoadCollections(tagSlugs);
        },
        [storeLoadCollections],
    );

    const loadCollection = useCallback(
        async (slug: string) => {
            return storeLoadCollection(slug);
        },
        [storeLoadCollection],
    );

    const deleteCollection = useCallback(
        async (slug: string) => {
            return storeDeleteCollection(slug);
        },
        [storeDeleteCollection],
    );

    const updateCollection = useCallback(
        async (slug: string, data: Partial<Collection>) => {
            return storeUpdateCollection(slug, data);
        },
        [storeUpdateCollection],
    );

    const reorderVerses = useCallback(
        async (slug: string, verses: { verse_id: number; display_order: number }[]) => {
            return storeReorderVerses(slug, verses);
        },
        [storeReorderVerses],
    );

    const removeVerseFromCollection = useCallback(
        async (slug: string, verseId: number) => {
            return storeRemoveVerseFromCollection(slug, verseId);
        },
        [storeRemoveVerseFromCollection],
    );

    const clearError = useCallback(() => {
        setError(null);
    }, [setError]);

    const clearSuccessMessage = useCallback(() => {
        setSuccessMessage(null);
    }, [setSuccessMessage]);

    const setSelectedTagSlugs = useCallback(
        (slugs: string[]) => {
            storeSetSelectedTagSlugs(slugs);
        },
        [storeSetSelectedTagSlugs],
    );

    const clearCurrentCollection = useCallback(() => {
        storeClearCurrentCollection();
    }, [storeClearCurrentCollection]);

    // Auto-load collections on mount
    useEffect(() => {
        // Only load if collections are empty
        if (collections.length === 0) {
            loadCollections(selectedTagSlugs);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        // Data
        collections,
        currentCollection,

        // State
        loading,
        loadingCollection,
        error,
        successMessage,

        // Filters
        selectedTagSlugs,

        // Actions
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
