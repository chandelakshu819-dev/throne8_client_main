// app/features/profile/components/feed/CommentInput.tsx
import React from 'react';
import EmojiPicker from './EmojiPicker';

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

          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
              className={`flex-1 px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6b5643] ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-[#4a3728]/30 text-[#4a3728] placeholder-[#4a3728]/60'
                }`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCommentSubmit();
              }}
            />
            <button
              onClick={handleCommentSubmit}
              className="bg-gradient-to-r from-[#4a3728] to-[#6b5643] text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Post
            </button>
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