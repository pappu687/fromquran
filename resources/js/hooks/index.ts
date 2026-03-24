/**
 * Hooks Index
 * 
 * Central export point for all custom hooks.
 * 
 * @example
 * ```typescript
 * // Import all hooks
 * import { 
 *   useChapters, 
 *   useTopicDetail,
 *   useReaderSettings 
 * } from '@/hooks';
 * 
 * // Or import by category
 * import { useChapters, useBookmarks } from '@/hooks/api';
 * import { useTopicDetail, useRelatedVerse } from '@/hooks/features';
 * ```
 */

// API hooks
export * from './api';

// Feature hooks
export * from './features';

// Utility hooks (existing)
export { useStorage } from './use-storage';
export { useClipboard } from './use-clipboard';
export { useMobile } from './use-mobile';
export { useVersesPanel } from './use-verses-panel';
export { useAppearance } from './use-appearance';
export { useInitials } from './use-initials';

// Navigation hooks
export { useMobileNavigation } from './use-mobile-navigation';
