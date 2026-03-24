import { type CollectionTag } from '@/types/collections';
import { api, isApiError, getErrorMessage } from '@/lib/api-client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================== Types ====================

export interface Collection {
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

export interface CollectionVerse {
    id: number;
    verse_key: string;
    verse_number: number;
    text_uthmani: string;
    text_imlaei_simple?: string;
    juz_number?: number;
    page_number?: number;
    has_resources?: boolean;
    resource_count?: number;
    translations?: Array<{
        resource_id: number;
        resource_name?: string;
        language?: string;
        text: string;
    }>;
    chapter: {
        id: number;
        chapter_number: number;
        name_simple: string;
        name_roman?: string;
        name_arabic: string;
    };
    pivot: {
        display_order: number;
    };
}

export interface CollectionDetail extends Collection {
    verses: CollectionVerse[];
}

export interface Bookmark {
    id: number;
    verse_id: string;
    notes?: string;
    created_at: string;
    verse: {
        id: number;
        verse_key: string;
        verse_number: number;
        text_uthmani: string;
        text_imlaei_simple?: string;
        translation?: string;
        juz_number?: number;
        page_number?: number;
    };
    chapter: {
        id: number;
        chapter_number: number;
        name_simple: string;
        name_roman?: string;
        name_arabic: string;
    };
}

export interface Annotation {
    id: number;
    verse_id: number;
    start_offset: number;
    end_offset: number;
    selected_text: string;
    note: string;
    created_at: string;
    updated_at: string;
    verse?: {
        id: number;
        verse_key?: string;
        verse_number?: number;
        chapter_id?: number;
        chapter_number?: number;
    } | null;
}

// ==================== Collections State ====================

interface CollectionsState {
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
    setSuccessMessage: (message: string | null) => void;
    setError: (error: string | null) => void;
    setSelectedTagSlugs: (slugs: string[]) => void;
    clearCurrentCollection: () => void;
}

export const useCollectionsStore = create<CollectionsState>()(
    persist(
        (set, get) => ({
            // Initial state
            collections: [],
            currentCollection: null,
            loading: false,
            loadingCollection: false,
            error: null,
            successMessage: null,
            selectedTagSlugs: [],

            setSuccessMessage: (message) => set({ successMessage: message }),

            setError: (error) => set({ error }),

            setSelectedTagSlugs: (slugs) => set({ selectedTagSlugs: slugs }),

            clearCurrentCollection: () => set({ currentCollection: null }),

            loadCollections: async (tagSlugs = []) => {
                set({ loading: true, error: null });

                try {
                    const params = new URLSearchParams();
                    tagSlugs.forEach((slug) => params.append('tags[]', slug));
                    const queryString = params.toString();
                    const url = `/api/collections${queryString ? `?${queryString}` : ''}`;

                    const data = await api.get<Collection[]>(url);
                    set({ collections: data, loading: false });
                } catch (err) {
                    const message = getErrorMessage(err);
                    set({ error: message, loading: false });
                }
            },

            loadCollection: async (slug: string) => {
                set({ loadingCollection: true, error: null });

                try {
                    const data = await api.get<CollectionDetail>(
                        `/api/collections/${slug}`,
                    );
                    set({ currentCollection: data, loadingCollection: false });
                } catch (err) {
                    const message = getErrorMessage(err);
                    set({ error: message, loadingCollection: false });
                    throw err;
                }
            },

            deleteCollection: async (slug: string) => {
                try {
                    await api.delete(`/api/collections/${slug}`);

                    set((state) => ({
                        collections: state.collections.filter(
                            (c) => c.slug !== slug,
                        ),
                        currentCollection:
                            state.currentCollection?.slug === slug
                                ? null
                                : state.currentCollection,
                        successMessage: 'Collection deleted successfully',
                    }));

                    return true;
                } catch (err) {
                    set({ error: getErrorMessage(err) });
                    return false;
                }
            },

            updateCollection: async (slug: string, data: Partial<Collection>) => {
                try {
                    const updated = await api.put<CollectionDetail>(
                        `/api/collections/${slug}`,
                        data,
                    );

                    set((state) => ({
                        collections: state.collections.map((c) =>
                            c.slug === slug ? { ...c, ...data } : c,
                        ),
                        currentCollection:
                            state.currentCollection?.slug === slug
                                ? { ...state.currentCollection, ...data }
                                : state.currentCollection,
                        successMessage: 'Collection updated successfully',
                    }));

                    return true;
                } catch (err) {
                    set({ error: getErrorMessage(err) });
                    return false;
                }
            },

            reorderVerses: async (slug, verses) => {
                try {
                    await api.post(`/api/collections/${slug}/reorder`, {
                        verses,
                    });

                    set((state) => ({
                        currentCollection: state.currentCollection
                            ? {
                                  ...state.currentCollection,
                                  verses: state.currentCollection.verses.map(
                                      (v) => {
                                          const newOrder = verses.find(
                                              (vo) => vo.verse_id === v.id,
                                          );
                                          return newOrder
                                              ? {
                                                    ...v,
                                                    pivot: {
                                                        ...v.pivot,
                                                        display_order:
                                                            newOrder.display_order,
                                                    },
                                                }
                                              : v;
                                      },
                                  ),
                              }
                            : null,
                        successMessage: 'Verses reordered successfully',
                    }));

                    return true;
                } catch (err) {
                    set({ error: getErrorMessage(err) });
                    return false;
                }
            },

            removeVerseFromCollection: async (slug, verseId) => {
                try {
                    await api.delete(`/api/collections/${slug}/verses`, {
                        body: JSON.stringify({ verse_id: verseId }),
                    });

                    set((state) => ({
                        collections: state.collections.map((c) =>
                            c.slug === slug
                                ? { ...c, verses_count: c.verses_count - 1 }
                                : c,
                        ),
                        currentCollection: state.currentCollection
                            ? {
                                  ...state.currentCollection,
                                  verses:
                                      state.currentCollection.verses.filter(
                                          (v) => v.id !== verseId,
                                      ),
                                  verses_count:
                                      state.currentCollection.verses_count - 1,
                              }
                            : null,
                        successMessage: 'Verse removed from collection',
                    }));

                    return true;
                } catch (err) {
                    set({ error: getErrorMessage(err) });
                    return false;
                }
            },
        }),
        {
            name: 'collections-storage',
            partialize: (state) => ({
                selectedTagSlugs: state.selectedTagSlugs,
            }),
        },
    ),
);

// ==================== Bookmarks State ====================

interface BookmarksState {
    // Data
    bookmarks: Bookmark[];
    bookmarkedVerseIds: Set<string>;

    // State
    loading: boolean;
    error: string | null;
    successMessage: string | null;

    // Actions
    loadBookmarks: () => Promise<void>;
    toggleBookmark: (
        verseId: string,
        chapterId: number,
        verseNumber: number,
        edition: string,
    ) => Promise<{ success: boolean; isBookmarked: boolean }>;
    removeBookmark: (bookmarkId: number) => Promise<boolean>;
    addNote: (bookmarkId: number, notes: string) => Promise<boolean>;

    // Actions - UI
    setSuccessMessage: (message: string | null) => void;
    setError: (error: string | null) => void;
    clearBookmarks: () => void;
}

export const useBookmarksStore = create<BookmarksState>()(
    persist(
        (set, get) => ({
            // Initial state
            bookmarks: [],
            bookmarkedVerseIds: new Set(),
            loading: false,
            error: null,
            successMessage: null,

            setSuccessMessage: (message) => set({ successMessage: message }),

            setError: (error) => set({ error }),

            clearBookmarks: () =>
                set({ bookmarks: [], bookmarkedVerseIds: new Set() }),

            loadBookmarks: async () => {
                set({ loading: true, error: null });

                try {
                    const response = await api.get<{ data: Bookmark[] }>(
                        '/api/bookmarks',
                    );

                    const validBookmarks = (response.data || []).filter(
                        (b) => b.verse && b.chapter,
                    );

                    const bookmarkedIds = new Set<string>(
                        validBookmarks.map((b) => String(b.verse_id)),
                    );

                    set({
                        bookmarks: validBookmarks,
                        bookmarkedVerseIds: bookmarkedIds,
                        loading: false,
                    });
                } catch (err) {
                    set({ error: getErrorMessage(err), loading: false });
                }
            },

            toggleBookmark: async (
                verseId,
                chapterId,
                verseNumber,
                edition,
            ) => {
                const state = get();
                const isBookmarked = state.bookmarkedVerseIds.has(verseId);

                try {
                    if (isBookmarked) {
                        // Check bookmark status first
                        const checkResponse = await api.get<{
                            bookmark?: { id: number };
                        }>(
                            `/api/bookmarks/check?verse_id=${verseId}&edition=${edition}`,
                        );

                        if (checkResponse.bookmark) {
                            await api.delete(
                                `/api/bookmarks/${checkResponse.bookmark.id}`,
                            );

                            set((s) => {
                                const newSet = new Set(s.bookmarkedVerseIds);
                                newSet.delete(verseId);
                                return {
                                    bookmarks: s.bookmarks.filter(
                                        (b) => String(b.verse_id) !== verseId,
                                    ),
                                    bookmarkedVerseIds: newSet,
                                    successMessage: 'Bookmark removed',
                                };
                            });

                            return { success: true, isBookmarked: false };
                        }
                    } else {
                        // Add bookmark
                        await api.post('/api/bookmarks', {
                            chapter_id: chapterId,
                            verse_number: verseNumber,
                            verse_id: verseId,
                            edition,
                        });

                        set((s) => {
                            const newSet = new Set(s.bookmarkedVerseIds);
                            newSet.add(verseId);
                            return {
                                bookmarkedVerseIds: newSet,
                                successMessage: 'Added to bookmarks',
                            };
                        });

                        return { success: true, isBookmarked: true };
                    }
                } catch (err) {
                    set({ error: getErrorMessage(err) });
                    return { success: false, isBookmarked };
                }

                return { success: false, isBookmarked };
            },

            removeBookmark: async (bookmarkId) => {
                try {
                    await api.delete(`/api/bookmarks/${bookmarkId}`);

                    set((state) => {
                        const bookmark = state.bookmarks.find(
                            (b) => b.id === bookmarkId,
                        );
                        const newSet = new Set(state.bookmarkedVerseIds);
                        if (bookmark) {
                            newSet.delete(String(bookmark.verse_id));
                        }

                        return {
                            bookmarks: state.bookmarks.filter(
                                (b) => b.id !== bookmarkId,
                            ),
                            bookmarkedVerseIds: newSet,
                            successMessage: 'Bookmark removed',
                        };
                    });

                    return true;
                } catch (err) {
                    set({ error: getErrorMessage(err) });
                    return false;
                }
            },

            addNote: async (bookmarkId, notes) => {
                try {
                    await api.put(`/api/bookmarks/${bookmarkId}`, { notes });

                    set((state) => ({
                        bookmarks: state.bookmarks.map((b) =>
                            b.id === bookmarkId ? { ...b, notes } : b,
                        ),
                        successMessage: 'Note added',
                    }));

                    return true;
                } catch (err) {
                    set({ error: getErrorMessage(err) });
                    return false;
                }
            },
        }),
        {
            name: 'bookmarks-storage',
            partialize: () => ({}), // Don't persist bookmarks, they're server-side
        },
    ),
);

// ==================== Annotations State ====================

interface AnnotationsState {
    // Data
    annotations: Annotation[];

    // State
    loading: boolean;
    error: string | null;
    successMessage: string | null;

    // Actions
    loadAnnotations: () => Promise<void>;
    deleteAnnotation: (annotationId: number) => Promise<boolean>;
    createAnnotation: (data: {
        verse_id: number;
        start_offset: number;
        end_offset: number;
        selected_text: string;
        note: string;
    }) => Promise<boolean>;

    // Actions - UI
    setSuccessMessage: (message: string | null) => void;
    setError: (error: string | null) => void;
    clearAnnotations: () => void;
}

export const useAnnotationsStore = create<AnnotationsState>()(
    persist(
        (set, get) => ({
            // Initial state
            annotations: [],
            loading: false,
            error: null,
            successMessage: null,

            setSuccessMessage: (message) => set({ successMessage: message }),

            setError: (error) => set({ error }),

            clearAnnotations: () => set({ annotations: [] }),

            loadAnnotations: async () => {
                set({ loading: true, error: null });

                try {
                    const response = await api.get<{ data: Annotation[] }>(
                        '/api/verse-annotations?all=1',
                    );

                    set({ annotations: response.data || [], loading: false });
                } catch (err) {
                    set({ error: getErrorMessage(err), loading: false });
                }
            },

            deleteAnnotation: async (annotationId) => {
                try {
                    await api.delete(
                        `/api/verse-annotations/${annotationId}`,
                    );

                    set((state) => ({
                        annotations: state.annotations.filter(
                            (a) => a.id !== annotationId,
                        ),
                        successMessage: 'Annotation deleted',
                    }));

                    return true;
                } catch (err) {
                    set({ error: getErrorMessage(err) });
                    return false;
                }
            },

            createAnnotation: async (data) => {
                try {
                    await api.post('/api/verse-annotations', data);

                    set((state) => ({
                        annotations: [...state.annotations, data as Annotation],
                        successMessage: 'Annotation created',
                    }));

                    return true;
                } catch (err) {
                    set({ error: getErrorMessage(err) });
                    return false;
                }
            },
        }),
        {
            name: 'annotations-storage',
            partialize: () => ({}), // Don't persist annotations, they're server-side
        },
    ),
);

// ==================== Combined User Content Store ====================

export const useUserContentStore = create<{
    // Combined loading states
    isLoadingAny: boolean;
    hasAnyContent: boolean;

    // Quick stats
    collectionsCount: number;
    bookmarksCount: number;
    annotationsCount: number;

    // Actions
    refreshAll: () => Promise<void>;
    clearAll: () => void;
}>()(
    persist(
        (set, get) => ({
            isLoadingAny: false,
            hasAnyContent: false,
            collectionsCount: 0,
            bookmarksCount: 0,
            annotationsCount: 0,

            refreshAll: async () => {
                set({ isLoadingAny: true });

                const collectionsStore = useCollectionsStore.getState();
                const bookmarksStore = useBookmarksStore.getState();
                const annotationsStore = useAnnotationsStore.getState();

                await Promise.all([
                    collectionsStore.loadCollections().catch(console.error),
                    bookmarksStore.loadBookmarks().catch(console.error),
                    annotationsStore.loadAnnotations().catch(console.error),
                ]);

                // Update counts
                const newCollectionsCount =
                    collectionsStore.getState().collections.length;
                const newBookmarksCount =
                    bookmarksStore.getState().bookmarks.length;
                const newAnnotationsCount =
                    annotationsStore.getState().annotations.length;

                set({
                    isLoadingAny: false,
                    collectionsCount: newCollectionsCount,
                    bookmarksCount: newBookmarksCount,
                    annotationsCount: newAnnotationsCount,
                    hasAnyContent:
                        newCollectionsCount > 0 ||
                        newBookmarksCount > 0 ||
                        newAnnotationsCount > 0,
                });
            },

            clearAll: () => {
                useCollectionsStore.getState().clearCurrentCollection();
                useBookmarksStore.getState().clearBookmarks();
                useAnnotationsStore.getState().clearAnnotations();

                set({
                    collectionsCount: 0,
                    bookmarksCount: 0,
                    annotationsCount: 0,
                    hasAnyContent: false,
                });
            },
        }),
        {
            name: 'user-content-stats',
            partialize: () => ({}), // Don't persist stats
        },
    ),
);
