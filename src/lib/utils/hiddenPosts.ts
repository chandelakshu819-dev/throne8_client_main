// src/lib/utils/hiddenPosts.ts
const STORAGE_KEY = 'throne8_hidden_posts';

export interface HiddenPostItem {
    id: string;
    post: any;
    hiddenAt: string;
}

export const getHiddenPosts = (): HiddenPostItem[] => {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const hidePost = (post: any): void => {
    if (typeof window === 'undefined' || !post) return;
    const postId = post.entryId || post.postId || post._id || post.id;
    if (!postId) return;

    try {
        const current = getHiddenPosts();
        const exists = current.some((item) => {
            if (item.id === postId) return true;
            if (item.post) {
                const p = item.post;
                if (p.entryId === postId || p.postId === postId || p._id === postId || p.id === postId) return true;
            }
            return false;
        });

        if (!exists) {
            const newItem: HiddenPostItem = {
                id: postId,
                post: post,
                hiddenAt: new Date().toISOString(),
            };
            const updated = [newItem, ...current];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            window.dispatchEvent(new Event('hidden_posts_changed'));
        }
    } catch (err) {
        console.error('Failed to hide post in localStorage:', err);
    }
};

export const unhidePost = (postId: string): void => {
    if (typeof window === 'undefined' || !postId) return;
    try {
        const current = getHiddenPosts();
        const updated = current.filter((item) => {
            if (item.id === postId) return false;
            if (item.post) {
                const p = item.post;
                if (p.entryId === postId || p.postId === postId || p._id === postId || p.id === postId) return false;
            }
            return true;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('hidden_posts_changed'));
    } catch (err) {
        console.error('Failed to unhide post in localStorage:', err);
    }
};

export const isPostHidden = (postId: string): boolean => {
    if (typeof window === 'undefined' || !postId) return false;
    const current = getHiddenPosts();
    return current.some((item) => {
        if (item.id === postId) return true;
        if (item.post) {
            const p = item.post;
            if (p.entryId === postId || p.postId === postId || p._id === postId || p.id === postId) return true;
        }
        return false;
    });
};
