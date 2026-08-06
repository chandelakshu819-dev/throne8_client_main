// app/(dashboard)/components/feed/CommentMenuDropdown.tsx
import React from 'react';

const CommentMenuDropdown = (
  { isDarkMode, comment, currentUserId, postOwnerId, handleCommentAction }:
    {
      isDarkMode: boolean;
      comment: any;
      currentUserId?: string;
      postOwnerId?: string;
      handleCommentAction: (action: string, commentId: string, extra?: string) => void
    }
) => {
  const commentId = comment.commentId || comment.id;
  const userName = comment.user?.name || comment.user || 'this user';
  const handle = userName.replace(/\s+/g, '').toLowerCase();

  const isOwnComment = !!currentUserId && comment.userId === currentUserId;
  const isPostOwner = !!currentUserId && !!postOwnerId && currentUserId === postOwnerId;

  // ✅ "extra" carries different data depending on the action:
  // - edit → current comment text (so the edit box can be pre-filled)
  // - block → the target user's userId (needed to call the block API)
  // - everything else → not needed, but harmless to pass content along
  const Item = ({ icon, label, action }: { icon: string; label: string; action: string }) => (
    <button
      onClick={() =>
        handleCommentAction(
          action,
          commentId,
          action === 'block' ? comment.userId : (comment.content || comment.text)
        )
      }
      className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors ${
        isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-[#e0d8cf]/50 text-[#4a3728]'
      }`}
    >
      <i className={icon}></i>
      <span className="font-medium">{label}</span>
    </button>
  );

  const Divider = () => (
    <div className={`h-px ${isDarkMode ? 'bg-slate-700' : 'bg-[#4a3728]/20'}`}></div>
  );

  return (
    <div
      className={`absolute right-0 top-8 w-64 rounded-xl shadow-2xl border z-50 overflow-hidden ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#4a3728]/20'
      }`}
    >
      {isOwnComment ? (
        // ✅ Apna comment
        <>
          <Item icon="ri-edit-line" label="Edit comment" action="edit" />
          <Item icon="ri-delete-bin-line" label="Delete comment" action="delete" />
          <Divider />
          <Item icon="ri-links-line" label="Copy link to comment" action="copy" />
          <Item icon="ri-notification-off-line" label="Turn off notifications" action="mute-notifications" />
        </>
      ) : isPostOwner ? (
        // ✅ Kisi aur ka comment hai, par tum post ke owner ho
        <>
          <Item icon="ri-delete-bin-line" label="Delete comment" action="delete" />
          <Divider />
          <Item icon="ri-flag-line" label="Report comment" action="report" />
          <Item icon="ri-links-line" label="Copy link to comment" action="copy" />
        </>
      ) : (
        // ✅ Kisi aur ka comment hai, tum post ke owner bhi nahi ho
        <>
          <Item icon="ri-flag-line" label="Report comment" action="report" />
          <Item icon="ri-forbid-line" label={`Block ${handle}`} action="block" />
          <Item icon="ri-eye-off-line" label="Mute updates from this conversation" action="mute-thread" />
          <Divider />
          <Item icon="ri-links-line" label="Copy link to comment" action="copy" />
        </>
      )}
    </div>
  );
};

export default CommentMenuDropdown;