// src/components/messaging/MessageNotificationBadge.tsx
'use client';
import { useEffect, useState } from 'react';
import MessagingAPI from '@/lib/api/messaging.service';
import config from '@/config/env.config';

export function MessageNotificationBadge() {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const conversations = await MessagingAPI.getConversations();
                const total = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                setUnreadCount(total);
            } catch (e) {
                // silent fail
            }
        };

        fetchUnread();

        // Har 30 second mein refresh
        // const interval = setInterval(fetchUnread, config.NEXT_PUBLIC_API_TIMEOUT || Number(process.env.NEXT_PUBLIC_API_TIMEOUT));
        const interval = setInterval(fetchUnread, 30000); // 30 seconds — matches comment intent
        return () => clearInterval(interval);
    }, []);

    if (unreadCount === 0) return null;

    return (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
            {unreadCount > 50 ? '50+' : unreadCount}
        </span>
    );
}