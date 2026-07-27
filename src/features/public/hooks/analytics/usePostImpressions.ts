import { useEffect, useRef, useCallback } from 'react';
import AnalyticsService from '@/lib/api/analytics.service';

interface PostImpressionConfig {
    postId: string;
    postOwnerId: string;
    source: 'feed' | 'profile' | 'search' | 'hashtag' | 'direct';
    viewThreshold?: number;
}

export const usePostImpressionTracking = () => {
    const trackedPosts = useRef<Set<string>>(new Set());
    const observers = useRef<Map<string, IntersectionObserver>>(new Map());
    const observedElements = useRef<Map<string, HTMLElement>>(new Map());
    const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const inFlight = useRef<Set<string>>(new Set());

    // ✅ Memoized so identity stays stable across re-renders for the same postId.
    // We key the memoization by postId via a ref-map of created callbacks.
    const callbackCache = useRef<Map<string, (element: HTMLElement | null) => void>>(new Map());

    const cleanupPost = useCallback((postId: string) => {
        const observer = observers.current.get(postId);
        if (observer) {
            observer.disconnect();
            observers.current.delete(postId);
        }
        const timeout = timeouts.current.get(postId);
        if (timeout) {
            clearTimeout(timeout);
            timeouts.current.delete(postId);
        }
        observedElements.current.delete(postId);
    }, []);

    const trackPostImpression = useCallback((config: PostImpressionConfig) => {
        const { postId, postOwnerId, source, viewThreshold = 2000 } = config;

        if (!postId || !postOwnerId || !source) {
            console.warn('⚠️ Missing required fields for impression tracking:', {
                postId,
                postOwnerId,
                source
            });
            return () => { };
        }

        // Already recorded this session — no-op ref.
        if (trackedPosts.current.has(postId)) {
            return () => { };
        }

        // ✅ Return a CACHED callback per postId instead of a fresh function
        // every render. This keeps the ref identity stable across re-renders
        // so React doesn't tear down + recreate the observer on every parent update.
        const cached = callbackCache.current.get(postId);
        if (cached) {
            return cached;
        }

        const refCallback = (element: HTMLElement | null) => {
            if (!element) {
                // Element unmounted (e.g. post removed from DOM) — clean up properly.
                cleanupPost(postId);
                return;
            }

            // ✅ Guard: if we're already observing this exact element for this
            // postId, don't create a second observer.
            const alreadyObservedElement = observedElements.current.get(postId);
            if (alreadyObservedElement === element && observers.current.has(postId)) {
                return;
            }

            // If a different element was previously observed for this postId
            // (rare, but possible on key reuse), tear it down first.
            if (observers.current.has(postId)) {
                cleanupPost(postId);
            }

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const timeout = setTimeout(async () => {
                                // Extra guard against overlapping in-flight requests
                                // for the same post.
                                if (trackedPosts.current.has(postId) || inFlight.current.has(postId)) {
                                    return;
                                }
                                inFlight.current.add(postId);

                                try {
                                    const result = await AnalyticsService.recordPostImpressionSmart(
                                        postId,
                                        postOwnerId,
                                        source
                                    );

                                    if (result) {
                                        trackedPosts.current.add(postId);
                                        // Impression recorded — no need to keep watching this post.
                                        cleanupPost(postId);
                                    }
                                } catch (error) {
                                    console.error(`❌ Failed to record impression:`, error);
                                } finally {
                                    inFlight.current.delete(postId);
                                }
                            }, viewThreshold);

                            timeouts.current.set(postId, timeout);
                        } else {
                            const timeout = timeouts.current.get(postId);
                            if (timeout) {
                                clearTimeout(timeout);
                                timeouts.current.delete(postId);
                            }
                        }
                    });
                },
                {
                    threshold: 0.5,
                    rootMargin: '0px'
                }
            );

            observer.observe(element);
            observers.current.set(postId, observer);
            observedElements.current.set(postId, element);
        };

        callbackCache.current.set(postId, refCallback);
        return refCallback;
    }, [cleanupPost]);

    useEffect(() => {
        return () => {
            observers.current.forEach((observer) => observer.disconnect());
            timeouts.current.forEach((timeout) => clearTimeout(timeout));
            observers.current.clear();
            timeouts.current.clear();
            observedElements.current.clear();
            callbackCache.current.clear();
            inFlight.current.clear();
        };
    }, []);

    return { trackPostImpression };
};