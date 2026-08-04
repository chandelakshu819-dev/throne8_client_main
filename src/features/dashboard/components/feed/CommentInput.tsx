// This same file replaces BOTH:
//   app/(dashboard)/components/feed/CommentInput.tsx
//   app/features/profile/components/feed/CommentInput.tsx
// (the two copies were identical before this change)

import React, { useRef } from 'react';
import EmojiPicker from './EmojiPicker';
import { useMentionAutocomplete, MentionUser } from '@/shared/hooks/useMentionAutocomplete';
import MentionAutocomplete from '@/shared/uiComponents/MentionAutocomplete';

interface CommentInputProps {
  isDarkMode: any;
  commentText: any;
  setCommentText: any;
  replyingTo: any;
  showEmojiPicker: any;
  setShowEmojiPicker: any;
  handleCommentSubmit: any;
  handleEmojiClick: any;
  emojiList: any;
  profileImage: any;
}

const CommentInput = ({
  isDarkMode,
  commentText,
  setCommentText,
  replyingTo,
  showEmojiPicker,
  setShowEmojiPicker,
  handleCommentSubmit,
  handleEmojiClick,
  emojiList,
  profileImage,
}: CommentInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ NEW: @mention autocomplete wiring — same hook used in CreatePostModal
  const mention = useMentionAutocomplete({
    value: commentText,
    onChange: setCommentText,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cursorPos = e.target.selectionStart || 0;
    mention.handleTextChange(e.target.value, cursorPos);
  };

  const handleSelectMention = (user: MentionUser) => {
    const input = inputRef.current;
    if (!input) return;
    const cursorPos = input.selectionStart || 0;
    const newCursorPos = mention.selectMention(user, cursorPos);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mention.isOpen && mention.results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        mention.setActiveIndex((i) => (i + 1) % mention.results.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        mention.setActiveIndex((i) => (i - 1 + mention.results.length) % mention.results.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSelectMention(mention.results[mention.activeIndex]);
        return;
      }
      if (e.key === 'Escape') {
        mention.closeMention();
        return;
      }
    }
    // ✅ Original behaviour: Enter submits the comment when the mention
    // dropdown isn't open.
    if (e.key === 'Enter') handleCommentSubmit();
  };

  return (
    <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-700/30' : 'bg-[#e0d8cf]/30'}`}>
      <div className="flex gap-3">
        <img
          src={profileImage || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdYRNQDghH1JvFXro2Yz3iWNmmFAubFZ-RGQ&s'}
          alt="Your avatar"
          className="w-10 h-10 rounded-xl object-cover border-2 border-[#6b5643]"
        />
        <div className="flex-1">
          {replyingTo && (
            <div className={`mb-2 px-3 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-slate-600/50 text-slate-300' : 'bg-white/50 text-[#4a3728]/70'}`}>
              Replying to comment...
              <button onClick={() => { /* parent se reset karo */ }} className="ml-2 text-red-500">
                Cancel
              </button>
            </div>
          )}

          <div className="flex gap-2 relative">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => mention.closeMention(), 150)}
              placeholder={replyingTo ? 'Write a reply... (type @ to mention someone)' : 'Write a comment... (type @ to mention someone)'}
              className={`flex-1 px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6b5643] ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-[#4a3728]/30 text-[#4a3728] placeholder-[#4a3728]/60'
                }`}
            />
            <button
              onClick={handleCommentSubmit}
              className="bg-gradient-to-r from-[#4a3728] to-[#6b5643] text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Post
            </button>
            {mention.isOpen && (
              <MentionAutocomplete
                results={mention.results}
                isSearching={mention.isSearching}
                activeIndex={mention.activeIndex}
                onSelect={handleSelectMention}
                onHover={mention.setActiveIndex}
                isDarkMode={isDarkMode}
              />
            )}
          </div>

          <div className="flex items-center gap-3 mt-3 relative">
            <button
              // onClick={() => 
              //   console.log('Opening photo upload...')
              // }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${isDarkMode ? 'hover:bg-slate-600 text-slate-400 hover:text-white' : 'hover:bg-[#e0d8cf] text-[#4a3728]/60 hover:text-[#4a3728]'
                }`}
            >
              <i className="ri-image-line text-lg"></i>
              <span className="text-sm font-medium">Photo</span>
            </button>

            <button
              // onClick={() => 
              //   console.log('Opening GIF selector...')
              // }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${isDarkMode ? 'hover:bg-slate-600 text-slate-400 hover:text-white' : 'hover:bg-[#e0d8cf] text-[#4a3728]/60 hover:text-[#4a3728]'
                }`}
            >
              <i className="ri-file-gif-line text-lg"></i>
              <span className="text-sm font-medium">GIF</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${isDarkMode ? 'hover:bg-slate-600 text-slate-400 hover:text-white' : 'hover:bg-[#e0d8cf] text-[#4a3728]/60 hover:text-[#4a3728]'
                  }`}
              >
                <i className="ri-emotion-line text-lg"></i>
                <span className="text-sm font-medium">Emoji</span>
              </button>

              {showEmojiPicker && (
                <EmojiPicker
                  isDarkMode={isDarkMode}
                  emojiList={emojiList}
                  handleEmojiClick={handleEmojiClick}
                  setShowEmojiPicker={setShowEmojiPicker}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;