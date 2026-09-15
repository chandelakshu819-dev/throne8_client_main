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

    // ⭐ NEW: Mentorship session events
    // Backend `notification.service.ts` already sends a SESSION_STARTED
    // in-app notification on mentor's "Start" — is naam ka socket event bhi
    // agar backend emit kare to mentee ki screen turant update ho jayegi
    // bina page refresh kiye.
    MENTORSHIP_SESSION_STARTED: 'mentorship:session:started',
    MENTORSHIP_SESSION_ENDED: 'mentorship:session:ended',
    MENTORSHIP_PEER_JOINED: 'mentorship:peer-joined',
} as const;