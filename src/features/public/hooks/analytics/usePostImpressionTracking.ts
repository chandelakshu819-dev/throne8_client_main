import { useEffect, useRef,useCallback } from 'react';
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

    // const trackPostImpression = (config: PostImpressionConfig) => {
        const trackPostImpression = useCallback((config: PostImpressionConfig) => {
        const { postId, postOwnerId, source, viewThreshold = 2000 } = config;

        // ✅ Validate required fields
        if (!postId || !postOwnerId || !source) {
            console.warn('⚠️ Missing required fields for impression tracking:', {
                postId,
                postOwnerId,
                source
            });
            return () => { }; // Return empty function
        }

        // Skip if already tracked in this session
        if (trackedPosts.current.has(postId)) {
            // console.log(`⏭️ Post ${postId} already tracked in this session`);
            return () => { };
        }

        return (element: HTMLElement | null) => {
            if (!element) return;

               // 🔑 FIX: Purana observer isi postId ke liye disconnect karo
               const existingObserver = observers.current.get(postId);
               if (existingObserver) {
                   existingObserver.disconnect();
                   observers.current.delete(postId);
               }

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        // if (entry.isIntersecting) {
                        //     const timeout = setTimeout(async () => {
                            if (entry.isIntersecting) {
                                const existingTimeout = timeouts.current.get(postId);
                                if (existingTimeout) clearTimeout(existingTimeout);
    
                                const timeout = setTimeout(async () => {
                                try {
                                    // console.log(`📊 Recording impression for post:`, {
                                    //     postId,
                                    //     postOwnerId,
                                    //     source
                                    // });

                                    const result = await AnalyticsService.recordPostImpressionSmart(
                                        postId,
                                        postOwnerId,
                                        source
                                    );

                                    // if (result) {
                                    //     trackedPosts.current.add(postId);
                                    //     // console.log(`✅ Impression recorded successfully for post ${postId}`);
                                    // }

                                    if (result) {
                                        trackedPosts.current.add(postId);
                                        observer.disconnect();
                                        observers.current.delete(postId);
                                        // console.log(`✅ Impression recorded successfully for post ${postId}`);
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
                        }
                    });
                },
                {
                    threshold: 0.5,
                    rootMargin: '0px'
                }
            );

    //         observer.observe(element);
    //         observers.current.set(postId, observer);
    //     };
    // };
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
        };
    }, []);

    return { trackPostImpression };
};