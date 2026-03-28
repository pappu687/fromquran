import { api, isApiError } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export interface TopicNode {
    topic_id: number;
    name: string;
    arabic_name: string;
    children?: TopicNode[];
}

export interface FlatTopic {
    topic_id: number;
    name: string;
    arabic_name: string;
}

const TOPICS_STALE_TIME_MS = 5 * 60 * 1000;

async function fetchTopicsTree() {
    return api.get<TopicNode[]>('/api/topics');
}

function flattenTopics(nodes: TopicNode[]): FlatTopic[] {
    const flattened: FlatTopic[] = [];

    const walk = (items: TopicNode[]) => {
        for (const topic of items) {
            flattened.push({
                topic_id: topic.topic_id,
                name: topic.name,
                arabic_name: topic.arabic_name,
            });

            if (topic.children?.length) {
                walk(topic.children);
            }
        }
    };

    walk(nodes);

    return flattened;
}

export function useTopicsTree() {
    const query = useQuery({
        queryKey: queryKeys.topicsTree,
        queryFn: fetchTopicsTree,
        staleTime: TOPICS_STALE_TIME_MS,
    });

    return {
        ...query,
        topicsTree: query.data ?? [],
        errorMessage: query.error
            ? isApiError(query.error)
                ? query.error.message
                : 'Failed to load topics'
            : null,
    };
}

export function useFlatTopics() {
    const query = useTopicsTree();

    const topics = useMemo(
        () => flattenTopics(query.topicsTree),
        [query.topicsTree],
    );

    return {
        ...query,
        topics,
    };
}
