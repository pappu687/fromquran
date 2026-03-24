import { useAnnotationsStore } from '@/store/use-user-content';
import { useCallback, useEffect } from 'react';

interface UseAnnotationsReturn {
    // Data
    annotations: typeof useAnnotationsStore.getState.annotations;

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
    clearError: () => void;
    clearSuccessMessage: () => void;
}

/**
 * Hook for managing verse annotations
 * 
 * Features:
 * - Load and manage user annotations
 * - Create new annotations with selected text
 * - Delete annotations
 * - Error and success message handling
 * 
 * @example
 * ```tsx
 * const { 
 *   annotations, loading, createAnnotation, deleteAnnotation 
 * } = useAnnotations();
 * 
 * const handleCreateAnnotation = async (verse, selectedText, note) => {
 *   const success = await createAnnotation({
 *     verse_id: verse.id,
 *     start_offset: selectionStart,
 *     end_offset: selectionEnd,
 *     selected_text: selectedText,
 *     note: note,
 *   });
 *   
 *   if (success) {
 *     showToast('Annotation created');
 *   }
 * };
 * 
 * return (
 *   <div>
 *     {annotations.map(annotation => (
 *       <AnnotationCard 
 *         key={annotation.id}
 *         annotation={annotation}
 *         onDelete={() => deleteAnnotation(annotation.id)}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useAnnotations(): UseAnnotationsReturn {
    const {
        annotations,
        loading,
        error,
        successMessage,
        loadAnnotations,
        deleteAnnotation: storeDeleteAnnotation,
        createAnnotation: storeCreateAnnotation,
        setSuccessMessage,
        setError,
        clearAnnotations,
    } = useAnnotationsStore();

    const deleteAnnotation = useCallback(
        async (annotationId: number) => {
            return storeDeleteAnnotation(annotationId);
        },
        [storeDeleteAnnotation],
    );

    const createAnnotation = useCallback(
        async (data: {
            verse_id: number;
            start_offset: number;
            end_offset: number;
            selected_text: string;
            note: string;
        }) => {
            return storeCreateAnnotation(data);
        },
        [storeCreateAnnotation],
    );

    const clearError = useCallback(() => {
        setError(null);
    }, [setError]);

    const clearSuccessMessage = useCallback(() => {
        setSuccessMessage(null);
    }, [setSuccessMessage]);

    // Auto-load annotations on mount
    useEffect(() => {
        loadAnnotations();
    }, [loadAnnotations]);

    return {
        // Data
        annotations,

        // State
        loading,
        error,
        successMessage,

        // Actions
        loadAnnotations,
        deleteAnnotation,
        createAnnotation,
        clearError,
        clearSuccessMessage,
    };
}
