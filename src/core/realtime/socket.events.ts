// src/core/realtime/socket.events.ts

/**
 * Centralized socket event name constants.
 * Use these instead of hardcoding event strings across the app.
 */

export const SOCKET_EVENTS = {
    // Connection events
    CONNECTION_REQUEST_RECEIVED: 'connection:request:received',
    CONNECTION_REQUEST_ACCEPTED: 'connection:request:accepted',
    CONNECTION_REQUEST_DECLINED: 'connection:request:declined',

    // Follow events
    FOLLOW_RECEIVED: 'follow:received',
    FOLLOW_REMOVED: 'follow:removed',

    // Feed events
    FEED_NEW_POST: 'feed:new-post',
} as const;