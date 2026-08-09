//src/app/studyGroup/study/my-groups/components/GroupChat.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Send, Paperclip, Download, Smile, Reply, Pin, Trash2, Edit3, MoreVertical, X, Check, CheckCheck, Image as ImageIcon, FileText, Users, HelpCircle, Search, Filter, ThumbsUp, ThumbsDown, MessageSquare, Link as LinkIcon, AlertCircle, CheckCircle, Star, Upload, AtSign, Tag, Video, File, Camera, Presentation
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addOptimisticMessage, removeOptimisticMessage, selectEditingMessage, selectMessagesByGroup, selectMessagesLoading, selectPinnedMessages, selectReplyingToMessage, selectSendLoading, selectTypingUserNames, setReplyingToMessage, setUploadProgress, selectFilesByGroup, selectPinnedFilesByGroup, selectFilesLoading, selectFileUploadLoading, selectFileDeleteLoading, selectFilePinLoading, selectDoubtsByGroup, selectDoubtsLoading, selectDoubtPostLoading, selectDoubtAnswers, selectAnswerPostLoading, selectAnswerVoteLoading,
  } from "@/hooks/studyGroup/features/chats/chatSlice";
import {
  deleteMessageThunk, editMessageThunk, fetchMessagesThunk, fetchPinnedMessagesThunk, reactToMessageThunk, sendMessageThunk, togglePinMessageThunk, uploadChatFileThunk, fetchGroupFilesThunk, fetchGroupPinnedFilesThunk, uploadGroupFileThunk, deleteGroupFileThunk, togglePinGroupFileThunk, fetchGroupDoubtsThunk, postDoubtThunk, deleteDoubtThunk, markDoubtSolvedThunk, postAnswerThunk, fetchDoubtAnswersThunk, upvoteAnswerThunk, downvoteAnswerThunk, deleteAnswerThunk, updateAnswerThunk,
  markMessageReadThunk,
  fetchDoubtByIdThunk,
  upvoteDoubtThunk,
} from "@/hooks/studyGroup/features/chats/chat.thunks";
import { validateChatFile, validateGroupFile, getFileCategoryFromMime } from "@/features/study-group/validators/chat.validation";
import { useChatSocket } from "@/core/realtime/useChatSocket";
import { useGroupData } from "@/features/study-group/hooks/useGroupData";
import { canEditMessage } from "@/shared/utils/studygroup.util";

// ========================== TYPES ==========================

interface Reaction {
  [emoji: string]: number[];
}

interface FileAttachment {
  id: number;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  isPinned: boolean;
  category: string;
}

interface Message {
  messageId: string;
  groupId: string;
  sender: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file' | string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  replyTo: string | null;
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: Date | string;
  deletedBy?: string;
  readBy: string[];
  reactions: Array<{ emoji: string; users: string[] }>;
  editHistory: any[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface Answer {
  id: number;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: Date;
  upvotes: number;
  downvotes: number;
  isAccepted: boolean;
}

interface Doubt {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  title: string;
  question: string;
  category: string;
  tags: string[];
  timestamp: Date;
  isSolved: boolean;
  upvotes: number;
  answers: Answer[];
  taggedUsers: number[];
}

interface Member {
  id: number;
  name: string;
  avatar: string;
}

interface AttachmentType {
  id: string;
  name: string;
  icon: JSX.Element;
  accept: string;
  color: string;
}

interface DoubtInput {
  title: string;
  question: string;
  category: string;
  tags: string[];
}

interface GroupDetails {
  groupId: string;
  title?: string;
  description?: string;
  category?: string;
  leaderId?: string;
  [key: string]: any;
}

const GroupChat = ({ groupId, groupDetails }: { groupId: string; groupDetails?: GroupDetails }) => {
  const params = useParams();
  const router = useRouter();
  // const { user } = useAuth();
  //   const currentUserId = user?.userId ?? '';

  const { getUserInfoSync, fetchAllUsers, fetchGroupMembers, groupMembers } = useGroupData();

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("chat");
  const dispatch = useAppDispatch();
  const messages = useAppSelector((state: any) => selectMessagesByGroup(groupId)(state.chat ?? {}));
  const messagesLoading = useAppSelector((state: any) => selectMessagesLoading(state.chat ?? {}));
  const sendLoading = useAppSelector((state: any) => selectSendLoading(state.chat ?? {}));
  const editingMessageFromStore = useAppSelector((state: any) => selectEditingMessage(state.chat ?? {}));
  const replyingToFromStore = useAppSelector((state: any) => selectReplyingToMessage(state.chat ?? {}));
  const pinnedMessages = useAppSelector((state: any) => selectPinnedMessages(groupId)(state.chat ?? {}));
  const typingUsers = useAppSelector((state: any) => selectTypingUserNames(groupId)(state.chat ?? {}));

  const { emitTyping, emitStopTyping } = useChatSocket(groupId);


  const [messageInput, setMessageInput] = useState<string>("");
  // const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  // const [selectedMessageMenu, setSelectedMessageMenu] = useState<number | null>(null);
  const [selectedMessageMenu, setSelectedMessageMenu] = useState<string | number | null>(null);
  // const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | number | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState<boolean>(false);

  // File states
  const groupFiles = useAppSelector( (state: any) => selectFilesByGroup(groupId)(state.chat ?? {}) );
  const pinnedGroupFiles = useAppSelector((state: any) => selectPinnedFilesByGroup(groupId)(state.chat ?? {}));
  const filesLoading = useAppSelector((state: any) => selectFilesLoading(state.chat ?? {}));
  const fileUploadLoading = useAppSelector((state: any) => selectFileUploadLoading(state.chat ?? {}));
  const fileDeleteLoading = useAppSelector((state: any) => selectFileDeleteLoading(state.chat ?? {}));
  const filePinLoading = useAppSelector((state: any) => selectFilePinLoading(state.chat ?? {}));
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [fileSearchQuery, setFileSearchQuery] = useState<string>("");
  const [selectedFileCategory, setSelectedFileCategory] = useState<string>("All");
  const [copySuccess, setCopySuccess] = useState(false);

  // Doubt states
  const doubts = useAppSelector((state: any) => selectDoubtsByGroup(groupId)(state.chat ?? {}));
  const [doubtFiles, setDoubtFiles] = useState<File[]>([]);
  const doubtsLoading = useAppSelector((state: any) => selectDoubtsLoading(state.chat ?? {})  );
  const doubtPostLoading = useAppSelector((state: any) => selectDoubtPostLoading(state.chat ?? {}));
  const answerPostLoading = useAppSelector((state: any) => selectAnswerPostLoading(state.chat ?? {}));
  const [doubtInput, setDoubtInput] = useState({ title: "", description: "", category: "Mathematics", tags: [], isUrgent: false, difficulty: "Medium" });
  const [selectedDoubt, setSelectedDoubt] = useState<any | null>(null);
  // Redux se live doubt data lo — selectedDoubt ID se match karke
  const liveSelectedDoubt = selectedDoubt
    ? doubts.find((d: any) => d.doubtId === selectedDoubt.doubtId) ?? selectedDoubt
    : null;
  const [selectedDoubtAnswers, setSelectedDoubtAnswers] = useState<any[]>([]);
  // Live answers from Redux — auto-update hote hain
  const liveAnswers = useAppSelector( (state: any) =>
    selectDoubtAnswers(selectedDoubt?.doubtId ?? '')
  );
  const [answerInput, setAnswerInput] = useState<string>("");
  const [doubtSearchQuery, setDoubtSearchQuery] = useState<string>("");
  const [doubtFilter, setDoubtFilter] = useState<string>("all");
  const [doubtCategoryFilter, setDoubtCategoryFilter] = useState<string>("All");
  const [showMyDoubtsOnly, setShowMyDoubtsOnly] = useState<boolean>(false);
  const [showUrgentOnly, setShowUrgentOnly] = useState<boolean>(false);
  const [taggedMembers, setTaggedMembers] = useState<string[]>([]);
  const [showDoubtForm, setShowDoubtForm] = useState<boolean>(false);
  const [editingDoubt, setEditingDoubt] = useState<any | null>(null);
  const [editingAnswer, setEditingAnswer] = useState<any | null>(null);
  const [editingAnswerInput, setEditingAnswerInput] = useState<string>("");
  const [showMemberTag, setShowMemberTag] = useState<boolean>(false);
  const [newTag, setNewTag] = useState<string>("");
  const [showAllPinnedMessages, setShowAllPinnedMessages] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filesTabInputRef = useRef<HTMLInputElement>(null); // ADD THIS
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  // const currentUserId = 1;
  const { user } = useAuth();
  const currentUserId: string = user?.userId ?? '';

  const members: Member[] = [
    { id: 1, name: "You", avatar: "👨‍🎓" },
    { id: 2, name: "Priya Sharma", avatar: "👩‍🎓" },
    { id: 3, name: "Rahul Kumar", avatar: "👨‍💻" },
    { id: 4, name: "Ananya Gupta", avatar: "👩‍💼" },
    { id: 5, name: "Vikram Singh", avatar: "👨‍🔬" },
    { id: 6, name: "Sneha Patel", avatar: "👩‍🏫" },
    { id: 7, name: "Arjun Reddy", avatar: "👨‍⚕️" },
    { id: 8, name: "Kavya Nair", avatar: "👩‍🎨" }
  ];

  const emojis: string[] = ["👍", "❤️", "😊", "👏", "✅"];
  // const doubtCategories: string[]. = ["Physics", "Chemistry", "Mathematics", "Biology", "General"];
  const doubtCategories: string[] = [
    "Mathematics", "Physics", "Chemistry", "Biology",
    "Computer Science", "English", "Programming", "Other"
  ];
  const fileCategories: string[] = ["All", "Notes", "Reference", "Assignments", "Previous Papers"];

  // Attachment types configuration
  const attachmentTypes: AttachmentType[] = [
    {
      id: "photo",
      name: "Photo",
      icon: <Camera size={20} />,
      accept: "image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif",
      color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20"
    },
    {
      id: "video",
      name: "Video",
      icon: <Video size={20} />,
      accept: "video/mp4,video/webm,video/quicktime,video/x-msvideo",
      color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border border-purple-500/20"
    },
    {
      id: "document",
      name: "Document",
      icon: <FileText size={20} />,
      accept: ".pdf,.doc,.docx,.txt",
      color: "bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20"
    },
    {
      id: "presentation",
      name: "PPT",
      icon: <Presentation size={20} />,
      accept: ".ppt,.pptx",
      color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border border-orange-500/20"
    },
    {
      id: "file",
      name: "File",
      icon: <File size={20} />,
      accept: "*",
      color: "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border border-gray-500/20"
    }
  ];

  // ==========================
  // UTILITY FUNCTIONS
  // ==========================

  const formatMessageTime = (date: Date | undefined | null | string): string => {
    if (!date) return "Unknown";

    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if it's a valid Date object
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "Unknown";

    const hours = dateObj.getHours().toString().padStart(2, "0");
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: Date | undefined | null | string): string => {
    if (!date) return "Unknown";

    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if it's a valid Date object
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "Unknown";

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateObj.toDateString() === today.toDateString()) return "Today";
    if (dateObj.toDateString() === yesterday.toDateString()) return "Yesterday";
    return dateObj.toLocaleDateString();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string): JSX.Element => {
    if (type.startsWith("image/")) return <ImageIcon size={20} />;
    if (type.startsWith("video/")) return <Video size={20} />;
    if (type.startsWith("application/pdf")) return <FileText size={20} />;
    if (type.includes("presentation") || type.includes("powerpoint")) return <Presentation size={20} />;
    return <File size={20} />;
  };

  const validateFileSize = (file: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB max
    return file.size <= maxSize;
  };

  const validateFileType = (file: File): boolean => {
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
      // Videos
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain"
    ];
    return allowedTypes.includes(file.type);
  };

  const getFileSizeLimit = (type: string): number => {
    if (type.startsWith("image/")) return 10 * 1024 * 1024; // 10MB for images
    if (type.startsWith("video/")) return 50 * 1024 * 1024; // 50MB for videos
    return 10 * 1024 * 1024; // 10MB for documents
  };

  // ==========================
  // EFFECTS
  // ==========================

  useEffect(() => {
    fetchAllUsers().catch(err => console.error('Failed to fetch users:', err));
  }, [fetchAllUsers]);

  useEffect(() => {
    if (groupId) {
      fetchGroupMembers(groupId).catch(err => console.error('Failed to fetch group members:', err));
    }
  }, [groupId, fetchGroupMembers]);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchMessagesThunk({ groupId, params: { page: 1, limit: 50 } }));
      dispatch(fetchPinnedMessagesThunk(groupId));
      dispatch(fetchGroupFilesThunk({ groupId, params: { page: 1, limit: 20 } }));
      dispatch(fetchGroupPinnedFilesThunk(groupId));
      dispatch(fetchGroupDoubtsThunk({ groupId })); // ADD THIS LINE
    }
  }, [groupId, dispatch]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  useEffect(() => {
    if (messageInput) {
      emitTyping();
      const timeout = setTimeout(() => emitStopTyping(), 2000);
      return () => clearTimeout(timeout);
    } else {
      emitStopTyping();
    }
  }, [messageInput]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        setSelectedMessageMenu(null);
        setShowEmojiPicker(null);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(target)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedDoubt) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedDoubt]);

  const handleSendMessage = async (): Promise<void> => {
    if (!messageInput.trim() && uploadedFiles.length === 0) return;

    const textToSend = messageInput;
    setMessageInput('');

    const optimisticId = `opt-${Date.now()}`;
    const optimisticMessage = {
      messageId: optimisticId,
      groupId,
      sender: currentUserId,
      content: uploadedFiles.length > 0
        ? (textToSend || uploadedFiles[0]?.name || 'File')
        : textToSend,
      messageType: uploadedFiles.length > 0
        ? (uploadedFiles[0].type.startsWith('image/') ? 'image'
          : uploadedFiles[0].type.startsWith('video/') ? 'video' : 'file')
        : 'text',
      fileUrl: uploadedFiles.length > 0 ? uploadedFiles[0].url : null,
      fileName: uploadedFiles.length > 0 ? uploadedFiles[0].name : null,
      fileSize: uploadedFiles.length > 0 ? uploadedFiles[0].size : null,
      replyTo: replyingToFromStore?.messageId ?? null,
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      readBy: [currentUserId],
      reactions: [],
      editHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOptimistic: true,
    };

    dispatch(addOptimisticMessage({ groupId, message: optimisticMessage }));
    dispatch(setReplyingToMessage(null));

    const filesToSend = [...uploadedFiles];
    setUploadedFiles([]);

    try {
      let result;
      if (filesToSend.length > 0) {
        const file = filesToSend[0];
        result = await dispatch(sendMessageThunk({
          groupId,
          data: {
            content: textToSend || file.name,
            messageType: file.type.startsWith('image/') ? 'image'
              : file.type.startsWith('video/') ? 'video' : 'file',
            fileUrl: file.url,
            fileName: file.name,
            fileSize: file.size,
            replyTo: replyingToFromStore?.messageId ?? null,
          }
        }));
      } else {
        result = await dispatch(sendMessageThunk({
          groupId,
          data: {
            content: textToSend,
            messageType: 'text',
            replyTo: replyingToFromStore?.messageId ?? null,
          }
        }));
      }

      // Agar API fail hua
      if (sendMessageThunk.rejected.match(result)) {
        dispatch(removeOptimisticMessage({ groupId, messageId: optimisticId }));
        setMessageInput(textToSend); // user ka likha wapas aao
        setUploadedFiles(filesToSend); // files bhi wapas
        alert('Failed to send message. Please try again.');
        return;
      }

      // Success — optimistic remove karo, socket real message laaega
      dispatch(removeOptimisticMessage({ groupId, messageId: optimisticId }));

    } catch (error) {
      dispatch(removeOptimisticMessage({ groupId, messageId: optimisticId }));
      setMessageInput(textToSend);
      setUploadedFiles(filesToSend);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleSaveEdit = (): void => {
    if (!editingMessage || !messageInput.trim()) return;
    dispatch(editMessageThunk({
      messageId: editingMessage.messageId,
      content: messageInput,
    }));
    setMessageInput('');
    setEditingMessage(null);  // ADD this line
  };

  const handleEditMessage = (messageId: string): void => {
    const message = messages.find((m) => m.messageId === messageId);
    if (!message) return;
    setEditingMessage(message);           // local — for banner display
    setMessageInput(message.content);
    setSelectedMessageMenu(null);
  };

  const handleDeleteMessage = (messageId: string): void => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      dispatch(deleteMessageThunk(messageId));
    }
  };

  const handleToggleMessagePin = (messageId: string): void => {
    dispatch(togglePinMessageThunk(messageId));
    setSelectedMessageMenu(null);
  };

  const handleAddReaction = (messageId: string, emoji: string): void => {
    dispatch(reactToMessageThunk({ messageId, emoji }));
    setShowEmojiPicker(null);
  };

  const handleAttachmentTypeClick = (type: AttachmentType): void => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type.accept;
      fileInputRef.current.click();
      setShowAttachmentMenu(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const selectedFiles = Array.from(e.target.files || []);

    for (const file of selectedFiles) {
      const { valid, error } = validateGroupFile(file);
      if (!valid) { alert(error); continue; }

      if (activeTab === 'files') {
        // Files tab — upload directly to group
        await dispatch(uploadGroupFileThunk({
          groupId,
          file,
          onProgress: (percent) => dispatch(setUploadProgress(percent)),
        })).unwrap().catch((err) => alert(err));
      } else {
        // Chat tab — upload then attach to message
        try {
          const result = await dispatch(uploadGroupFileThunk({
            groupId,
            file,
            onProgress: (percent) => dispatch(setUploadProgress(percent)),
          })).unwrap();

          setUploadedFiles(prev => [...prev, {
            id: Date.now(),
            name: result.file.fileName,
            size: result.file.fileSize,
            type: result.file.mimeType,
            url: result.file.fileUrl,
            uploadedBy: 'You',
            uploadedAt: new Date(),
            isPinned: false,
            category: getFileCategoryFromMime(result.file.mimeType),
          }]);
        } catch (err: any) {
          alert(err.message || 'Upload failed');
        }
      }
    }
    e.target.value = '';
  };

  const handleRemoveFile = (fileId: number): void => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== fileId));
  };

  const handleDeleteFile = (fileId: string): void => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      dispatch(deleteGroupFileThunk({ groupId, fileId }))
        .unwrap()
        .catch((err) => alert(err));
      setSelectedMessageMenu(null);
    }
  };

  const handleDownloadFile = async (file: { url: string; name: string }): Promise<void> => {
    if (!file.url || file.url === '#') return;

    try {
      // Get file extension
      const ext = file.name.includes('.')
        ? '.' + file.name.split('.').pop()
        : '';
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');

      // Ask user for filename first
      const customName = window.prompt('Save as:', nameWithoutExt);
      if (customName === null) return; // user cancelled

      const finalName = customName.trim() ? customName.trim() + ext : file.name;

      // Fetch file as blob — this forces browser to treat it as download
      const response = await fetch(file.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL after download starts
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

    } catch (error) {
      alert('Download failed. Please try again.');
    }
  };

   const handleShareFileLink = (file: { fileId: string; fileUrl: string; fileName: string }): void => {
    // Use Cloudinary URL directly — it's already public
    const shareUrl = file.fileUrl;

    if (navigator.share) {
      // Native share sheet on mobile
      navigator.share({
        title: file.fileName,
        text: `Check out this file: ${file.fileName}`,
        url: shareUrl,
      }).catch(() => {
        // fallback to clipboard if share cancelled
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
    setSelectedMessageMenu(null);
  };

  // ADD this helper inside component
  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // show toast instead of alert
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => alert('Failed to copy link'));
  };

  const handleToggleFilePin = (fileId: string): void => {
    dispatch(togglePinGroupFileThunk({ groupId, fileId }))
      .unwrap()
      .catch((err) => alert(err));
  };

  // REPLACE handlePostDoubt:
  const handlePostDoubt = async (): Promise<void> => {
    if (!doubtInput.title.trim()) {
      alert("Please fill in the title");
      return;
    }
    try {
      await dispatch(postDoubtThunk({
        groupId,
        data: {
          title: doubtInput.title,
          description: doubtInput.description,
          category: doubtInput.category,
          tags: doubtInput.tags,
          isUrgent: doubtInput.isUrgent,
          difficulty: doubtInput.difficulty,
          taggedMembers,
        }
      })).unwrap();
      setDoubtInput({ title: "", description: "", category: "Mathematics", tags: [], isUrgent: false, difficulty: "Medium" });
      setTaggedMembers([]);
      setDoubtFiles([]);
      setShowDoubtForm(false);
      setShowMemberTag(false);
    } catch (err: any) {
      alert(err || 'Failed to post doubt');
    }
  };

  const handleDeleteDoubt = async (doubtId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this doubt?')) return;
    try {
      await dispatch(deleteDoubtThunk({ groupId, doubtId })).unwrap();
    } catch (err: any) {
      alert(err || 'Failed to delete doubt');
    }
  };

  const handleUpdateDoubt = async (): Promise<void> => {
    if (!editingDoubt || !doubtInput.title.trim()) return;
    // Note: updateDoubtThunk abhi nahi hai — jab backend ready ho tab add karna
    // Abhi sirf form band karo
    setEditingDoubt(null);
    setShowDoubtForm(false);
    setDoubtInput({ title: "", description: "", category: "Mathematics", tags: [], isUrgent: false, difficulty: "Medium" });
  };

  // REPLACE handleAnswerDoubt:
  const handleAnswerDoubt = async (): Promise<void> => {
    if (!answerInput.trim() || !selectedDoubt) return;
    try {
      const result = await dispatch(postAnswerThunk({
        groupId,
        doubtId: selectedDoubt.doubtId,
        data: { content: answerInput }
      })).unwrap();
      // setSelectedDoubtAnswers(prev => [...prev, result.answer]);
      setAnswerInput("");
    } catch (err: any) {
      alert(err || 'Failed to post answer');
    }
  };

  // REPLACE handleMarkDoubtSolved:
  const handleMarkDoubtSolved = async (doubtId: string, bestAnswerId: string): Promise<void> => {
    try {
      await dispatch(markDoubtSolvedThunk({ groupId, doubtId, bestAnswerId })).unwrap();
      if (selectedDoubt?.doubtId === doubtId) {
        setSelectedDoubt((prev: any) => ({ ...prev, isSolved: true }));
      }
    } catch (err: any) {
      alert(err || 'Failed to mark solved');
    }
  };

  const handleVoteAnswer = async (doubtId: string, answerId: string, voteType: "up" | "down"): Promise<void> => {
    try {
      if (voteType === 'up') {
        await dispatch(upvoteAnswerThunk({ groupId, doubtId, answerId })).unwrap();
      } else {
        await dispatch(downvoteAnswerThunk({ groupId, doubtId, answerId })).unwrap();
      }
      // Redux state automatically update hoga — liveAnswers re-render karega
    } catch (err: any) {
      alert(err || 'Failed to vote');
    }
  };

  // REPLACE handleUpvoteDoubt (doubt upvote — not in backend yet, keep local or remove):
  const handleUpvoteDoubt = async (doubtId: string): Promise<void> => {
    const doubt = doubts.find(d => d.doubtId === doubtId);
    if (!doubt) return;

    const isCurrentlyUpvoted = doubt.upvotedBy?.includes(currentUserId) || doubt.isUpvoted || false;

    try {
      await dispatch(upvoteDoubtThunk({ groupId, doubtId, isUpvoted: isCurrentlyUpvoted })).unwrap();
    } catch (err: any) {
      alert(err || 'Failed to upvote');
    }
  };

  const handleDeleteAnswer = async (answerId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this answer?')) return;
    if (!selectedDoubt) return;
    try {
      await dispatch(deleteAnswerThunk({ groupId, doubtId: selectedDoubt.doubtId, answerId })).unwrap();
      // Answers will be refetched automatically through Redux
    } catch (err: any) {
      alert(err || 'Failed to delete answer');
    }
  };

  const handleUpdateAnswer = async (answerId: string): Promise<void> => {
    if (!editingAnswerInput.trim() || !selectedDoubt) return;
    try {
      await dispatch(updateAnswerThunk({
        groupId,
        doubtId: selectedDoubt.doubtId,
        answerId,
        data: { content: editingAnswerInput }
      })).unwrap();
      setEditingAnswer(null);
      setEditingAnswerInput("");
    } catch (err: any) {
      alert(err || 'Failed to update answer');
    }
  };

  const handleAddTag = (): void => {
    if (newTag.trim() && !doubtInput.tags.includes(newTag.trim())) {
      setDoubtInput({ ...doubtInput, tags: [...doubtInput.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string): void => {
    setDoubtInput({ ...doubtInput, tags: doubtInput.tags.filter((t) => t !== tag) });
  };

  const handleToggleTagMember = (memberId: string): void => {
    if (taggedMembers.includes(memberId)) {
      setTaggedMembers(taggedMembers.filter((id) => id !== memberId));
    } else {
      setTaggedMembers([...taggedMembers, memberId]);
    }
  };
  const filteredDoubts = doubts.filter((doubt) => {
    const matchesSearch =
      doubt.title?.toLowerCase().includes(doubtSearchQuery.toLowerCase()) ||
      doubt.description?.toLowerCase().includes(doubtSearchQuery.toLowerCase()) ||
      doubt.tags?.some((tag: string) => tag.toLowerCase().includes(doubtSearchQuery.toLowerCase()));

    const matchesStatus =
      doubtFilter === "all" ||
      (doubtFilter === "solved" && doubt.isSolved) ||
      (doubtFilter === "unsolved" && !doubt.isSolved);

    const matchesCategory =
      doubtCategoryFilter === "All" || doubt.category === doubtCategoryFilter;

    const matchesMyDoubts = !showMyDoubtsOnly ||
      (typeof doubt.postedBy === 'object' ? doubt.postedBy?.userId : doubt.postedBy) === currentUserId;

    const matchesUrgent = !showUrgentOnly || doubt.isUrgent === true;

    return matchesSearch && matchesStatus && matchesCategory && matchesMyDoubts && matchesUrgent;
  });

  console.log("filter doubt s dir", filteredDoubts)

  // ADD — use Redux data
  const pinnedFiles = pinnedGroupFiles;

  const filteredFiles = groupFiles.filter((file) => {
    const matchesSearch = file.fileName.toLowerCase().includes(fileSearchQuery.toLowerCase()) ||
      file.originalName.toLowerCase().includes(fileSearchQuery.toLowerCase());
    const matchesCategory = selectedFileCategory === 'All' ||
      getFileCategoryFromMime(file.mimeType) === selectedFileCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredMessages = messages.filter((msg) => msg !== null && msg !== undefined);


  // ==========================
  // RENDER
  // ==========================

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-br from-[#f6ede8] via-[#ede4db] to-[#e0d8cf]">

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
      <input type="file" ref={filesTabInputRef} onChange={handleFileUpload} className="hidden" multiple />



      {/* Glassmorphism Header */}
      <div className="flex-shrink-0 backdrop-blur-xl bg-white/30 border-b border-white/40 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => router.push(`/study/my-groups/${groupId}`)}
              className="p-2.5 hover:bg-white/50 rounded-xl transition-all duration-200 flex-shrink-0 backdrop-blur-sm border border-white/30"
              aria-label="Back to room"
            >
              <ArrowLeft size={20} className="text-[#4a3728]" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-[#4a3728] truncate">
                {groupDetails?.title || "Focus JEE Warriors"}
              </h1>
              <p className="text-sm text-[#6b5847]/80 hidden sm:block">
                {/* {groupDetails?.currentMemberCount || 8} members • {groupDetails?.currentMemberCount ? Math.ceil(groupDetails.currentMemberCount * 0.75) : 6} online */}
                {groupDetails?.currentMemberCount ?? 0} members
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/study/my-groups/${groupId}`)}
            className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white rounded-xl flex items-center gap-2 hover:shadow-lg transition-all duration-200 text-sm font-semibold flex-shrink-0 backdrop-blur-sm border border-white/20"
          >
            <Users size={18} />
            <span className="hidden sm:inline">Back to Room</span>
            <span className="sm:hidden">Room</span>
          </button>
        </div>

        {/* Modern Tabs */}
        <div className="overflow-x-auto">
          <div className="px-4 sm:px-6 lg:px-8 flex gap-2 min-w-max">
            {[
              { id: "chat", icon: MessageSquare, label: "Chat" },
              { id: "files", icon: Paperclip, label: `Files (${groupFiles.length})` },
              { id: "doubts", icon: HelpCircle, label: `Doubts (${doubts.filter((d) => !d.isSolved).length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 font-semibold transition-all duration-200 whitespace-nowrap text-sm rounded-t-xl relative ${activeTab === tab.id
                  ? "text-[#8b7355] bg-white/50 backdrop-blur-sm border-t border-x border-white/40"
                  : "text-[#6b5847]/70 hover:text-[#8b7355] hover:bg-white/30"
                  }`}
              >
                <tab.icon size={16} className="inline mr-2" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8b7355] to-[#6b5847]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "chat" && (
        <>
          {/* Pinned Messages with Glassmorphism */}
          {pinnedMessages.length > 0 && (
            <div className="flex-shrink-0 backdrop-blur-xl bg-amber-100/40 border-b border-amber-200/50">
              <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                    <Pin size={16} />
                    Pinned Messages
                  </div>
                  {pinnedMessages.length > 2 && (
                    <button
                      onClick={() => setShowAllPinnedMessages(!showAllPinnedMessages)}
                      className="text-xs text-amber-700 hover:text-amber-900 font-medium hover:underline"
                    >
                      {showAllPinnedMessages ? 'Show Less' : `Show All (${pinnedMessages.length})`}
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {(showAllPinnedMessages ? pinnedMessages : pinnedMessages.slice(-2)).map((msg) => {
                    const userInfo = getUserInfoSync(msg.sender);
                    return (
                      <div key={msg.messageId} className="text-sm text-amber-800 truncate backdrop-blur-sm bg-white/30 rounded-lg px-3 py-2 border border-white/40">
                        <span className="font-semibold">{userInfo.name}:</span> {msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 space-y-4 sm:space-y-5">
              {filteredMessages.map((msg, index) => {
                const showDate =
                  index === 0 ||
                  formatDate(msg.createdAt) !== formatDate(filteredMessages[index - 1].createdAt);

                // Fetch user info from hook cache
                const userInfo = getUserInfoSync(msg.sender);

                return (
                  <div key={msg.messageId}>
                    {showDate && (
                      <div className="flex items-center justify-center my-6">
                        <span className="backdrop-blur-md bg-white/50 text-[#6b5847] text-xs font-semibold px-4 py-2 rounded-full border border-white/60 shadow-sm">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    <div
                      ref={(el) => {
                        messageRefs.current[msg.messageId] = el;
                      }}
                      className={`flex gap-3 ${msg.sender === currentUserId ? "flex-row-reverse" : ""}`}
                    >
                      {msg.sender !== currentUserId && (
                        <div className="w-10 h-10 rounded-full border-2 border-[#8b7355]/30 backdrop-blur-sm bg-white/50 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                          {userInfo.avatar ? (
                            <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span>{userInfo.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      )}

                      <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] min-w-0">
                        {msg.sender !== currentUserId && (
                          <div className="font-bold text-sm mb-1.5 text-[#4a3728]">
                            {userInfo.name}
                          </div>
                        )}

                        <div
                          className={`relative group menu-container ${msg.sender === currentUserId
                            ? "bg-gradient-to-br from-[#8b7355] to-[#6b5847] text-white shadow-lg"
                            : "backdrop-blur-xl bg-white/80 border border-white/80 shadow-md"
                            } rounded-2xl px-4 py-3 cursor-pointer transition-all duration-200 hover:shadow-xl`}
                          onClick={() => setSelectedMessageMenu(selectedMessageMenu === msg.messageId ? null : msg.messageId)}
                        >
                          {msg.replyTo && (
                            <div
                              className={`mb-2 pb-2 ${msg.sender === currentUserId ? "border-white/30 text-white/90" : "border-gray-400 text-gray-700"
                                } border-b text-xs font-medium`}
                            >
                              <Reply size={12} className="inline mr-1" />
                              Replying to:{" "}
                              {filteredMessages.find((m) => m.messageId === msg.replyTo)?.content.substring(0, 30)}...
                            </div>
                          )}

                          <div className={`text-sm break-words leading-relaxed ${msg.sender === currentUserId
                            ? "text-white"
                            : "text-gray-800"
                            }`}>{msg.content}</div>

                          {msg.fileUrl && (
                            <div className="mt-3 space-y-2">
                              {(() => {
                                const file = { id: msg.messageId, name: msg.fileName, size: msg.fileSize, type: msg.messageType, url: msg.fileUrl };
                                return (
                                  <div
                                    key={file.id}
                                    className={`backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 border ${msg.sender === currentUserId
                                      ? "bg-white/15 border-white/30"
                                      : "bg-gray-200/40 border-gray-300/60"
                                      }`}
                                  >
                                    <div className={`p-2 rounded-lg ${msg.sender === currentUserId
                                      ? "bg-white/25 text-white"
                                      : "bg-gray-300/30 text-gray-700"
                                      }`}>
                                      {getFileIcon(file.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className={`text-xs font-semibold truncate ${msg.sender === currentUserId ? "text-white" : "text-gray-800"
                                        }`}>
                                        {file.name}
                                      </div>
                                      <div className={`text-xs font-medium ${msg.sender === currentUserId ? "text-white/90" : "text-gray-700"
                                        }`}>
                                        {formatFileSize(file?.size || 0)}
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadFile({ url: file.url, name: file?.name || 'download' });
                                      }}
                                      className={`rounded-lg p-2 flex-shrink-0 transition-all ${msg.sender === currentUserId
                                        ? "hover:bg-white/30 text-white"
                                        : "hover:bg-gray-300/40 text-gray-700"
                                        }`}
                                    >
                                      <Download size={16} />
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex gap-1.5 mt-3 flex-wrap">
                              {msg.reactions.map((reaction) => (
                                <button
                                  key={reaction.emoji}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddReaction(msg.messageId, reaction.emoji);
                                  }}
                                  className={`text-xs px-2.5 py-1 rounded-full backdrop-blur-sm transition-all font-medium ${msg.sender === currentUserId
                                    ? reaction.users.includes(currentUserId)
                                      ? "bg-white/40 border border-white/60 text-white"
                                      : "bg-white/20 border border-white/40 text-white hover:bg-white/30"
                                    : reaction.users.includes(currentUserId)
                                      ? "bg-blue-500/30 border border-blue-600/60 text-blue-900"
                                      : "bg-gray-300/40 border border-gray-400/60 text-gray-800 hover:bg-gray-300/60"
                                    }`}
                                >
                                  {reaction.emoji} {reaction.users.length}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            {msg.isEdited && (
                              <span className={`text-[10px] italic ${msg.sender === currentUserId ? "text-white/60" : "text-gray-400"}`}>
                                edited
                              </span>
                            )}
                            <span className={`text-[10px] font-medium ${msg.sender === currentUserId ? "text-white/70" : "text-gray-400"}`}>
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {msg.sender === currentUserId && (
                              <>
                                {msg.readBy.length === 1 ? (
                                  <Check size={11} className="text-white/70" />
                                ) : (
                                  <CheckCheck size={11} className="text-blue-200" />
                                )}
                              </>
                            )}
                          </div>

                          {selectedMessageMenu === msg.messageId && (
                            <div
                              className={`absolute ${msg.sender === currentUserId ? 'right-full mr-3' : 'left-full ml-3'} top-0 backdrop-blur-xl bg-white/90 shadow-2xl rounded-xl border border-white/60 py-2 z-[200] min-w-[160px]`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  dispatch(setReplyingToMessage(msg));  // set full message in Redux
                                  setSelectedMessageMenu(null);
                                }}
                                className="w-full px-4 py-2.5 hover:bg-gray-100/50 flex items-center gap-3 text-sm text-gray-700 font-medium transition-all"
                              >
                                <Reply size={16} /> Reply
                              </button>
                              <button
                                onClick={() => {
                                  setShowEmojiPicker(msg.messageId);
                                  setSelectedMessageMenu(null);
                                }}
                                className="w-full px-4 py-2.5 hover:bg-gray-100/50 flex items-center gap-3 text-sm text-gray-700 font-medium transition-all"
                              >
                                <Smile size={16} /> React
                              </button>
                              <button
                                onClick={() => handleToggleMessagePin(msg.messageId)}
                                className="w-full px-4 py-2.5 hover:bg-gray-100/50 flex items-center gap-3 text-sm text-gray-700 font-medium transition-all"
                              >
                                <Pin size={16} /> {msg.isPinned ? "Unpin" : "Pin"}
                              </button>
                              {msg.sender === currentUserId && (
                                <>
                                  {canEditMessage(msg.createdAt) && (
                                    <button
                                      onClick={() => handleEditMessage(msg.messageId)}
                                      className="w-full px-4 py-2.5 hover:bg-gray-100/50 flex items-center gap-3 text-sm text-gray-700 font-medium transition-all"
                                    >
                                      <Edit3 size={16} /> Edit
                                    </button>
                                  )}
                                  <div className="border-t border-gray-200/50 my-1" />
                                  <button
                                    onClick={() => handleDeleteMessage(msg.messageId)}
                                    className="w-full px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm text-red-600 font-medium transition-all"
                                  >
                                    <Trash2 size={16} /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {showEmojiPicker === msg.messageId && (
                            <div
                              className={`absolute ${msg.sender === currentUserId ? 'right-full mr-3' : 'left-full ml-3'} top-0 backdrop-blur-xl bg-white/90 shadow-2xl rounded-xl border border-white/60 p-3 z-[200]`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex gap-2">
                                {emojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleAddReaction(msg.messageId, emoji)}
                                    className="hover:bg-gray-100/50 rounded-lg p-2 text-xl transition-all hover:scale-110"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex-shrink-0 backdrop-blur-xl bg-white/50 border-t border-blue-200/50">
              <div className="px-4 sm:px-6 lg:px-8 py-3 text-sm font-semibold text-[#4a3728] italic">
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </div>
            </div>
          )}

          {/* Reply Banner */}
          {replyingToFromStore && (
            <div className="flex-shrink-0 backdrop-blur-xl bg-blue-100/40 border-t border-blue-200/50">
              <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
                <div className="text-sm flex-1 min-w-0 font-medium text-blue-900">
                  <Reply size={14} className="inline mr-2" />
                  <span className="truncate">
                    Replying to: {replyingToFromStore.content.substring(0, 50)}...
                  </span>
                </div>
                <button
                  onClick={() => dispatch(setReplyingToMessage(null))}
                  className="flex-shrink-0 p-1.5 hover:bg-blue-200/50 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Edit Banner */}
          {editingMessage && (
            <div className="flex-shrink-0 backdrop-blur-xl bg-amber-100/40 border-t border-amber-200/50">
              <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                <div className="text-sm font-medium text-amber-900">
                  <Edit3 size={14} className="inline mr-2" />
                  Editing message
                </div>
                <button
                  onClick={() => {
                    setEditingMessage(null);
                    setMessageInput("");
                  }}
                  className="p-1.5 hover:bg-amber-200/50 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Attached Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="flex-shrink-0 backdrop-blur-xl bg-gray-100/40 border-t border-gray-200/50">
              <div className="px-4 sm:px-6 lg:px-8 py-3">
                <div className="text-sm font-bold mb-3 text-[#4a3728]">Attached Files:</div>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 backdrop-blur-sm bg-white/60 rounded-xl p-3 text-sm border border-white/60"
                    >
                      <div className="p-2 bg-white/50 rounded-lg">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 truncate min-w-0 font-medium text-gray-900">{file.name}</div>
                      <div className="text-gray-700 text-xs font-medium">{formatFileSize(file.size)}</div>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="flex-shrink-0 p-1.5 hover:bg-red-100/50 rounded-lg transition-all"
                      >
                        <X size={16} className="text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="flex-shrink-0 backdrop-blur-xl bg-white/50 border-t border-white/60 shadow-2xl">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
              <div className="flex gap-3 items-end">
               
                <div className="relative" ref={attachmentMenuRef}>
                  <button
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    disabled={isUploading}
                    className="p-3 hover:bg-white/60 rounded-xl transition-all duration-200 flex-shrink-0 backdrop-blur-sm border border-white/40"
                    title="Attach file"
                  >
                    <Paperclip size={20} className={`text-[#6b5847] ${isUploading ? "animate-spin" : ""}`} />
                  </button>

                  {/* Attachment Type Menu */}
                  {showAttachmentMenu && (
                    <div className="absolute bottom-full left-0 mb-3 backdrop-blur-xl bg-white/95 rounded-2xl shadow-2xl border border-white/60 p-3 min-w-[220px] z-[200]">
                      <div className="text-xs font-bold text-gray-700 mb-3 px-2">
                        Select attachment type
                      </div>
                      <div className="space-y-1.5">
                        {attachmentTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => handleAttachmentTypeClick(type)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${type.color}`}
                          >
                            {type.icon}
                            <span className="text-sm">{type.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      editingMessage ? handleSaveEdit() : handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  // className="flex-1 px-4 py-3 border-2 border-white/60 rounded-xl focus:outline-none focus:border-[#8b7355]/50 resize-none min-w-0 text-sm backdrop-blur-sm bg-white/60 transition-all"
                  className="flex-1 px-4 py-3 border-2 border-white/60 rounded-xl focus:outline-none focus:border-[#8b7355]/50 resize-none min-w-0 text-sm backdrop-blur-sm bg-white/60 transition-all text-[#4a3728] placeholder:text-[#6b5847]/50"
                />

                <button
                  onClick={editingMessage ? handleSaveEdit : handleSendMessage}
                  disabled={!messageInput.trim() && uploadedFiles.length === 0}
                  className={`p-3 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 border border-white/20 ${editingMessage
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-[#8b7355] to-[#6b5847]'
                    }`}
                >
                  {editingMessage ? <Edit3 size={20} /> : <Send size={20} />}
                </button>

                        </div>
            </div>
          </div>
        </>
      )}

      {/* ==========================
          FILES TAB
      ========================== */}
      {activeTab === "files" && (
        <>
          {/* Pinned Files */}
          {pinnedFiles.length > 0 && (
            <div className="flex-shrink-0 backdrop-blur-xl bg-amber-100/40 border-b border-amber-200/50">
              <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-4">
                  <Pin size={16} />
                  Pinned Resources
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pinnedFiles.map((file) => (
                    <div
                      key={file.fileId}
                      className="backdrop-blur-sm bg-white/60 rounded-xl p-4 flex items-center gap-3 border border-amber-300/50 hover:shadow-lg transition-all"
                    >
                      <div className="p-3 bg-amber-100/50 rounded-lg">
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{file.fileName}</div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {formatFileSize(file.fileSize)} • {getUserInfoSync(typeof file.uploadedBy === 'object' ? file.uploadedBy.userId : file.uploadedBy).name}
                        </div>
                      </div>
                      <button
                        // onClick={() => handleDownloadFile(file)}
                        onClick={() => handleDownloadFile({ url: file.fileUrl, name: file.fileName })}
                        className="p-2 hover:bg-amber-200/50 rounded-lg flex-shrink-0 transition-all"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={fileSearchQuery}
                    onChange={(e) => setFileSearchQuery(e.target.value)}
                    placeholder="Search files..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-white/60 rounded-xl focus:outline-none focus:border-[#8b7355]/50 backdrop-blur-sm bg-white/60 text-gray-900 placeholder-gray-700 transition-all"
                  />
                </div>
                <select
                  value={selectedFileCategory}
                  onChange={(e) => setSelectedFileCategory(e.target.value)}
                  className="px-4 py-3 border-2 border-white/60 rounded-xl focus:outline-none focus:border-[#8b7355]/50 backdrop-blur-sm bg-white/60 font-medium text-gray-900 transition-all"
                >
                  {fileCategories.map((cat) => (
                    <option key={cat} value={cat} className="text-gray-900">
                      {cat}
                    </option>
                  ))}
                </select>
              
                <button
                  onClick={() => {
                  
                    filesTabInputRef.current?.click();

                  }}
                  disabled={fileUploadLoading}
                  className="px-5 py-3 bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all font-semibold disabled:opacity-50 border border-white/20"
                >
                  <Upload size={18} />
                  {fileUploadLoading ? 'Uploading...' : 'Upload'}
                </button>
              </div>

              {/* Files Grid */}
              {filesLoading ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="w-8 h-8 border-4 border-[#8b7355] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium">Loading files...</p>
                </div>
              ) : filteredFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.fileId}
                      className="backdrop-blur-sm bg-white/60 border-2 border-white/60 rounded-2xl p-5 hover:shadow-2xl transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-4 bg-gradient-to-br from-[#f6ede8] to-[#e0d8cf] rounded-xl shadow-sm">
                          {getFileIcon(file.fileType)}
                        </div>
                        <div className="relative menu-container">
                         
                          <button
                            onClick={() =>
                              setSelectedMessageMenu(
                                selectedMessageMenu === file.fileId ? null : file.fileId
                              )
                            }
                            className="p-2 hover:bg-[#8b7355]/20 rounded-lg transition-all"
                          >
                            <MoreVertical size={18} className="text-[#8b7355]" />
                          </button>
                          {selectedMessageMenu === file.fileId && (
                            <div className="absolute right-0 top-10 backdrop-blur-xl bg-white/90 shadow-2xl rounded-xl border border-white/60 py-2 z-[200] min-w-[160px]">
                              <button
                                onClick={() => {
                                  window.open(file.fileUrl, '_blank');
                                  setSelectedMessageMenu(null);
                                }}
                                className="w-full px-4 py-2.5 hover:bg-gray-100/50 flex items-center gap-3 text-sm text-gray-700 font-medium transition-all"
                              >
                                <LinkIcon size={16} /> Open
                              </button>
                              <button
                                onClick={() => {
                                  handleDownloadFile({ url: file.fileUrl, name: file.fileName });
                                  setSelectedMessageMenu(null);
                                }}
                                className="w-full px-4 py-2.5 hover:bg-gray-100/50 flex items-center gap-3 text-sm text-gray-700 font-medium transition-all"
                              >
                                <Download size={16} /> Download
                              </button>
                              
                              <button
                                onClick={() => {
                                  copyToClipboard(file.fileUrl);
                                  setSelectedMessageMenu(null);
                                }}
                                className="w-full px-4 py-2.5 hover:bg-gray-100/50 flex items-center gap-3 text-sm text-gray-700 font-medium transition-all"
                              >
                                <LinkIcon size={16} /> Copy Link
                                {copySuccess && <span className="ml-auto text-xs text-green-600 font-semibold">Copied!</span>}
                              </button>
                              <button
                                onClick={() => {
                                  handleToggleFilePin(file.fileId);
                                  setSelectedMessageMenu(null);
                                }}
                                className="w-full px-4 py-2.5 hover:bg-gray-100/50 flex items-center gap-3 text-sm text-gray-700 font-medium transition-all"
                              >
                                <Pin size={16} /> {file.isPinned ? "Unpin" : "Pin"}
                              </button>
                              {(typeof file.uploadedBy === 'object' ? file.uploadedBy.userId : file.uploadedBy) === currentUserId && (
                                <>
                                  <div className="border-t border-gray-200/50 my-1" />
                                  <button
                                    onClick={() => handleDeleteFile(file.fileId)}
                                    className="w-full px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm text-red-600 font-medium transition-all"
                                  >
                                    <Trash2 size={16} /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <h3 className="font-bold text-sm mb-2 truncate text-gray-900" title={file.fileName}>
                        {file.fileName}
                      </h3>
                      <p className="text-xs text-gray-700 font-medium mb-3">
                        {formatFileSize(file.fileSize)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-600 gap-2 mb-3">
                        <span className="truncate font-medium">{getUserInfoSync(typeof file.uploadedBy === 'object' ? file.uploadedBy.userId : file.uploadedBy).name}</span>
                        <span className="flex-shrink-0 font-medium">{formatDate(file.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-xs px-3 py-1.5 bg-[#f6ede8] text-[#8b7355] rounded-full font-medium border border-[#8b7355]/20">
                          {/* {file.category} */}
                          {getFileCategoryFromMime(file.mimeType)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <FileText size={56} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No files found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ==========================
          DOUBTS TAB
      ========================== */}
      {activeTab === "doubts" && (
        <>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={doubtSearchQuery}
                    onChange={(e) => setDoubtSearchQuery(e.target.value)}
                    placeholder="Search doubts..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-white/60 rounded-xl focus:outline-none focus:border-[#8b7355]/50 backdrop-blur-sm bg-white/60 transition-all"
                  />
                </div>
                <select
                  value={doubtFilter}
                  onChange={(e) => setDoubtFilter(e.target.value)}
                  className="px-4 py-3 border-2 border-white/60 rounded-xl focus:outline-none focus:border-[#8b7355]/50 backdrop-blur-sm bg-white/60 font-medium transition-all"
                >
                  <option value="all">All Doubts</option>
                  <option value="unsolved">Unsolved</option>
                  <option value="solved">Solved</option>
                </select>
                <button
                  onClick={() => setShowDoubtForm(!showDoubtForm)}
                  className="px-5 py-3 bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all font-semibold whitespace-nowrap border border-white/20"
                >
                  <HelpCircle size={18} />
                  Ask Doubt
                </button>


              </div>

              {/* Filter chips */}
              <div className="flex gap-2 flex-wrap mb-2">
                <button
                  onClick={() => setShowMyDoubtsOnly(!showMyDoubtsOnly)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${showMyDoubtsOnly
                    ? 'bg-[#8b7355] text-white border-[#8b7355]'
                    : 'bg-white/60 text-[#6b5847] border-white/60 hover:border-[#8b7355]/40'
                    }`}
                >
                  My Doubts
                </button>
                <button
                  onClick={() => setShowUrgentOnly(!showUrgentOnly)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${showUrgentOnly
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white/60 text-orange-600 border-white/60 hover:border-orange-400/40'
                    }`}
                >
                  🔴 Urgent
                </button>
                {doubtCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setDoubtCategoryFilter(doubtCategoryFilter === cat ? 'All' : cat)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${doubtCategoryFilter === cat
                      ? 'bg-[#6b5847] text-white border-[#6b5847]'
                      : 'bg-white/60 text-gray-600 border-white/60 hover:border-gray-400/40'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Doubt Form */}
              {showDoubtForm && (
                <div className="backdrop-blur-xl bg-white/70 border-2 border-white/60 rounded-2xl p-6 sm:p-8 mb-6 shadow-xl">
                  {/* <h3 className="text-xl font-bold text-[#4a3728] mb-6">Post a Doubt</h3> */}
                  <h3 className="text-xl font-bold text-[#4a3728] mb-6">
                    {editingDoubt ? 'Edit Doubt' : 'Post a Doubt'}
                  </h3>

                  <input
                    type="text"
                    value={doubtInput.title}
                    onChange={(e) =>
                      setDoubtInput({ ...doubtInput, title: e.target.value })
                    }
                    placeholder="Doubt title..."
                    className="w-full px-4 py-3 border-2 border-white/60 rounded-xl mb-4 focus:outline-none focus:border-[#8b7355]/50 backdrop-blur-sm bg-white/60 transition-all"
                  />

                  <textarea
                    // value={doubtInput.question}
                    // onChange={(e) =>
                    //   setDoubtInput({ ...doubtInput, question: e.target.value })
                    // }
                    // placeholder="Describe your doubt in detail..."
                    value={doubtInput.description}
                    onChange={(e) => setDoubtInput({ ...doubtInput, description: e.target.value })}
                    placeholder="Describe your doubt in detail..."
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-white/60 rounded-xl mb-4 focus:outline-none focus:border-[#8b7355]/50 resize-none backdrop-blur-sm bg-white/60 transition-all"
                  />

                  <select
                    value={doubtInput.category}
                    onChange={(e) =>
                      setDoubtInput({ ...doubtInput, category: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-white/60 rounded-xl mb-4 focus:outline-none focus:border-[#8b7355]/50 backdrop-blur-sm bg-white/60 font-medium transition-all"
                  >
                    {doubtCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* Tags */}
                  <div className="mb-4">
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Add tag..."
                        className="flex-1 px-4 py-3 border-2 border-white/60 rounded-xl focus:outline-none focus:border-[#8b7355]/50 backdrop-blur-sm bg-white/60 transition-all"
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-4 py-3 bg-gray-200/60 rounded-xl hover:bg-gray-300/60 flex-shrink-0 backdrop-blur-sm transition-all"
                      >
                        <Tag size={18} />
                      </button>
                    </div>
                    {doubtInput.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {doubtInput.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-4 py-2 bg-[#f6ede8] text-[#8b7355] rounded-full text-sm flex items-center gap-2 font-medium border border-[#8b7355]/20"
                          >
                            {tag}
                            <button onClick={() => handleRemoveTag(tag)}>
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* File Attachment */}
                  <div className="mb-4">
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Attach Files (optional)
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setDoubtFiles(Array.from(e.target.files || []))}
                      className="w-full px-4 py-3 border-2 border-dashed border-white/60 rounded-xl backdrop-blur-sm bg-white/40 text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#8b7355]/10 file:text-[#8b7355] hover:file:bg-[#8b7355]/20 transition-all cursor-pointer"
                    />
                    {doubtFiles.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {doubtFiles.map((f, i) => (
                          <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f6ede8] text-[#8b7355] rounded-full text-xs font-medium border border-[#8b7355]/20">
                            <FileText size={12} />
                            {f.name}
                            <button onClick={() => setDoubtFiles(prev => prev.filter((_, idx) => idx !== i))}>
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tag Members */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowMemberTag(!showMemberTag)}
                      className="text-sm font-semibold text-[#8b7355] mb-3 flex items-center gap-2 hover:underline"
                    >
                      <AtSign size={16} />
                      Tag Members {taggedMembers.length > 0 && `(${taggedMembers.length})`}
                    </button>
                    {showMemberTag && (
                      <div className="border-2 border-white/60 rounded-xl p-4 max-h-48 overflow-y-auto backdrop-blur-sm bg-white/40">
                        
                        {groupMembers
                          .filter(m => m.userId !== currentUserId) // apne aap ko exclude karo
                          .map((member) => (
                            <label
                              key={member.userId}
                              className="flex items-center gap-3 py-3 cursor-pointer hover:bg-white/50 rounded-lg px-3 transition-all"
                            >
                              <input
                                type="checkbox"
                                checked={taggedMembers.includes(member.userId)}
                                onChange={() => handleToggleTagMember(member.userId)}
                                className="rounded"
                              />
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f6ede8] to-[#e0d8cf] flex items-center justify-center text-sm font-bold text-[#8b7355] flex-shrink-0 overflow-hidden">
                                {member.avatar
                                  ? <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                  : member.name.charAt(0).toUpperCase()
                                }
                              </div>
                              <div>
                                <span className="text-sm font-medium block">{member.name}</span>
                                {member.role !== 'member' && (
                                  <span className="text-xs text-[#8b7355] font-medium">{member.role}</span>
                                )}
                              </div>
                            </label>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                   
                    <button
                      onClick={editingDoubt ? handleUpdateDoubt : handlePostDoubt}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white rounded-xl hover:shadow-lg transition-all font-semibold border border-white/20"
                    >
                      {editingDoubt ? 'Update Doubt' : 'Post Doubt'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDoubtForm(false);
                        setEditingDoubt(null);
                        setDoubtInput({ title: "", description: "", category: "Mathematics", tags: [], isUrgent: false, difficulty: "Medium" });
                        setTaggedMembers([]);
                        setShowMemberTag(false);
                      }}
                      className="px-6 py-3 border-2 border-white/60 rounded-xl hover:bg-white/50 transition-all font-semibold backdrop-blur-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Doubts List */}
              {filteredDoubts.length > 0 ? (
                <div className="space-y-4">
                  {filteredDoubts.map((doubt) => (
                    <div
                      key={doubt.doubtId}
                      className="backdrop-blur-xl bg-white/70 border-2 border-white/60 rounded-2xl p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                   
                      onClick={async () => {
                        setSelectedDoubt(doubt);
                        try {
                          // ViewCount increment + answers fetch parallel
                          await Promise.all([
                            dispatch(fetchDoubtByIdThunk(doubt.doubtId)),
                            dispatch(fetchDoubtAnswersThunk({ doubtId: doubt.doubtId })),
                          ]);
                        } catch (err) {
                          console.error('Failed to fetch doubt details');
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f6ede8] to-[#e0d8cf] border-2 border-[#8b7355]/30 flex items-center justify-center text-xl font-bold text-[#8b7355] flex-shrink-0 shadow-sm">
                            {(() => {
                              const info = getUserInfoSync(
                                typeof doubt.postedBy === 'object' ? doubt.postedBy?.userId : doubt.postedBy
                              );
                              return info.avatar
                                ? <img src={info.avatar} alt={info.name} className="w-full h-full rounded-full object-cover" />
                                : info.name.charAt(0).toUpperCase();
                            })()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-[#4a3728] truncate text-base">{doubt.title}</h3>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {(() => {
                                const info = getUserInfoSync(
                                  typeof doubt.postedBy === 'object' ? doubt.postedBy?.userId : doubt.postedBy
                                );
                                return info.name;
                              })()} • {formatDate(doubt.createdAt)}
                            </p>
                          </div>
                         
                        </div>
                        {doubt.isSolved ? (
                          <span className="px-3 py-1.5 bg-green-500/10 text-green-700 rounded-full text-xs flex items-center gap-1.5 flex-shrink-0 font-semibold border border-green-500/20">
                            <CheckCircle size={14} />
                            <span className="hidden sm:inline">Solved</span>
                          </span>


                        )

                          : (
                            <span className="px-3 py-1.5 bg-orange-500/10 text-orange-700 rounded-full text-xs flex items-center gap-1.5 flex-shrink-0 font-semibold border border-orange-500/20">
                              <AlertCircle size={14} />
                              <span className="hidden sm:inline">Unsolved</span>
                            </span>
                          )}

                        {/* 3-dot menu — sirf doubt owner ko */}
                        {(typeof doubt.postedBy === 'object'
                          ? doubt.postedBy?.userId
                          : doubt.postedBy) === currentUserId && (
                            <div className="relative menu-container flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMessageMenu(selectedMessageMenu === `doubt-${doubt.doubtId}` ? null : `doubt-${doubt.doubtId}`);
                                }}
                                className="p-1.5 hover:bg-gray-100/50 rounded-lg transition-all"
                              >
                                <MoreVertical size={16} className="text-gray-500" />
                              </button>
                              {selectedMessageMenu === `doubt-${doubt.doubtId}` && (
                                <div
                                  className="absolute right-0 top-8 backdrop-blur-xl bg-white/90 shadow-2xl rounded-xl border border-white/60 py-2 z-[200] min-w-[140px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingDoubt(doubt);
                                      setDoubtInput({
                                        title: doubt.title,
                                        description: doubt.description || '',
                                        category: doubt.category || 'Mathematics',
                                        tags: doubt.tags || [],
                                        isUrgent: doubt.isUrgent || false,
                                        difficulty: doubt.difficulty || 'Medium',
                                      });
                                      setShowDoubtForm(true);
                                      setSelectedMessageMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-gray-100/50 flex items-center gap-3 text-sm text-gray-700 font-medium transition-all"
                                  >
                                    <Edit3 size={15} /> Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteDoubt(doubt.doubtId);
                                      setSelectedMessageMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm text-red-600 font-medium transition-all"
                                  >
                                    <Trash2 size={15} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                      </div>

                      <p className="text-sm text-gray-800 mb-4 line-clamp-2 leading-relaxed">
                        {doubt.description}
                      </p>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex gap-2 flex-wrap">
                          <span className="px-3 py-1.5 bg-[#f6ede8] text-[#8b7355] rounded-full text-xs font-semibold border border-[#8b7355]/20">
                            {doubt.category}
                          </span>
                          {doubt.tags.slice(0, 2).map((tag: any) => (
                            <span
                              key={tag}
                              className="px-3 py-1.5 bg-gray-100/60 text-gray-700 rounded-full text-xs font-medium backdrop-blur-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                          {doubt.tags.length > 2 && (
                            <span className="px-3 py-1.5 bg-gray-100/60 text-gray-600 rounded-full text-xs font-medium backdrop-blur-sm">
                              +{doubt.tags.length - 2}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-shrink-0">
                         
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpvoteDoubt(doubt.doubtId);
                            }}
                            className={`flex items-center gap-1.5 transition-all font-medium ${doubt.upvotedBy?.includes(currentUserId) || doubt.isUpvoted
                              ? 'text-[#8b7355]'
                              : 'hover:text-[#8b7355] text-gray-600'
                              }`}
                          >
                            <ThumbsUp size={16} className={doubt.upvotedBy?.includes(currentUserId) || doubt.isUpvoted ? 'fill-current' : ''} />
                            <span>{doubt.upvotes ?? 0}</span>
                          </button>
                          <span className="flex items-center gap-1.5 font-medium">
                            <MessageSquare size={16} />
                            <span>{doubt.answerCount ?? 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <HelpCircle size={56} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No doubts found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Doubt Detail Modal */}
      {liveSelectedDoubt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4 overflow-y-auto">
          <div className="backdrop-blur-2xl bg-white/95 rounded-3xl max-w-4xl w-full my-8 shadow-2xl border border-white/60">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border-b-2 border-white/60 p-6 sm:p-8 flex items-start justify-between gap-4 rounded-t-3xl z-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-4">
                
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#f6ede8] to-[#e0d8cf] border-2 border-[#8b7355]/30 flex items-center justify-center text-xl font-bold text-[#8b7355] flex-shrink-0 shadow-sm">
                    {(() => {
                      const info = getUserInfoSync(
                        typeof liveSelectedDoubt.postedBy === 'object'
                          ? liveSelectedDoubt.postedBy?.userId
                          : liveSelectedDoubt.postedBy
                      );
                      return info.avatar
                        ? <img src={info.avatar} alt={info.name} className="w-full h-full rounded-full object-cover" />
                        : info.name.charAt(0).toUpperCase();
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#4a3728] break-words">
                      {liveSelectedDoubt.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {(() => {
                        const info = getUserInfoSync(
                          typeof liveSelectedDoubt.postedBy === 'object'
                            ? liveSelectedDoubt.postedBy?.userId
                            : liveSelectedDoubt.postedBy
                        );
                        return info.name;
                      })()} • {formatDate(liveSelectedDoubt.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-4 py-2 bg-[#f6ede8] text-[#8b7355] rounded-full text-sm font-semibold border border-[#8b7355]/20">
                    {liveSelectedDoubt.category}
                  </span>
                  {liveSelectedDoubt.tags.map((tag: any) => (
                    <span
                      key={tag}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setSelectedDoubt(null)}
                className="p-2.5 hover:bg-gray-100/50 rounded-xl flex-shrink-0 transition-all"
              >
                <X size={22} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto">
              {/* Question */}
              <div className="p-6 sm:p-8 border-b-2 border-white/60">
             
                <p className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed">{liveSelectedDoubt.description}</p>
                <div className="flex flex-wrap items-center gap-4 mt-5">
                  <button
                    onClick={() => handleUpvoteDoubt(liveSelectedDoubt.id)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#8b7355] font-medium transition-all"
                  >
                    <ThumbsUp size={18} />
                    {liveSelectedDoubt.upvotes} Upvotes
                  </button>
                  {(typeof liveSelectedDoubt.postedBy === 'object'
                    ? liveSelectedDoubt.postedBy?.userId
                    : liveSelectedDoubt.postedBy) === currentUserId && !liveSelectedDoubt.isSolved && (
                      <button
                        onClick={() => selectedDoubtAnswers[0] && handleMarkDoubtSolved(liveSelectedDoubt.doubtId, selectedDoubtAnswers[0].answerId)}
                        className="px-4 py-2 bg-green-500/10 text-green-700 rounded-lg text-sm hover:bg-green-500/20 font-semibold transition-all border border-green-500/20"
                      >
                        Mark as Solved
                      </button>
                    )}
                </div>
              </div>

              {/* Answers */}
              <div className="p-6 sm:p-8">
                <h3 className="font-bold text-lg mb-5">
                  {liveAnswers.length}{" "}
                  {liveAnswers.length === 1 ? "Answer" : "Answers"}
                </h3>
                <div className="space-y-4 mb-6">
                  {liveAnswers.map((answer: any) => (
                    <div
                      key={answer.id}
                      className={`border-2 rounded-2xl p-5 transition-all ${answer.isBestAnswer
                        ? "border-green-400 bg-green-50/50 backdrop-blur-sm"
                        : "border-white/60 backdrop-blur-sm bg-white/40"
                        }`}
                    >
                      <div className="flex items-start justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f6ede8] to-[#e0d8cf] border-2 border-[#8b7355]/30 flex items-center justify-center text-sm font-bold text-[#8b7355] flex-shrink-0">
                            {(() => {
                              const info = getUserInfoSync(
                                typeof answer.answeredBy === 'object' ? answer.answeredBy?.userId : answer.answeredBy
                              );
                              return info.avatar
                                ? <img src={info.avatar} alt={info.name} className="w-full h-full rounded-full object-cover" />
                                : info.name.charAt(0).toUpperCase();
                            })()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm">
                              {(() => {
                                const info = getUserInfoSync(
                                  typeof answer.answeredBy === 'object' ? answer.answeredBy?.userId : answer.answeredBy
                                );
                                return info.name;
                              })()}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatMessageTime(answer.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {answer.isBestAnswer && (
                            <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs flex items-center gap-1.5 flex-shrink-0 font-semibold">
                              <Check size={14} />
                              Best Answer
                            </span>
                          )}
                          {(typeof answer.answeredBy === 'object' ? answer.answeredBy?.userId : answer.answeredBy) === currentUserId && (
                            <div className="relative menu-container flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMessageMenu(selectedMessageMenu === `answer-${answer.answerId}` ? null : `answer-${answer.answerId}`);
                                }}
                                className="p-1.5 hover:bg-gray-100/50 rounded-lg transition-all"
                              >
                                <MoreVertical size={16} className="text-gray-500" />
                              </button>
                              {selectedMessageMenu === `answer-${answer.answerId}` && (
                                <div
                                  className="absolute right-0 top-8 backdrop-blur-xl bg-white/90 shadow-2xl rounded-xl border border-white/60 py-2 z-[200] min-w-[140px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingAnswer(answer);
                                      setEditingAnswerInput(answer.content);
                                      setSelectedMessageMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-gray-100/50 flex items-center gap-3 text-sm text-gray-700 font-medium transition-all"
                                  >
                                    <Edit3 size={15} /> Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAnswer(answer.answerId);
                                      setSelectedMessageMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm text-red-600 font-medium transition-all"
                                  >
                                    <Trash2 size={15} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {editingAnswer?.answerId === answer.answerId ? (
                        <div className="mb-4">
                          <textarea
                            value={editingAnswerInput}
                            onChange={(e) => setEditingAnswerInput(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#8b7355]/30 rounded-xl mb-3 focus:outline-none focus:border-[#8b7355]/60 resize-none backdrop-blur-sm bg-white/60 transition-all text-sm"
                            rows={4}
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleUpdateAnswer(answer.answerId)}
                              disabled={!editingAnswerInput.trim()}
                              className="px-4 py-2 bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white rounded-lg text-sm hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => {
                                setEditingAnswer(null);
                                setEditingAnswerInput("");
                              }}
                              className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-all font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-800 mb-4 break-words leading-relaxed">{answer.content}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4">
                        <button
                          onClick={() =>
                            // handleVoteAnswer(selectedDoubt.id, answer.id, "up")
                            handleVoteAnswer(selectedDoubt.doubtId, answer.answerId, "up")
                          }
                          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-600 font-medium transition-all"
                        >
                          <ThumbsUp size={16} />
                          {answer.upvotes}
                        </button>
                        <button
                          onClick={() =>
                            handleVoteAnswer(selectedDoubt.doubtId, answer.answerId, "down")
                          }
                          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-600 font-medium transition-all"
                        >
                          <ThumbsDown size={16} />
                          {answer.downvotes}
                        </button>
                                              {answer.isBestAnswer ? (
                          <span className="ml-auto px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            <Check size={13} /> Accepted
                          </span>
                        ) : (typeof selectedDoubt.postedBy === 'object'
                          ? selectedDoubt.postedBy?.userId
                          : selectedDoubt.postedBy) === currentUserId && !selectedDoubt.isSolved && (
                          <button
                            onClick={() => handleMarkDoubtSolved(selectedDoubt.doubtId, answer.answerId)}
                            className="ml-auto px-4 py-1.5 bg-green-500/10 text-green-700 rounded-lg text-xs hover:bg-green-500/20 font-semibold transition-all border border-green-500/20"
                          >
                            Accept Answer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Answer Input */}
                {!selectedDoubt.isSolved && (
                  <div>
                    <h4 className="font-bold mb-4">Your Answer</h4>
                    <textarea
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Write your answer here..."
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-white/60 rounded-xl mb-4 focus:outline-none focus:border-[#8b7355]/50 resize-none backdrop-blur-sm bg-white/60 transition-all"
                    />
                    <button
                      onClick={handleAnswerDoubt}
                      disabled={!answerInput.trim()}
                      className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                    >
                      Post Answer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChat;
