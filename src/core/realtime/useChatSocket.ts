//src/lib/socket/useChatSocket.ts
'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { getSocket, initializeSocket } from './socket.client';
import TokenStorage from '../../lib/store/token.storage';
import {
  socketMessageReceived,
  socketMessageEdited,
  socketMessageDeleted,
  socketReactionUpdated,
  socketUserTyping,
  socketUserStoppedTyping,
  socketUserOnline,
  socketUserOffline,
  setOnlineMembers,
  socketMemberSessionUpdate,
  setActiveSessionMembers,
  socketMemberSessionEnded,
  pruneStaleActiveMembers,
} from '@/hooks/studyGroup/features/chats/chatSlice';

export const useChatSocket = (groupId: string) => {
  const dispatch = useAppDispatch();
  const joinedRef = useRef(false); 

  useEffect(() => {
    if (!groupId || !TokenStorage.isAuthenticated()) return;

    let socket = getSocket();
    if (!socket?.connected) {
      socket = initializeSocket();
    }

    const emitJoinAndFetch = () => {
      socket!.emit('join-group', groupId);
      socket!.emit('get-active-members', { groupId });
      joinedRef.current = true;

      const currentUser = TokenStorage.getUserData();
      if (currentUser?.userId) {
        dispatch(socketUserOnline({ groupId, userId: currentUser.userId }));
      }

      socket!.off('online-users'); 
      socket!.on('online-users', (data: any) => {
        const targetGroupId = data.groupId ?? groupId; 
        const users: string[] = data.users ?? [];
        const currentUid = TokenStorage.getUserData()?.userId;
        const allUsers = currentUid && !users.includes(currentUid) ? [...users, currentUid] : users;
        dispatch(setOnlineMembers({ groupId: targetGroupId, userIds: allUsers }));
      });

      setTimeout(() => {
        socket!.emit('get-online-users', { groupId });
      }, 300); 
    };

    socket.on('connect', emitJoinAndFetch);
    const handleDisconnect = () => {
      joinedRef.current = false;
    };
    socket.on('disconnect', handleDisconnect);

    if (socket.connected && !joinedRef.current) {
      emitJoinAndFetch();
    }

    socket.on('new-message', (message: any) => {
      const normalizedMsg = {
        ...message,
        messageId: message.messageId || message._id,
        sender: message.sender?._id || message.sender,
      };
      dispatch(socketMessageReceived({ groupId, message: normalizedMsg }));
    });

    socket.on('message-edited', (message: any) => {
      dispatch(socketMessageEdited(message));
    });

    socket.on('message-deleted', (data: { messageId: string; deletedBy?: string }) => {
      dispatch(socketMessageDeleted({
        messageId: data.messageId?.toString() || (data as any)._id?.toString(),
        groupId
      }));
    });

    socket.on('message-reaction-updated', (data: { messageId: string; reactions: any[] }) => {
      dispatch(socketReactionUpdated({ ...data, groupId } as any));
    });

    socket.on('user-typing', (data: { userId: string; groupId: string }) => {
      dispatch(socketUserTyping({ groupId, userId: data.userId, name: data.userId }));
    });
    socket.on('user-stopped-typing', (data: { userId: string; groupId: string }) => {
      dispatch(socketUserStoppedTyping({ groupId, userId: data.userId }));
    });

    socket.on('user-online', (data: { userId: string }) => {
      dispatch(socketUserOnline({ groupId, userId: data.userId }));
    });

    socket.on('user-offline', (data: { userId: string }) => {
      dispatch(socketUserOffline({ groupId, userId: data.userId }));
      dispatch(socketMemberSessionEnded({ groupId, userId: data.userId }));
    });

    socket.on('user-left-group', (data: { userId: string }) => {
      dispatch(socketUserOffline({ groupId, userId: data.userId }));
      dispatch(socketMemberSessionEnded({ groupId, userId: data.userId }));
    });

    // Active members initial list / response
    socket.on('active-members', (data: { groupId: string; members: { userId: string; elapsedTime: number }[] }) => {
      const targetGroupId = data.groupId ?? groupId;
      dispatch(setActiveSessionMembers({
        groupId: targetGroupId,
        members: data.members ?? [],
      }));
    });

    // Member session update listener
    socket.on('member-session-update', (data: { userId: string; groupId: string; elapsedTime: number; timestamp?: number }) => {
      dispatch(socketMemberSessionUpdate({
        groupId: data.groupId,
        userId: data.userId,
        elapsedTime: data.elapsedTime,
        timestamp: data.timestamp || Date.now(),
      }));
    });

    // Member session paused/ended
    socket.on('member-session-paused', (data: { userId: string; groupId: string }) => {
      dispatch(socketMemberSessionEnded({
        groupId: data.groupId,
        userId: data.userId,
      }));
    });

    socket.on('member-session-ended', (data: { userId: string; groupId: string }) => {
      dispatch(socketMemberSessionEnded({
        groupId: data.groupId,
        userId: data.userId,
      }));
    });

    // Periodic stale active members cleanup (>90s timeout)
    const staleCleanupTimer = setInterval(() => {
      dispatch(pruneStaleActiveMembers({ groupId, maxAgeMs: 90000 }));
    }, 10000);

    return () => {
      clearInterval(staleCleanupTimer);
      socket!.off('connect', emitJoinAndFetch);
      socket!.off('disconnect', handleDisconnect);
      socket!.emit('leave-group', groupId);
      socket!.off('new-message');
      socket!.off('message-edited');
      socket!.off('message-deleted');
      socket!.off('message-reaction-updated');
      socket!.off('user-typing');
      socket!.off('user-stopped-typing');
      socket!.off('user-online');
      socket!.off('user-offline');
      socket!.off('user-left-group');
      socket!.off('online-users');
      socket!.off('active-members');
      socket!.off('member-session-update');
      socket!.off('member-session-paused');
      socket!.off('member-session-ended');
      joinedRef.current = false;
    };
  }, [groupId, dispatch]);

  
  const emitTyping = () => {
    const socket = getSocket();
    if (socket?.connected) socket.emit('typing', { groupId });
  };

  const emitStopTyping = () => {
    const socket = getSocket();
    if (socket?.connected) socket.emit('stop-typing', { groupId });
  };

  return { emitTyping, emitStopTyping };
};

