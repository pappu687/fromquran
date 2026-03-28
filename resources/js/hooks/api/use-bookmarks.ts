import { api, getErrorMessage } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { type Bookmark } from '@/store/use-user-content';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseBookmarksReturn {
    bookmarks: Bookmark[];
    bookmarkedVerseIds: Set<string>;
    loading: boolean;
    error: string | null;
    successMessage: string | null;
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

async function fetchBookmarks() {
    const response = await api.get<{ data: Bookmark[] }>('/api/bookmarks');

    return (response.data || []).filter(
        (bookmark) => bookmark.verse && bookmark.chapter,
    );
}

export function useBookmarks(): UseBookmarksReturn {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const bookmarksQuery = useQuery({
        queryKey: queryKeys.userBookmarks,
        queryFn: fetchBookmarks,
    });

    useEffect(() => {
        if (bookmarksQuery.error) {
            setError(getErrorMessage(bookmarksQuery.error));
        }
    }, [bookmarksQuery.error]);

    const bookmarks = bookmarksQuery.data ?? [];
    const bookmarkedVerseIds = useMemo(
        () => new Set(bookmarks.map((bookmark) => String(bookmark.verse_id))),
        [bookmarks],
    );

    const removeBookmarkMutation = useMutation({
        mutationFn: async (bookmarkId: number) => {
            await api.delete(`/api/bookmarks/${bookmarkId}`);

            return bookmarkId;
        },
        onSuccess: (bookmarkId) => {
            queryClient.setQueryData<Bookmark[]>(
                queryKeys.userBookmarks,
                (current = []) =>
                    current.filter((bookmark) => bookmark.id !== bookmarkId),
            );
            setSuccessMessage('Bookmark removed');
            setError(null);
        },
        onError: (mutationError) => {
            setError(getErrorMessage(mutationError));
        },
    });

    const addNoteMutation = useMutation({
        mutationFn: async ({
            bookmarkId,
            notes,
        }: {
            bookmarkId: number;
            notes: string;
        }) => {
            await api.put(`/api/bookmarks/${bookmarkId}`, { notes });

            return { bookmarkId, notes };
        },
        onSuccess: ({ bookmarkId, notes }) => {
            queryClient.setQueryData<Bookmark[]>(
                queryKeys.userBookmarks,
                (current = []) =>
                    current.map((bookmark) =>
                        bookmark.id === bookmarkId
                            ? { ...bookmark, notes }
                            : bookmark,
                    ),
            );
            setSuccessMessage('Note added');
            setError(null);
        },
        onError: (mutationError) => {
            setError(getErrorMessage(mutationError));
        },
    });

    const toggleBookmark = useCallback(
        async (
            verseId: string,
            chapterId: number,
            verseNumber: number,
            edition: string,
        ) => {
            const currentlyBookmarked = bookmarkedVerseIds.has(verseId);

            try {
                if (currentlyBookmarked) {
                    const checkResponse = await api.get<{
                        bookmark?: { id: number };
                    }>(
                        `/api/bookmarks/check?verse_id=${verseId}&edition=${edition}`,
                    );

                    if (!checkResponse.bookmark) {
                        return {
                            success: false,
                            isBookmarked: currentlyBookmarked,
                        };
                    }

                    await removeBookmarkMutation.mutateAsync(
                        checkResponse.bookmark.id,
                    );

                    return { success: true, isBookmarked: false };
                }

                await api.post('/api/bookmarks', {
                    chapter_id: chapterId,
                    verse_number: verseNumber,
                    verse_id: verseId,
                    edition,
                });

                await queryClient.invalidateQueries({
                    queryKey: queryKeys.userBookmarks,
                });

                setSuccessMessage('Added to bookmarks');
                setError(null);

                return { success: true, isBookmarked: true };
            } catch (mutationError) {
                setError(getErrorMessage(mutationError));

                return {
                    success: false,
                    isBookmarked: currentlyBookmarked,
                };
            }
        },
        [bookmarkedVerseIds, queryClient, removeBookmarkMutation],
    );

    const removeBookmark = useCallback(
        async (bookmarkId: number) => {
            try {
                await removeBookmarkMutation.mutateAsync(bookmarkId);

                return true;
            } catch {
                return false;
            }
        },
        [removeBookmarkMutation],
    );

    const addNote = useCallback(
        async (bookmarkId: number, notes: string) => {
            try {
                await addNoteMutation.mutateAsync({ bookmarkId, notes });

                return true;
            } catch {
                return false;
            }
        },
        [addNoteMutation],
    );

    const loadBookmarks = useCallback(async () => {
        setError(null);
        await queryClient.invalidateQueries({
            queryKey: queryKeys.userBookmarks,
        });
    }, [queryClient]);

    const isBookmarked = useCallback(
        (verseId: string) => bookmarkedVerseIds.has(verseId),
        [bookmarkedVerseIds],
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const clearSuccessMessage = useCallback(() => {
        setSuccessMessage(null);
    }, []);

    return {
        bookmarks,
        bookmarkedVerseIds,
        loading:
            bookmarksQuery.isLoading ||
            removeBookmarkMutation.isPending ||
            addNoteMutation.isPending,
        error,
        successMessage,
        loadBookmarks,
        toggleBookmark,
        removeBookmark,
        addNote,
        isBookmarked,
        clearError,
        clearSuccessMessage,
    };
}
