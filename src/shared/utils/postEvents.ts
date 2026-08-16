// src/shared/utils/postEvents.ts
export const POST_CONTENT_UPDATED = 'post-content-updated';

export function emitPostContentUpdated(postId: string, content: string) {
    window.dispatchEvent(new CustomEvent(POST_CONTENT_UPDATED, { detail: { postId, content } }));
}

export function onPostContentUpdated(handler: (postId: string, content: string) => void) {
    const listener = (e: any) => {
        const { postId, content } = e.detail || {};
        if (postId) handler(postId, content);
    };
    window.addEventListener(POST_CONTENT_UPDATED, listener);
    return () => window.removeEventListener(POST_CONTENT_UPDATED, listener);
}