//src/hooks/studyGroup/features/chats/chat.thunks.ts

import { createAsyncThunk } from "@reduxjs/toolkit";
import StudyGroupService, {
  SendMessageData,
  GetMessagesParams,
  GetFilesParams,
} from "@/lib/api/studyGroup.service";

export const fetchMessagesThunk = createAsyncThunk(
  "chat/fetchMessages",
  async (
    { groupId, params }: { groupId: string; params?: GetMessagesParams },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.getMessages(groupId, params);
      console.log("Fetched messages:", result);
      return { groupId, ...result };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch messages");
    }
  }
);

export const sendMessageThunk = createAsyncThunk(
  "chat/sendMessage",
  async (
    { groupId, data }: { groupId: string; data: SendMessageData },
    { rejectWithValue }
  ) => {
    try {
      const message = await StudyGroupService.sendMessage(groupId, data);
      console.log("Sent message:", message);
      return { groupId, message };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to send message");
    }
  }
);

export const editMessageThunk = createAsyncThunk(
  "chat/editMessage",
  async (
    { messageId, content }: { messageId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      const message = await StudyGroupService.editMessage(messageId, content);
      console.log("Edited message:", message);
      return message;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to edit message");
    }
  }
);

export const deleteMessageThunk = createAsyncThunk(
  "chat/deleteMessage",
  async (messageId: string, { rejectWithValue }) => {
    try {
      await StudyGroupService.deleteMessage(messageId);
      console.log("Deleted message:", messageId);
      return messageId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete message");
    }
  }
);

export const reactToMessageThunk = createAsyncThunk(
  "chat/reactToMessage",
  async (
    { messageId, emoji }: { messageId: string; emoji: string },
    { rejectWithValue }
  ) => {
    try {
      const message = await StudyGroupService.reactToMessage(
        messageId,
        emoji as any
      );
      console.log("Reacted to message:", message);
      return message;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to react");
    }
  }
);

export const togglePinMessageThunk = createAsyncThunk(
  "chat/togglePin",
  async (messageId: string, { rejectWithValue }) => {
    try {
      const message = await StudyGroupService.togglePinMessage(messageId);
      console.log("Toggled pin for message:", message);
      return message;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to pin message");
    }
  }
);

export const fetchPinnedMessagesThunk = createAsyncThunk(
  "chat/fetchPinned",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const messages = await StudyGroupService.getPinnedMessages(groupId);
      console.log("Fetched pinned messages:", messages);
      return { groupId, messages };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch pinned messages"
      );
    }
  }
);

export const markMessageReadThunk = createAsyncThunk(
  "chat/markRead",
  async (messageId: string, { rejectWithValue }) => {
    try {
      await StudyGroupService.markMessageAsRead(messageId);
      console.log("Marked message as read:", messageId);
      return messageId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to mark as read");
    }
  }
);

export const uploadChatFileThunk = createAsyncThunk(
  "chat/uploadFile",
  async (
    {
      file,
      onProgress,
    }: { file: File; onProgress?: (percent: number) => void },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.uploadFileToChat(file, onProgress);
      console.log("Uploaded file:", result);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to upload file");
    }
  }
);

//===========================FILE THUNKS============================

// ADD these thunks at bottom of file

export const fetchGroupFilesThunk = createAsyncThunk(
  "chat/fetchGroupFiles",
  async (
    { groupId, params }: { groupId: string; params?: GetFilesParams },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.getGroupFiles(groupId, params);
      return { groupId, ...result };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch files");
    }
  }
);

export const fetchGroupPinnedFilesThunk = createAsyncThunk(
  "chat/fetchGroupPinnedFiles",
  async (groupId: string, { rejectWithValue }) => {
    try {
      const result = await StudyGroupService.getGroupPinnedFiles(groupId);
      return { groupId, files: result.files };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch pinned files");
    }
  }
);

export const uploadGroupFileThunk = createAsyncThunk(
  "chat/uploadGroupFile",
  async (
    {
      groupId,
      file,
      onProgress,
    }: { groupId: string; file: File; onProgress?: (percent: number) => void },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.uploadGroupFile(
        groupId,
        file,
        onProgress
      );
      return { groupId, file: result };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to upload file");
    }
  }
);

export const deleteGroupFileThunk = createAsyncThunk(
  "chat/deleteGroupFile",
  async (
    { groupId, fileId }: { groupId: string; fileId: string },
    { rejectWithValue }
  ) => {
    try {
      await StudyGroupService.deleteGroupFile(fileId);
      return { groupId, fileId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete file");
    }
  }
);

export const togglePinGroupFileThunk = createAsyncThunk(
  "chat/togglePinGroupFile",
  async (
    { groupId, fileId }: { groupId: string; fileId: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.togglePinGroupFile(fileId);
      return { groupId, fileId, isPinned: result.isPinned };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to pin file");
    }
  }
);

export const downloadGroupFileThunk = createAsyncThunk(
  "chat/downloadGroupFile",
  async (fileId: string, { rejectWithValue }) => {
    try {
      await StudyGroupService.downloadGroupFile(fileId);
      return fileId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to download file");
    }
  }
);

// ========================== DOUBT THUNKS ==========================

export const fetchGroupDoubtsThunk = createAsyncThunk(
  "chat/fetchGroupDoubts",
  async (
    { groupId, params }: { groupId: string; params?: any },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.getGroupDoubts(groupId, params);
      return { groupId, ...result };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch doubts");
    }
  }
);

export const postDoubtThunk = createAsyncThunk(
  "chat/postDoubt",
  async (
    { groupId, data }: { groupId: string; data: any },
    { rejectWithValue }
  ) => {
    try {
      const doubt = await StudyGroupService.postDoubt(groupId, data);
      return { groupId, doubt };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to post doubt");
    }
  }
);

export const deleteDoubtThunk = createAsyncThunk(
  "chat/deleteDoubt",
  async (
    { groupId, doubtId }: { groupId: string; doubtId: string },
    { rejectWithValue }
  ) => {
    try {
      await StudyGroupService.deleteDoubt(doubtId);
      return { groupId, doubtId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete doubt");
    }
  }
);

export const markDoubtSolvedThunk = createAsyncThunk(
  "chat/markDoubtSolved",
  async (
    {
      groupId,
      doubtId,
      bestAnswerId,
    }: { groupId: string; doubtId: string; bestAnswerId: string },
    { rejectWithValue }
  ) => {
    try {
      const doubt = await StudyGroupService.markDoubtSolved(
        doubtId,
        bestAnswerId
      );
      return { groupId, doubt };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to mark doubt solved");
    }
  }
);

export const postAnswerThunk = createAsyncThunk(
  "chat/postAnswer",
  async (
    { groupId, doubtId, data }: { groupId: string; doubtId: string; data: any },
    { rejectWithValue }
  ) => {
    try {
      const answer = await StudyGroupService.postAnswer(doubtId, data);
      return { groupId, doubtId, answer };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to post answer");
    }
  }
);

export const upvoteAnswerThunk = createAsyncThunk(
  "chat/upvoteAnswer",
  async (
    {
      groupId,
      doubtId,
      answerId,
    }: { groupId: string; doubtId: string; answerId: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.upvoteAnswer(answerId);
      return { groupId, doubtId, answerId, ...result };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to upvote");
    }
  }
);

export const downvoteAnswerThunk = createAsyncThunk(
  "chat/downvoteAnswer",
  async (
    {
      groupId,
      doubtId,
      answerId,
    }: { groupId: string; doubtId: string; answerId: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.downvoteAnswer(answerId);
      return { groupId, doubtId, answerId, ...result };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to downvote");
    }
  }
);

export const deleteAnswerThunk = createAsyncThunk(
  "chat/deleteAnswer",
  async (
    {
      groupId,
      doubtId,
      answerId,
    }: {
      groupId: string;
      doubtId: string;
      answerId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      await StudyGroupService.deleteAnswer(answerId);
      return { groupId, doubtId, answerId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete answer");
    }
  }
);

export const updateAnswerThunk = createAsyncThunk(
  "chat/updateAnswer",
  async (
    {
      groupId,
      doubtId,
      answerId,
      data,
    }: {
      groupId: string;
      doubtId: string;
      answerId: string;
      data: any;
    },
    { rejectWithValue }
  ) => {
    try {
      const answer = await StudyGroupService.updateAnswer(answerId, data);
      return { groupId, doubtId, answerId, answer };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update answer");
    }
  }
);

export const removeAnswerVoteThunk = createAsyncThunk(
  "chat/removeAnswerVote",
  async (
    {
      groupId,
      doubtId,
      answerId,
    }: {
      groupId: string;
      doubtId: string;
      answerId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      await StudyGroupService.removeAnswerVote(answerId);
      return { groupId, doubtId, answerId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to remove vote");
    }
  }
);

export const fetchDoubtAnswersThunk = createAsyncThunk(
  "chat/fetchDoubtAnswers",
  async (
    { doubtId, params }: { doubtId: string; params?: any },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.getDoubtAnswers(doubtId, params);
      return { doubtId, answers: result.answers };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch answers");
    }
  }
);

export const updateDoubtThunk = createAsyncThunk(
  "chat/updateDoubt",
  async (
    { doubtId, data }: { doubtId: string; data: any },
    { rejectWithValue }
  ) => {
    try {
      const doubt = await StudyGroupService.updateDoubt(doubtId, data);
      return doubt;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update doubt");
    }
  }
);

export const fetchDoubtByIdThunk = createAsyncThunk(
  "chat/fetchDoubtById",
  async (
    { doubtId, params }: { doubtId: string; params?: any },
    { rejectWithValue }
  ) => {
    try {
      const result = await StudyGroupService.getDoubt(doubtId);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch doubt");
    }
  }
);

export const upvoteDoubtThunk = createAsyncThunk(
  "chat/upvoteDoubt",
  async (
    {
      groupId,
      doubtId,
      isUpvoted,
    }: { groupId: string; doubtId: string; isUpvoted: boolean },
    { rejectWithValue }
  ) => {
    try {
      const endpoint = isUpvoted ? "remove-upvote" : "upvote";
      const result = await StudyGroupService.toggleDoubtUpvote(
        doubtId,
        endpoint
      );
      return { groupId, doubtId, ...result };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to upvote");
    }
  }
);
