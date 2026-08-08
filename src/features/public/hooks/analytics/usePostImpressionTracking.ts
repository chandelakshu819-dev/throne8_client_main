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
    const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
    // ✅ NEW: post visible hua tab ka timestamp store karte hain, taaki
    // exit/unmount ke time actual dwell duration nikaal sakein
    const entryTimestamps = useRef<Map<string, number>>(new Map());

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

        if (trackedPosts.current.has(postId)) {
            return () => { };
        }

        return (element: HTMLElement | null) => {
            if (!element) return;

            const existingObserver = observers.current.get(postId);
            if (existingObserver) {
                existingObserver.disconnect();
                observers.current.delete(postId);
            }

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            // ✅ NEW: entry timestamp record karo jab post pehli baar visible ho
                            if (!entryTimestamps.current.has(postId)) {
                                entryTimestamps.current.set(postId, Date.now());
                            }

                            const existingTimeout = timeouts.current.get(postId);
                            if (existingTimeout) clearTimeout(existingTimeout);

                            const timeout = setTimeout(async () => {
                                try {
                                    // ✅ NEW: is point tak post kitni der visible raha, wahi duration bhejo
                                    const entryTime = entryTimestamps.current.get(postId) || Date.now();
                                    const durationMs = Date.now() - entryTime;
                                    const durationSeconds = Math.round(durationMs / 1000);

                                    const result = await AnalyticsService.recordPostImpressionSmart(
                                        postId,
                                        postOwnerId,
                                        source,
                                        durationSeconds
                                    );

                                    if (result) {
                                        trackedPosts.current.add(postId);
                                        observer.disconnect();
                                        observers.current.delete(postId);
                                    }
                                } catch (error) {
                                    console.error(`❌ Failed to record impression:`, error);
                                }
                            }, viewThreshold);

                            timeouts.current.set(postId, timeout);
                        } else {
                            const timeout = timeouts.current.get(postId);
                            if (timeout) {
                                clearTimeout(timeout);
                                timeouts.current.delete(postId);
                            }
                            // ✅ NEW: post invisible ho gaya (scroll away) — entry timestamp reset karo
                            // taaki agli baar visible hone par fresh se dwell time measure ho
                            entryTimestamps.current.delete(postId);
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
        };
    }, []);

    useEffect(() => {
        return () => {
            observers.current.forEach((observer) => observer.disconnect());
            timeouts.current.forEach((timeout) => clearTimeout(timeout));
            observers.current.clear();
            timeouts.current.clear();
            entryTimestamps.current.clear();
        };
    }, []);

    return { trackPostImpression };
};