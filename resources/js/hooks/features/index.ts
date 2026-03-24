/**
 * Feature Hooks Index
 *
 * Central export point for all feature-specific hooks.
 * These hooks manage complex page/component state and business logic.
 *
 * @example
 * ```typescript
 * import {
 *   useTopicDetail,
 *   useRelatedVerse,
 *   useTafsirModal,
 *   useResourcesSheet
 * } from '@/hooks/features';
 * ```
 */

export { useTopicDetail } from './use-topic-detail';
export { useRelatedChapter } from './use-related-chapter';
export { useRelatedVerse } from './use-related-verse';
export { useTafsirModal } from './use-tafsir-modal';
export { useResourcesSheet } from './use-resources-sheet';
