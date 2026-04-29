import {
    QueryClient,
    type DefaultOptions,
    type QueryKey,
} from '@tanstack/react-query';

const defaultOptions: DefaultOptions = {
    queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
    },
    mutations: {
        retry: false,
    },
};

let browserQueryClient: QueryClient | undefined;

export function makeQueryClient() {
    return new QueryClient({
        defaultOptions,
    });
}

export function getBrowserQueryClient() {
    if (typeof window === 'undefined') {
        return makeQueryClient();
    }

    browserQueryClient ??= makeQueryClient();

    return browserQueryClient;
}

export const queryKeys = {
    quranChapters: ['quran', 'chapters'] as const,
    quranChapterInfo: (chapterNumber: number) =>
        ['quran', 'chapter-info', chapterNumber] as const,
    quranChapterResources: (chapterNumber: number) =>
        ['quran', 'chapter-resources', chapterNumber] as const,
    verseResourcesSummary: (verseId: number) =>
        ['quran', 'verse-resources-summary', verseId] as const,
    quranAyahAnswers: (verseKey: string, pageSize: number, language: string) =>
        ['quran', 'ayah-answers', verseKey, pageSize, language] as const,
    quranSearch: (query: string, limit: number) =>
        ['quran', 'search', query, limit] as const,
    topicsTree: ['topics', 'tree'] as const,
    collectionTags: ['collections', 'tags'] as const,
    collectionDetail: (slug: string) =>
        ['collections', 'detail', slug] as const,
    userCollections: (tagSlugs: string[] = []) =>
        ['user', 'collections', [...tagSlugs].sort()] as const,
    userBookmarks: ['user', 'bookmarks'] as const,
    userAnnotations: ['user', 'annotations'] as const,
};

export function getCachedQueryData<T>(queryKey: QueryKey) {
    return getBrowserQueryClient().getQueryData<T>(queryKey);
}
