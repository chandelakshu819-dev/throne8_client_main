import { calculateTimeAgo } from './time.util';

// ✅ maps raw degree (1 | 2 | 3 | null) → LinkedIn-style label
const getDegreeLabel = (
  connectionDegree: 1 | 2 | 3 | null | undefined,
  connectionStatus: string
): string | null => {
  if (connectionStatus === 'self') return null;
  if (connectionDegree === 1) return '1st';
  if (connectionDegree === 2) return '2nd';
  if (connectionDegree === 3) return '3rd';
  return '3rd+';
};

export const transformApiPostToFeedPost = (
  apiPost: any,
  userData?: any,
  profileImageUrl?: string | null,
  headlineText?: string | null
) => {
  const connectionStatus = apiPost.connectionStatus || 'none';

  const resolvedName =
    (userData && (userData.firstName || userData.lastName)
      ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
      : '') ||
    (userData?.username ? userData.username : '') ||
    (userData?.name ? userData.name : '') ||
    apiPost.authorName ||
    (typeof apiPost.author === 'object' && apiPost.author
      ? (`${apiPost.author.firstName || ''} ${apiPost.author.lastName || ''}`.trim() || apiPost.author.username || apiPost.author.name)
      : '') ||
    (typeof apiPost.user === 'object' && apiPost.user
      ? (`${apiPost.user.firstName || ''} ${apiPost.user.lastName || ''}`.trim() || apiPost.user.username || apiPost.user.name)
      : '') ||
    apiPost.fullName ||
    apiPost.userName ||
    apiPost.username ||
    (typeof apiPost.user === 'string' && apiPost.user !== 'Unknown User' ? apiPost.user : '') ||
    (typeof apiPost.author === 'string' && apiPost.author !== 'Unknown User' ? apiPost.author : '') ||
    (apiPost.firstName || apiPost.lastName
      ? `${apiPost.firstName || ''} ${apiPost.lastName || ''}`.trim()
      : '') ||
    apiPost.name ||
    'Unknown User';

  const resolvedUsername =
    userData?.username ||
    apiPost.username ||
    apiPost.userName ||
    (typeof apiPost.author === 'object' ? apiPost.author?.username : '') ||
    (typeof apiPost.user === 'object' ? apiPost.user?.username : '') ||
    '';

  return {
    user: resolvedName,
    username: resolvedUsername,
    avatar: profileImageUrl || userData?.profilePhotoUrl || apiPost.avatar || apiPost.author?.profilePhotoUrl || apiPost.user?.profilePhotoUrl || '',
    role: headlineText || userData?.headline || apiPost.headline || apiPost.role || apiPost.author?.headline || apiPost.user?.headline || '',
    time: calculateTimeAgo(apiPost.createdAt),
    // ✅ NEW: raw date preserve karo — 'time' sirf formatted string hai
    // ("2h ago"), usse date reconstruct nahi ho sakti. Reposts (optimistic
    // create ke waqt) ko original createdAt chahiye hota hai warna
    // timeAgo() Invalid Date → "NaNd ago" deta hai.
    createdAt: apiPost.createdAt || null,
    content: apiPost.content || apiPost.text || '',

    // ✅ ADDED: mood tha model/backend mein save, lekin yahan return object
    // mein include hi nahi tha — isliye feed pe kabhi pahuchta hi nahi tha.
    mood: apiPost.mood || null,

    image: apiPost.images?.[0]?.cloudinarySecureUrl || apiPost.image || '',

    likes: apiPost.likesCount || apiPost.likes || 0,
    likesCount: apiPost.likesCount || apiPost.likes || 0,
    comments: apiPost.commentsCount || apiPost.comments || 0,
    commentsCount: apiPost.commentsCount || apiPost.comments || 0,

    // ✅ FIXED counts
    shares: apiPost.repostsCount || apiPost.sharesCount || apiPost.shares || 0,
    repostsCount: apiPost.repostsCount || apiPost.sharesCount || apiPost.shares || 0,
    sendsCount: apiPost.sendsCount || 0,

    postId: apiPost.entryId || apiPost.postId,
    entryId: apiPost.entryId,
    userId: apiPost.userId,
    isLiked: apiPost.isLiked || apiPost.isLikedByCurrentUser || false,
    isLikedByCurrentUser: apiPost.isLiked || apiPost.isLikedByCurrentUser || false,

    images: apiPost.images || [],
    videos: apiPost.videos || [],
    documents: apiPost.documents || [],

    connectionStatus,
    connectionDegree: apiPost.connectionDegree ?? null,
    degreeLabel: getDegreeLabel(apiPost.connectionDegree, connectionStatus),

    // ✅ FIXED: isPinned/isSaved backend se aate the lekin yahan drop ho rahe
    // the — isliye refresh ke baad pinned/saved post ka state gum ho jaata tha
    isPinned: apiPost.isPinned || false,
    isSaved: apiPost.isSaved || false,

    likedByConnections: apiPost.likedByConnections || [],
    likedByConnectionsAvatars: apiPost.likedByConnectionsAvatars || [],
    likedByConnectionsCount: apiPost.likedByConnectionsCount || 0,
    likedByConnectionsFull: apiPost.likedByConnectionsFull || [],

    commentedByConnections: apiPost.commentedByConnections || [],
    commentedByConnectionsAvatars: apiPost.commentedByConnectionsAvatars || [],
    commentedByConnectionsCount: apiPost.commentedByConnectionsCount || 0,
    commentedByConnectionsFull: apiPost.commentedByConnectionsFull || [],
  };
};