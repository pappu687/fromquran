/**
 * Store Index
 * 
 * Central export point for all Zustand stores.
 * Import stores from here instead of individual files.
 * 
 * @example
 * ```typescript
 * import { 
 *   useAudioPlayer, 
 *   useUserContentStore,
 *   useCollectionsStore,
 *   useBookmarksStore,
 *   useAnnotationsStore
 * } from '@/store';
 * ```
 */

// Audio player store
export { useAudioPlayer } from './use-audio-player';
export type {
    VerseTiming,
    ChapterAudioFile,
    CurrentVerse,
    AudioPlayerState,
} from './use-audio-player';

// User content stores
export {
    useCollectionsStore,
    useBookmarksStore,
    useAnnotationsStore,
    useUserContentStore,
} from './use-user-content';

export type {
    Collection,
    CollectionVerse,
    CollectionDetail,
    Bookmark,
    Annotation,
} from './use-user-content';
