import { api, getErrorMessage } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { type Annotation } from '@/store/use-user-content';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

interface CreateAnnotationInput {
    verse_id: number;
    start_offset: number;
    end_offset: number;
    selected_text: string;
    note: string;
}

interface UseAnnotationsReturn {
    annotations: Annotation[];
    loading: boolean;
    error: string | null;
    successMessage: string | null;
    loadAnnotations: () => Promise<void>;
    deleteAnnotation: (annotationId: number) => Promise<boolean>;
    createAnnotation: (data: CreateAnnotationInput) => Promise<boolean>;
    clearError: () => void;
    clearSuccessMessage: () => void;
}

async function fetchAnnotations() {
    const response = await api.get<{ data: Annotation[] }>(
        '/api/verse-annotations?all=1',
    );

    return response.data || [];
}

export function useAnnotations(): UseAnnotationsReturn {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const annotationsQuery = useQuery({
        queryKey: queryKeys.userAnnotations,
        queryFn: fetchAnnotations,
    });

    useEffect(() => {
        if (annotationsQuery.error) {
            setError(getErrorMessage(annotationsQuery.error));
        }
    }, [annotationsQuery.error]);

    const deleteAnnotationMutation = useMutation({
        mutationFn: async (annotationId: number) => {
            await api.delete(`/api/verse-annotations/${annotationId}`);

            return annotationId;
        },
        onSuccess: (annotationId) => {
            queryClient.setQueryData<Annotation[]>(
                queryKeys.userAnnotations,
                (current = []) =>
                    current.filter(
                        (annotation) => annotation.id !== annotationId,
                    ),
            );
            setSuccessMessage('Annotation deleted');
            setError(null);
        },
        onError: (mutationError) => {
            setError(getErrorMessage(mutationError));
        },
    });

    const createAnnotationMutation = useMutation({
        mutationFn: async (data: CreateAnnotationInput) => {
            await api.post('/api/verse-annotations', data);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.userAnnotations,
            });
            setSuccessMessage('Annotation created');
            setError(null);
        },
        onError: (mutationError) => {
            setError(getErrorMessage(mutationError));
        },
    });

    const loadAnnotations = useCallback(async () => {
        setError(null);
        await queryClient.invalidateQueries({
            queryKey: queryKeys.userAnnotations,
        });
    }, [queryClient]);

    const deleteAnnotation = useCallback(
        async (annotationId: number) => {
            try {
                await deleteAnnotationMutation.mutateAsync(annotationId);

                return true;
            } catch {
                return false;
            }
        },
        [deleteAnnotationMutation],
    );

    const createAnnotation = useCallback(
        async (data: CreateAnnotationInput) => {
            try {
                await createAnnotationMutation.mutateAsync(data);

                return true;
            } catch {
                return false;
            }
        },
        [createAnnotationMutation],
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const clearSuccessMessage = useCallback(() => {
        setSuccessMessage(null);
    }, []);

    return {
        annotations: annotationsQuery.data ?? [],
        loading:
            annotationsQuery.isLoading ||
            deleteAnnotationMutation.isPending ||
            createAnnotationMutation.isPending,
        error,
        successMessage,
        loadAnnotations,
        deleteAnnotation,
        createAnnotation,
        clearError,
        clearSuccessMessage,
    };
}
