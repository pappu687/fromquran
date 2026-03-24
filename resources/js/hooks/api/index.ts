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

export { useChapters } from './use-chapters';
export { useBookmarks } from './use-bookmarks';
export { useAnnotations } from './use-annotations';
export { useCollections } from './use-collections';
