import { useBookmarksStore } from '@/store/use-user-content';
import { useCallback, useEffect } from 'react';

interface UseBookmarksReturn {
    // Data
    bookmarks: typeof useBookmarksStore.getState.bookmarks;
    bookmarkedVerseIds: typeof useBookmarksStore.getState.bookmarkedVerseIds;

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
    isBookmarked: (verseId: string) => boolean;
    clearError: () => void;
    clearSuccessMessage: () => void;
}

/**
 * Hook for managing bookmarks (favorites)
 * 
 * Features:
 * - Load and manage user bookmarks
 * - Toggle bookmark status with optimistic updates
 * - Add notes to bookmarks
 * - Check if a verse is bookmarked
 * 
 * @example
 * ```tsx
 * const { 
 *   bookmarks, loading, toggleBookmark, removeBookmark, isBookmarked 
 * } = useBookmarks();
 * 
 * const handleBookmark = async (verse) => {
 *   const result = await toggleBookmark(
 *     String(verse.id),
 *     verse.chapterId,
 *     verse.verseNumber,
 *     'en.sahih'
 *   );
 *   
 *   if (result.success) {
 *     showToast(result.isBookmarked ? 'Bookmarked' : 'Bookmark removed');
 *   }
 * };
 * 
 * return (
 *   <div>
 *     {bookmarks.map(bookmark => (
 *       <BookmarkCard 
 *         key={bookmark.id}
 *         bookmark={bookmark}
 *         onRemove={() => removeBookmark(bookmark.id)}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useBookmarks(): UseBookmarksReturn {
    const {
        bookmarks,
        bookmarkedVerseIds,
        loading,
        error,
        successMessage,
        loadBookmarks,
        toggleBookmark: storeToggleBookmark,
        removeBookmark: storeRemoveBookmark,
        addNote: storeAddNote,
        setSuccessMessage,
        setError,
        clearBookmarks,
    } = useBookmarksStore();

    const toggleBookmark = useCallback(
        async (
            verseId: string,
            chapterId: number,
            verseNumber: number,
            edition: string,
        ) => {
            return storeToggleBookmark(verseId, chapterId, verseNumber, edition);
        },
        [storeToggleBookmark],
    );

    const removeBookmark = useCallback(
        async (bookmarkId: number) => {
            return storeRemoveBookmark(bookmarkId);
        },
        [storeRemoveBookmark],
    );

    const addNote = useCallback(
        async (bookmarkId: number, notes: string) => {
            return storeAddNote(bookmarkId, notes);
        },
        [storeAddNote],
    );

    const isBookmarked = useCallback(
        (verseId: string): boolean => {
            return bookmarkedVerseIds.has(verseId);
        },
        [bookmarkedVerseIds],
    );

    const clearError = useCallback(() => {
        setError(null);
    }, [setError]);

    const clearSuccessMessage = useCallback(() => {
        setSuccessMessage(null);
    }, [setSuccessMessage]);

    // Auto-load bookmarks on mount
    useEffect(() => {
        loadBookmarks();
    }, [loadBookmarks]);

    return {
        // Data
        bookmarks,
        bookmarkedVerseIds,

        // State
        loading,
        error,
        successMessage,

        // Actions
        loadBookmarks,
        toggleBookmark,
        removeBookmark,
        addNote,
        isBookmarked,
        clearError,
        clearSuccessMessage,
    };
}
