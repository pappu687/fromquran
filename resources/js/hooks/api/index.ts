/**
 * API Hooks Index
 *
 * Central export point for all API-related hooks.
 * These hooks handle data fetching and server communication.
 *
 * @example
 * ```typescript
 * import {
 *   useChapters,
 *   useBookmarks,
 *   useAnnotations,
 *   useCollections
 * } from '@/hooks/api';
 * ```
 */

export { useAnnotations } from './use-annotations';
export { useBookmarks } from './use-bookmarks';
export { useChapters } from './use-chapters';
export {
    useCollectionDetailQuery,
    useCollectionTagsQuery,
} from './use-collection-data';
export { useCollections } from './use-collections';
export {
    useChapterInfoQuery,
    useChapterResourcesQuery,
} from './use-quran-chapter-data';
export { useQuranSearch } from './use-quran-search';
export { useFlatTopics, useTopicsTree } from './use-topics';
