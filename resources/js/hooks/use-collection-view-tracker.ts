import { useEffect, useRef } from 'react';

const inFlightTrackingKeys = new Set<string>();

interface UseCollectionViewTrackerOptions {
    collectionId?: number | null;
    collectionSlug?: string | null;
    enabled?: boolean;
    minVisibleMs?: number;
    target?: HTMLElement | null;
    onTracked?: (result: { counted: boolean; views_count: number }) => void;
}

function getSessionKey(collectionId: number | null | undefined, collectionSlug: string | null | undefined) {
    if (collectionId) {
        return `viewed_collection_${collectionId}`;
    }

    if (collectionSlug) {
        return `viewed_collection_slug_${collectionSlug}`;
    }

    return null;
}

export function useCollectionViewTracker({
    collectionId,
    collectionSlug,
    enabled = true,
    minVisibleMs = 2000,
    target,
    onTracked,
}: UseCollectionViewTrackerOptions) {
    const hasSentRef = useRef(false);
    const timeoutRef = useRef<number | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const visibilitySatisfiedRef = useRef(false);
    const intersectionSatisfiedRef = useRef(false);
    const onTrackedRef = useRef(onTracked);
    const targetRef = useRef(target);

    useEffect(() => {
        onTrackedRef.current = onTracked;
    }, [onTracked]);

    useEffect(() => {
        targetRef.current = target;
    }, [target]);

    useEffect(() => {
        if (typeof window === 'undefined' || !enabled || !collectionSlug) {
            return;
        }

        const sessionKey = getSessionKey(collectionId, collectionSlug);
        const trackingKey = sessionKey ?? `viewed_collection_slug_${collectionSlug}`;

        if (
            !sessionKey ||
            sessionStorage.getItem(sessionKey) === '1' ||
            inFlightTrackingKeys.has(trackingKey)
        ) {
            hasSentRef.current = true;

            return;
        }

        const clearTimer = () => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };

        const tryScheduleSend = () => {
            if (hasSentRef.current) {
                return;
            }

            if (!visibilitySatisfiedRef.current || !intersectionSatisfiedRef.current) {
                clearTimer();

                return;
            }

            if (timeoutRef.current !== null) {
                return;
            }

            timeoutRef.current = window.setTimeout(() => {
                if (hasSentRef.current) {
                    return;
                }

                hasSentRef.current = true;
                inFlightTrackingKeys.add(trackingKey);

                const url = `/api/public/collections/${collectionSlug}/view`;
                const payload = JSON.stringify({});
                const blob = new Blob([payload], {
                    type: 'application/json',
                });

                void fetch(url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin',
                    keepalive: true,
                    body: payload,
                })
                    .then(async (response) => {
                        if (!response.ok) {
                            throw new Error(
                                'Failed to record collection view',
                            );
                        }

                        return (await response.json()) as {
                            counted: boolean;
                            views_count: number;
                        };
                    })
                    .then((result) => {
                        sessionStorage.setItem(sessionKey, '1');
                        onTrackedRef.current?.(result);
                    })
                    .catch(() => {
                        hasSentRef.current = false;
                        inFlightTrackingKeys.delete(trackingKey);

                        if (!navigator.sendBeacon) {
                            return;
                        }

                        navigator.sendBeacon(url, blob);
                        sessionStorage.setItem(sessionKey, '1');
                    })
                    .finally(() => {
                        inFlightTrackingKeys.delete(trackingKey);
                    });
            }, minVisibleMs);
        };

        const updateVisibility = () => {
            visibilitySatisfiedRef.current = document.visibilityState === 'visible';
            tryScheduleSend();
        };

        updateVisibility();

        document.addEventListener('visibilitychange', updateVisibility);

        const targetElement =
            targetRef.current ??
            document.querySelector('[data-collection-view-root]');

        if (targetElement instanceof HTMLElement) {
            observerRef.current = new IntersectionObserver(
                ([entry]) => {
                    intersectionSatisfiedRef.current =
                        entry?.isIntersecting === true &&
                        entry.intersectionRatio >= 0.5;
                    tryScheduleSend();
                },
                {
                    threshold: [0.5],
                },
            );

            observerRef.current.observe(targetElement);
        } else {
            intersectionSatisfiedRef.current = true;
            tryScheduleSend();
        }

        return () => {
            clearTimer();
            document.removeEventListener('visibilitychange', updateVisibility);
            observerRef.current?.disconnect();
            observerRef.current = null;
        };
    }, [collectionId, collectionSlug, enabled, minVisibleMs]);
}
