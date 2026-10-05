
//src/hooks/studyGroup/features/chats/chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FileUploadResponse, MessageResponse } from '@/lib/api/studyGroup.service';
import {
  fetchMessagesThunk, sendMessageThunk, editMessageThunk, deleteMessageThunk, reactToMessageThunk, togglePinMessageThunk, fetchPinnedMessagesThunk, markMessageReadThunk, uploadChatFileThunk, fetchGroupFilesThunk, fetchGroupPinnedFilesThunk, uploadGroupFileThunk, deleteGroupFileThunk, togglePinGroupFileThunk, fetchGroupDoubtsThunk, postDoubtThunk, deleteDoubtThunk, markDoubtSolvedThunk, postAnswerThunk, fetchDoubtAnswersThunk, upvoteAnswerThunk, downvoteAnswerThunk, deleteAnswerThunk, updateAnswerThunk, removeAnswerVoteThunk,
  updateDoubtThunk,
  upvoteDoubtThunk,
} from './chat.thunks';

interface ChatState {
  // messages per group
  messagesByGroup: Record<string, MessageResponse[]>;
  messagesLoading: boolean;
  hasMoreByGroup: Record<string, boolean>;
  currentPageByGroup: Record<string, number>;

  // pinned messages per group
  pinnedByGroup: Record<string, MessageResponse[]>;
  pinnedLoading: boolean;

  // active group
  activeGroupId: string | null;

  // send
  sendLoading: boolean;

  // edit
  editLoading: boolean;
  editingMessage: MessageResponse | null;

  // delete
  deleteLoading: boolean;

  // react
  reactLoading: boolean;

  // pin
  pinLoading: boolean;

  // reply
  replyingToMessage: MessageResponse | null;

  // file upload
  uploadLoading: boolean;
  uploadProgress: number;

  // typing users per group
  typingUsersByGroup: Record<string, { userId: string; name: string }[]>;

  // online members per group (from socket)
  onlineMembersByGroup: Record<string, string[]>;

  //FILE 
  filesByGroup: Record<string, FileUploadResponse[]>;
  pinnedFilesByGroup: Record<string, FileUploadResponse[]>;
  filesLoading: boolean;
  pinnedFilesLoading: boolean;
  fileUploadLoading: boolean;
  fileUploadProgress: number;
  fileDeleteLoading: boolean;
  filePinLoading: boolean;
  filesTotalByGroup: Record<string, number>;

  // DOUBT STATE
  doubtsByGroup: Record<string, any[]>;
  doubtAnswers: Record<string, any[]>;
  doubtsLoading: boolean;
  doubtPostLoading: boolean;
  doubtDeleteLoading: boolean;
  answerPostLoading: boolean;
  answerVoteLoading: boolean;

  memberSessionTimes: Record<string, Record<string, number>>,

  error: string | null;
}

const initialState: ChatState = {
  messagesByGroup: {},
  messagesLoading: false,
  hasMoreByGroup: {},
  currentPageByGroup: {},
  pinnedByGroup: {},
  pinnedLoading: false,
  activeGroupId: null,
  sendLoading: false,
  editLoading: false,
  editingMessage: null,
  deleteLoading: false,
  reactLoading: false,
  pinLoading: false,
  replyingToMessage: null,
  uploadLoading: false,
  uploadProgress: 0,
  typingUsersByGroup: {},
  onlineMembersByGroup: {},
  filesByGroup: {},
  pinnedFilesByGroup: {},
  filesLoading: false,
  pinnedFilesLoading: false,
  fileUploadLoading: false,
  fileUploadProgress: 0,
  fileDeleteLoading: false,
  filePinLoading: false,
  filesTotalByGroup: {},

  doubtsByGroup: {},
  doubtAnswers: {},
  doubtsLoading: false,
  doubtPostLoading: false,
  doubtDeleteLoading: false,
  answerPostLoading: false,
  answerVoteLoading: false,

  memberSessionTimes: {},
  error: null,


};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveGroupId: (state, action: PayloadAction<string>) => {
      state.activeGroupId = action.payload;
    },
    setEditingMessage: (state, action: PayloadAction<MessageResponse | null>) => {
      state.editingMessage = action.payload;
    },
    setReplyingToMessage: (state, action: PayloadAction<MessageResponse | null>) => {
      state.replyingToMessage = action.payload;
    },
    // Socket: new message received
    socketMessageReceived: (state, action: PayloadAction<{ groupId: string; message: MessageResponse }>) => {
      const { groupId, message } = action.payload;
      if (!state.messagesByGroup[groupId]) state.messagesByGroup[groupId] = [];
      const msgId = message.messageId || (message as any)._id;
      // avoid duplicate
      const exists = state.messagesByGroup[groupId].some(
        m => m && (m.messageId === msgId || (m as any)._id === msgId)
      );
      if (!exists) {
        state.messagesByGroup[groupId].push({
          ...message,
          messageId: msgId,
        });
      }
    },
    // Socket: message edited
    socketMessageEdited: (state, action: PayloadAction<MessageResponse>) => {
      const msg = action.payload;
      const groupMessages = state.messagesByGroup[msg.groupId];
      if (groupMessages) {
        const idx = groupMessages.findIndex(m => m && m.messageId === msg.messageId);
        if (idx !== -1) groupMessages[idx] = msg;
      }
    },
    // Socket: message deleted
    socketMessageDeleted: (state, action: PayloadAction<{ messageId: string; groupId: string }>) => {
      const { messageId, groupId } = action.payload;
      if (state.messagesByGroup[groupId]) {
        state.messagesByGroup[groupId] = state.messagesByGroup[groupId].filter(
          m => m && m.messageId !== messageId
        );
      }
    },
    // Socket: reaction updated
    socketReactionUpdated: (state, action: PayloadAction<{
      messageId: string;
      groupId: string;
      reactions: any[]
    }>) => {
      const { messageId, groupId, reactions } = action.payload;
      const groupMessages = state.messagesByGroup[groupId];
      if (groupMessages) {
        const idx = groupMessages.findIndex(m => m && m.messageId === messageId);
        if (idx !== -1) groupMessages[idx].reactions = reactions;
      }
    },

    // socketReactionUpdated: (state, action: PayloadAction<MessageResponse>) => {
    //   const msg = action.payload;
    //   const groupMessages = state.messagesByGroup[msg.groupId];
    //   if (groupMessages) {
    //     const idx = groupMessages.findIndex(m => m.messageId === msg.messageId);
    //     if (idx !== -1) groupMessages[idx].reactions = msg.reactions;
    //   }
    // },
    // Socket: typing
    socketUserTyping: (state, action: PayloadAction<{ groupId: string; userId: string; name: string }>) => {
      const { groupId, userId, name } = action.payload;
      if (!state.typingUsersByGroup[groupId]) state.typingUsersByGroup[groupId] = [];
      const alreadyTyping = state.typingUsersByGroup[groupId].some(u => u.userId === userId);
      if (!alreadyTyping) {
        state.typingUsersByGroup[groupId].push({ userId, name });
      }
    },
    // socketUserStoppedTyping: (state, action: PayloadAction<{ groupId: string; userId: string }>) => {
    //   const { groupId, userId } = action.payload;
    //   if (state.typingUsersByGroup[groupId]) {
    //     // remove by userId — you'll need to map, keep simple for now
    //     state.typingUsersByGroup[groupId] = [];
    //   }
    // },
    socketUserStoppedTyping: (state, action: PayloadAction<{ groupId: string; userId: string }>) => {
      const { groupId, userId } = action.payload;
      if (state.typingUsersByGroup[groupId]) {
        state.typingUsersByGroup[groupId] = state.typingUsersByGroup[groupId].filter(
          u => u.userId !== userId
        );
      }
    },
    // Socket: online presence
    socketUserOnline: (state, action: PayloadAction<{ groupId: string; userId: string }>) => {
      const { groupId, userId } = action.payload;
      if (!state.onlineMembersByGroup[groupId]) state.onlineMembersByGroup[groupId] = [];
      if (!state.onlineMembersByGroup[groupId].includes(userId)) {
        state.onlineMembersByGroup[groupId].push(userId);
      }
    },
    socketUserOffline: (state, action: PayloadAction<{ groupId: string; userId: string }>) => {
      const { groupId, userId } = action.payload;
      if (state.onlineMembersByGroup[groupId]) {
        state.onlineMembersByGroup[groupId] = state.onlineMembersByGroup[groupId].filter(
          id => id !== userId
        );
      }
    },
    clearGroupChat: (state, action: PayloadAction<string>) => {
      const groupId = action.payload;
      delete state.messagesByGroup[groupId];
      delete state.pinnedByGroup[groupId];
      delete state.hasMoreByGroup[groupId];
      delete state.currentPageByGroup[groupId];
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },

    // ADD inside reducers object
    addOptimisticMessage: (state, action: PayloadAction<{ groupId: string; message: any }>) => {
      const { groupId, message } = action.payload;
      if (!state.messagesByGroup[groupId]) state.messagesByGroup[groupId] = [];
      state.messagesByGroup[groupId].push(message);
    },
    removeOptimisticMessage: (state, action: PayloadAction<{ groupId: string; messageId: string }>) => {
      const { groupId, messageId } = action.payload;
      if (state.messagesByGroup[groupId]) {
        state.messagesByGroup[groupId] = state.messagesByGroup[groupId].filter(
          m => m.messageId !== messageId
        );
      }
    },

    socketMemberSessionUpdate: (state, action) => {
      const { groupId, userId, elapsedTime } = action.payload;
      if (!state.memberSessionTimes[groupId]) {
        state.memberSessionTimes[groupId] = {};
      }
      state.memberSessionTimes[groupId][userId] = elapsedTime;
    },
  },
  extraReducers: (builder) => {
    // fetch messages
    builder
      .addCase(fetchMessagesThunk.pending, (state) => { state.messagesLoading = true; state.error = null; })
      .addCase(fetchMessagesThunk.fulfilled, (state, action) => {
        state.messagesLoading = false;
        const { groupId, messages, hasMore, currentPage } = action.payload;
        // page 1 = update latest messages preserving older pages, page 2+ = prepend (load more)
        if (currentPage === 1) {
          const existing = state.messagesByGroup[groupId] ?? [];
          if (existing.length === 0) {
            state.messagesByGroup[groupId] = messages;
          } else {
            // Keep older messages loaded from higher pages, replace/append latest page 1 messages without duplicate or flicker
            const incomingIds = new Set(messages.map((m: any) => m.messageId || m._id));
            const olderKept = existing.filter((m: any) => !incomingIds.has(m.messageId || m._id));
            state.messagesByGroup[groupId] = [...olderKept, ...messages];
          }
        } else {
          const existing = state.messagesByGroup[groupId] ?? [];
          const existingIds = new Set(existing.map((m: any) => m.messageId || m._id));
          const olderNewMsgs = messages.filter((m: any) => !existingIds.has(m.messageId || m._id));
          state.messagesByGroup[groupId] = [
            ...olderNewMsgs,
            ...existing
          ];
        }
        state.hasMoreByGroup[groupId] = hasMore;
        state.currentPageByGroup[groupId] = currentPage;
      })
      .addCase(fetchMessagesThunk.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload as string;
      });

    // send message
    builder
      .addCase(sendMessageThunk.pending, (state) => { state.sendLoading = true; })
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        state.sendLoading = false;
        state.replyingToMessage = null;
        const rawMessage = action.payload?.message;
        const message = rawMessage?.data || rawMessage;
        const messageId = message?.messageId || message?._id;
        if (messageId) {
          const { groupId } = action.payload;
          if (!state.messagesByGroup[groupId]) state.messagesByGroup[groupId] = [];
          const exists = state.messagesByGroup[groupId].some(
            m => m && (m.messageId === messageId || (m as any)._id === messageId)
          );
          if (!exists) {
            state.messagesByGroup[groupId].push({
              ...message,
              messageId,
            });
          }
        }
      })
      // .addCase(sendMessageThunk.rejected, (state, action) => {
      //   state.sendLoading = false;
      //   state.error = action.payload as string;
      // });
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.sendLoading = false;
        state.error = action.payload as string;
        // Optimistic message remove karo — but messageId kaise pata?
      })

    // edit message
    builder
      .addCase(editMessageThunk.pending, (state) => { state.editLoading = true; })
      .addCase(editMessageThunk.fulfilled, (state, action) => {
        state.editLoading = false;
        state.editingMessage = null;
        const msg = action.payload;
        const groupMessages = state.messagesByGroup[msg.groupId];
        if (groupMessages) {
          const idx = groupMessages.findIndex(m => m && m.messageId === msg.messageId);
          if (idx !== -1) groupMessages[idx] = msg;
        }
      })
      .addCase(editMessageThunk.rejected, (state, action) => {
        state.editLoading = false;
        state.error = action.payload as string;
      });

    // delete message
    builder
      .addCase(deleteMessageThunk.pending, (state) => { state.deleteLoading = true; })
      .addCase(deleteMessageThunk.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // messageId returned — remove from all groups
        const messageId = action.payload;
        Object.keys(state.messagesByGroup).forEach(groupId => {
          state.messagesByGroup[groupId] = state.messagesByGroup[groupId].filter(
            m => m && m.messageId !== messageId
          );
        });
      })
      .addCase(deleteMessageThunk.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload as string;
      });

    // react
    builder
      .addCase(reactToMessageThunk.pending, (state) => { state.reactLoading = true; })
      .addCase(reactToMessageThunk.fulfilled, (state, action) => {
        state.reactLoading = false;
        const msg = action.payload;
        const groupMessages = state.messagesByGroup[msg.groupId];
        if (groupMessages) {
          const idx = groupMessages.findIndex(m => m && m.messageId === msg.messageId);
          if (idx !== -1) groupMessages[idx].reactions = msg.reactions;
        }
      })
      .addCase(reactToMessageThunk.rejected, (state, action) => {
        state.reactLoading = false;
        state.error = action.payload as string;
      });

    // toggle pin
    builder
      .addCase(togglePinMessageThunk.pending, (state) => { state.pinLoading = true; })
      .addCase(togglePinMessageThunk.fulfilled, (state, action) => {
        state.pinLoading = false;
        const msg = action.payload;
        const groupMessages = state.messagesByGroup[msg.groupId];
        if (groupMessages) {
          const idx = groupMessages.findIndex(m => m && m.messageId === msg.messageId);
          if (idx !== -1) groupMessages[idx].isPinned = msg.isPinned;
        }
        // update pinnedByGroup
        if (msg.isPinned) {
          if (!state.pinnedByGroup[msg.groupId]) state.pinnedByGroup[msg.groupId] = [];
          state.pinnedByGroup[msg.groupId].push(msg);
        } else {
          if (state.pinnedByGroup[msg.groupId]) {
            state.pinnedByGroup[msg.groupId] = state.pinnedByGroup[msg.groupId].filter(
              m => m && m.messageId !== msg.messageId
            );
          }
        }
      })
      .addCase(togglePinMessageThunk.rejected, (state, action) => {
        state.pinLoading = false;
        state.error = action.payload as string;
      });

    // fetch pinned
    builder
      .addCase(fetchPinnedMessagesThunk.pending, (state) => { state.pinnedLoading = true; })
      .addCase(fetchPinnedMessagesThunk.fulfilled, (state, action) => {
        state.pinnedLoading = false;
        state.pinnedByGroup[action.payload.groupId] = action.payload.messages;
      })
      .addCase(fetchPinnedMessagesThunk.rejected, (state, action) => {
        state.pinnedLoading = false;
        state.error = action.payload as string;
      });

    // file upload
    builder
      .addCase(uploadChatFileThunk.pending, (state) => { state.uploadLoading = true; state.uploadProgress = 0; })
      .addCase(uploadChatFileThunk.fulfilled, (state) => { state.uploadLoading = false; state.uploadProgress = 100; })
      .addCase(uploadChatFileThunk.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload as string;
      });

    // file reducers
    // ── Fetch group files ──
    builder
      .addCase(fetchGroupFilesThunk.pending, (state) => {
        state.filesLoading = true;
        state.error = null;
      })
      .addCase(fetchGroupFilesThunk.fulfilled, (state, action) => {
        state.filesLoading = false;
        const { groupId, files, total } = action.payload;
        state.filesByGroup[groupId] = files;
        state.filesTotalByGroup[groupId] = total;
      })
      .addCase(fetchGroupFilesThunk.rejected, (state, action) => {
        state.filesLoading = false;
        state.error = action.payload as string;
      });

    // ── Fetch pinned files ──
    builder
      .addCase(fetchGroupPinnedFilesThunk.pending, (state) => {
        state.pinnedFilesLoading = true;
      })
      .addCase(fetchGroupPinnedFilesThunk.fulfilled, (state, action) => {
        state.pinnedFilesLoading = false;
        state.pinnedFilesByGroup[action.payload.groupId] = action.payload.files;
      })
      .addCase(fetchGroupPinnedFilesThunk.rejected, (state, action) => {
        state.pinnedFilesLoading = false;
        state.error = action.payload as string;
      });

    // ── Upload file ──
    builder
      .addCase(uploadGroupFileThunk.pending, (state) => {
        state.fileUploadLoading = true;
        state.fileUploadProgress = 0;
      })
      .addCase(uploadGroupFileThunk.fulfilled, (state, action) => {
        state.fileUploadLoading = false;
        state.fileUploadProgress = 100;
        const { groupId, file } = action.payload;
        if (!state.filesByGroup[groupId]) state.filesByGroup[groupId] = [];
        // add at top — newest first
        state.filesByGroup[groupId].unshift(file);
        if (state.filesTotalByGroup[groupId] !== undefined) {
          state.filesTotalByGroup[groupId] += 1;
        }
      })
      .addCase(uploadGroupFileThunk.rejected, (state, action) => {
        state.fileUploadLoading = false;
        state.error = action.payload as string;
      });

    // ── Delete file ──
    builder
      .addCase(deleteGroupFileThunk.pending, (state) => {
        state.fileDeleteLoading = true;
      })
      .addCase(deleteGroupFileThunk.fulfilled, (state, action) => {
        state.fileDeleteLoading = false;
        const { groupId, fileId } = action.payload;
        if (state.filesByGroup[groupId]) {
          state.filesByGroup[groupId] = state.filesByGroup[groupId].filter(
            f => f.fileId !== fileId
          );
        }
        if (state.pinnedFilesByGroup[groupId]) {
          state.pinnedFilesByGroup[groupId] = state.pinnedFilesByGroup[groupId].filter(
            f => f.fileId !== fileId
          );
        }
        if (state.filesTotalByGroup[groupId] !== undefined) {
          state.filesTotalByGroup[groupId] = Math.max(0, state.filesTotalByGroup[groupId] - 1);
        }
      })
      .addCase(deleteGroupFileThunk.rejected, (state, action) => {
        state.fileDeleteLoading = false;
        state.error = action.payload as string;
      });

    // ── Toggle pin file ──
    builder
      .addCase(togglePinGroupFileThunk.pending, (state) => {
        state.filePinLoading = true;
      })
      .addCase(togglePinGroupFileThunk.fulfilled, (state, action) => {
        state.filePinLoading = false;
        const { groupId, fileId, isPinned } = action.payload;

        // update isPinned in filesByGroup
        if (state.filesByGroup[groupId]) {
          const idx = state.filesByGroup[groupId].findIndex(f => f.fileId === fileId);
          if (idx !== -1) state.filesByGroup[groupId][idx].isPinned = isPinned;
        }

        // update pinnedFilesByGroup
        if (isPinned) {
          const file = state.filesByGroup[groupId]?.find(f => f.fileId === fileId);
          if (file) {
            if (!state.pinnedFilesByGroup[groupId]) state.pinnedFilesByGroup[groupId] = [];
            const alreadyPinned = state.pinnedFilesByGroup[groupId].some(f => f.fileId === fileId);
            if (!alreadyPinned) state.pinnedFilesByGroup[groupId].unshift(file);
          }
        } else {
          if (state.pinnedFilesByGroup[groupId]) {
            state.pinnedFilesByGroup[groupId] = state.pinnedFilesByGroup[groupId].filter(
              f => f.fileId !== fileId
            );
          }
        }
      })
      .addCase(togglePinGroupFileThunk.rejected, (state, action) => {
        state.filePinLoading = false;
        state.error = action.payload as string;
      });

    // ── Fetch doubts ──
    builder
      .addCase(fetchGroupDoubtsThunk.pending, (state) => { state.doubtsLoading = true; })
      .addCase(fetchGroupDoubtsThunk.fulfilled, (state, action) => {
        state.doubtsLoading = false;
        const { groupId, doubts } = action.payload;
        state.doubtsByGroup[groupId] = doubts;
      })
      .addCase(fetchGroupDoubtsThunk.rejected, (state, action) => {
        state.doubtsLoading = false;
        state.error = action.payload as string;
      });

    // ── Post doubt ──
    builder
      .addCase(postDoubtThunk.pending, (state) => { state.doubtPostLoading = true; })
      .addCase(postDoubtThunk.fulfilled, (state, action) => {
        state.doubtPostLoading = false;
        const { groupId, doubt } = action.payload;
        if (!state.doubtsByGroup[groupId]) state.doubtsByGroup[groupId] = [];
        state.doubtsByGroup[groupId].unshift(doubt);
      })
      .addCase(postDoubtThunk.rejected, (state, action) => {
        state.doubtPostLoading = false;
        state.error = action.payload as string;
      });

    // ── Delete doubt ──
    builder
      .addCase(deleteDoubtThunk.pending, (state) => { state.doubtDeleteLoading = true; })
      .addCase(deleteDoubtThunk.fulfilled, (state, action) => {
        state.doubtDeleteLoading = false;
        const { groupId, doubtId } = action.payload;
        if (state.doubtsByGroup[groupId]) {
          state.doubtsByGroup[groupId] = state.doubtsByGroup[groupId].filter(
            d => d.doubtId !== doubtId
          );
        }
      })
      .addCase(deleteDoubtThunk.rejected, (state, action) => {
        state.doubtDeleteLoading = false;
        state.error = action.payload as string;
      });

    // ── Mark solved ──
    builder
      .addCase(markDoubtSolvedThunk.fulfilled, (state, action) => {
        const { groupId, doubt } = action.payload;
        if (state.doubtsByGroup[groupId]) {
          const idx = state.doubtsByGroup[groupId].findIndex(d => d.doubtId === doubt.doubtId);
          if (idx !== -1) state.doubtsByGroup[groupId][idx] = doubt;
        }
      });

    // ── Post answer ──
    builder
      .addCase(postAnswerThunk.pending, (state) => { state.answerPostLoading = true; })
      .addCase(postAnswerThunk.fulfilled, (state, action) => {
        state.answerPostLoading = false;
        const { doubtId, answer } = action.payload;
        if (!state.doubtAnswers[doubtId]) state.doubtAnswers[doubtId] = [];
        state.doubtAnswers[doubtId].push(answer);
      })
      .addCase(postAnswerThunk.rejected, (state, action) => {
        state.answerPostLoading = false;
        state.error = action.payload as string;
      });

    // ── Fetch answers ──
    builder
      .addCase(fetchDoubtAnswersThunk.fulfilled, (state, action) => {
        const { doubtId, answers } = action.payload;
        state.doubtAnswers[doubtId] = answers;
      });

    // ── Upvote/Downvote ──
    builder
      .addCase(upvoteAnswerThunk.pending, (state) => { state.answerVoteLoading = true; })
      // .addCase(upvoteAnswerThunk.fulfilled, (state, action) => {
      //   state.answerVoteLoading = false;
      //   const { doubtId, answerId, upvotes, downvotes } = action.payload;
      //   if (state.doubtAnswers[doubtId]) {
      //     const idx = state.doubtAnswers[doubtId].findIndex(a => a.answerId === answerId);
      //     if (idx !== -1) {
      //       state.doubtAnswers[doubtId][idx].upvotes = upvotes;
      //       state.doubtAnswers[doubtId][idx].downvotes = downvotes;
      //     }
      //   }
      // })

      .addCase(upvoteAnswerThunk.fulfilled, (state, action) => {
        state.answerVoteLoading = false;
        const { doubtId, answerId, upvotes, downvotes } = action.payload;
        if (state.doubtAnswers[doubtId]) {
          const idx = state.doubtAnswers[doubtId].findIndex(a => a.answerId === answerId);
          if (idx !== -1) {
            state.doubtAnswers[doubtId][idx].upvotes = upvotes;
            state.doubtAnswers[doubtId][idx].downvotes = downvotes;
            state.doubtAnswers[doubtId][idx].userVote = 'up';
          }
        }
      })
      .addCase(upvoteAnswerThunk.rejected, (state, action) => {
        state.answerVoteLoading = false;
      });

    builder
      .addCase(downvoteAnswerThunk.pending, (state) => { state.answerVoteLoading = true; })
      .addCase(removeAnswerVoteThunk.fulfilled, (state, action) => {
        const { doubtId, answerId } = action.payload;
        if (state.doubtAnswers[doubtId]) {
          const idx = state.doubtAnswers[doubtId].findIndex(a => a.answerId === answerId);
          if (idx !== -1) {
            const ans = state.doubtAnswers[doubtId][idx];
            if (ans.userVote === 'up' && ans.upvotes > 0) ans.upvotes -= 1;
            if (ans.userVote === 'down' && ans.downvotes > 0) ans.downvotes -= 1;
            ans.userVote = null;
          }
        }
      })
      .addCase(downvoteAnswerThunk.rejected, (state, action) => {
        state.answerVoteLoading = false;
      });

    // ── Delete answer ──
    builder
      .addCase(deleteAnswerThunk.fulfilled, (state, action) => {
        const { doubtId, answerId } = action.payload;
        if (state.doubtAnswers[doubtId]) {
          state.doubtAnswers[doubtId] = state.doubtAnswers[doubtId].filter(
            a => a.answerId !== answerId
          );
        }
      });

    // ── Update answer ──
    builder
      .addCase(updateAnswerThunk.fulfilled, (state, action) => {
        const { doubtId, answer } = action.payload;
        if (state.doubtAnswers[doubtId]) {
          const idx = state.doubtAnswers[doubtId].findIndex(
            a => a.answerId === answer.answerId
          );
          if (idx !== -1) state.doubtAnswers[doubtId][idx] = answer;
        }
      });



    builder.addCase(updateDoubtThunk.fulfilled, (state, action) => {
      const doubt = action.payload;
      Object.keys(state.doubtsByGroup).forEach(groupId => {
        const idx = state.doubtsByGroup[groupId]?.findIndex(d => d.doubtId === doubt.doubtId);
        if (idx !== -1) state.doubtsByGroup[groupId][idx] = doubt;
      });
    });

    builder.addCase(upvoteDoubtThunk.fulfilled, (state, action) => {
      const { groupId, doubtId, upvotes, isUpvoted } = action.payload;
      if (state.doubtsByGroup[groupId]) {
        const idx = state.doubtsByGroup[groupId].findIndex(d => d.doubtId === doubtId);
        if (idx !== -1) {
          state.doubtsByGroup[groupId][idx].upvotes = upvotes;
          state.doubtsByGroup[groupId][idx].isUpvoted = isUpvoted;
        }
      }
    });

  }
});

export const {
  setActiveGroupId, setEditingMessage, setReplyingToMessage,
  socketMessageReceived, socketMessageEdited, socketMessageDeleted,
  socketReactionUpdated, socketUserTyping, socketUserStoppedTyping,
  socketUserOnline, socketUserOffline, clearGroupChat,
  setUploadProgress,
  addOptimisticMessage,
  removeOptimisticMessage,
  socketMemberSessionUpdate,
} = chatSlice.actions;


export const chatReducer = chatSlice.reducer;

// Selectors
interface StateWithChat { chat: ChatState; }

export const selectMessagesByGroup = (groupId: string) => (state: StateWithChat) =>
  state.chat.messagesByGroup[groupId] ?? [];
export const selectMessagesLoading = (state: StateWithChat) => state.chat.messagesLoading;
export const selectHasMore = (groupId: string) => (state: StateWithChat) =>
  state.chat.hasMoreByGroup[groupId] ?? false;
export const selectPinnedMessages = (groupId: string) => (state: StateWithChat) =>
  state.chat.pinnedByGroup[groupId] ?? [];
export const selectSendLoading = (state: StateWithChat) => state.chat.sendLoading;
export const selectEditLoading = (state: StateWithChat) => state.chat.editLoading;
export const selectEditingMessage = (state: StateWithChat) => state.chat.editingMessage;
export const selectReplyingToMessage = (state: StateWithChat) => state.chat.replyingToMessage;
export const selectDeleteLoading = (state: StateWithChat) => state.chat.deleteLoading;
export const selectUploadLoading = (state: StateWithChat) => state.chat.uploadLoading;
export const selectUploadProgress = (state: StateWithChat) => state.chat.uploadProgress;
export const selectTypingUsers = (groupId: string) => (state: StateWithChat) =>
  state.chat.typingUsersByGroup[groupId] ?? [];

// New selector — sirf names chahiye UI ke liye
export const selectTypingUserNames = (groupId: string) => (state: StateWithChat) =>
  (state.chat.typingUsersByGroup[groupId] ?? []).map(u => u.name);
export const selectOnlineMembers = (groupId: string) => (state: StateWithChat) =>
  state.chat.onlineMembersByGroup[groupId] ?? [];

export const selectFilesByGroup = (groupId: string) => (state: StateWithChat) =>
  state.chat.filesByGroup[groupId] ?? [];
export const selectPinnedFilesByGroup = (groupId: string) => (state: StateWithChat) =>
  state.chat.pinnedFilesByGroup[groupId] ?? [];
export const selectFilesLoading = (state: StateWithChat) => state.chat.filesLoading;
export const selectPinnedFilesLoading = (state: StateWithChat) => state.chat.pinnedFilesLoading;
export const selectFileUploadLoading = (state: StateWithChat) => state.chat.fileUploadLoading;
export const selectFileUploadProgress = (state: StateWithChat) => state.chat.fileUploadProgress;
export const selectFileDeleteLoading = (state: StateWithChat) => state.chat.fileDeleteLoading;
export const selectFilePinLoading = (state: StateWithChat) => state.chat.filePinLoading;
export const selectFilesTotal = (groupId: string) => (state: StateWithChat) =>
  state.chat.filesTotalByGroup[groupId] ?? 0;

//doubts
export const selectDoubtsByGroup = (groupId: string) => (state: StateWithChat) =>
  state.chat.doubtsByGroup[groupId] ?? [];
export const selectDoubtsLoading = (state: StateWithChat) => state.chat.doubtsLoading;
export const selectDoubtPostLoading = (state: StateWithChat) => state.chat.doubtPostLoading;
export const selectDoubtDeleteLoading = (state: StateWithChat) => state.chat.doubtDeleteLoading;
export const selectDoubtAnswers = (doubtId: string) => (state: StateWithChat) =>
  state.chat.doubtAnswers[doubtId] ?? [];
export const selectAnswerPostLoading = (state: StateWithChat) => state.chat.answerPostLoading;
export const selectAnswerVoteLoading = (state: StateWithChat) => state.chat.answerVoteLoading;



