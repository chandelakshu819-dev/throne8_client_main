'use client';

import { memo, useState, useMemo } from 'react';
import { useAppSelector } from '@/core/store/store.hooks';

const SAMPLE_CONNECTIONS = [
  { id: 'c1', name: 'Ritik Rajput', title: 'Fullstack Developer @ Sheryians', avatar: 'R', dept: 'Engineering' },
  { id: 'c2', name: 'Shivam Sharma', title: 'MERN Stack Instructor', avatar: 'S', dept: 'Education' },
  { id: 'c3', name: 'Anjali Verma', title: 'Product Designer @ Throne8', avatar: 'A', dept: 'Design' },
  { id: 'c4', name: 'Deepak Kumar', title: 'Senior Tech Lead', avatar: 'D', dept: 'Engineering' },
  { id: 'c5', name: 'Priya Singh', title: 'HR Manager @ TechCorp', avatar: 'P', dept: 'HR' },
];

const PostsRightSidebar = memo(function PostsRightSidebar() {
  const posts = useAppSelector(s => s.posts?.items ?? []);

  // ── States ────────────────────────────────────────────────────────────
  const [credits, setCredits] = useState(250);
  const [maxCredits] = useState(250);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showHighlightInfo, setShowHighlightInfo] = useState(false);
  const [showCreditsInfo, setShowCreditsInfo] = useState(false);

  // Invite state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  // ── Dynamic Top Post Highlight ─────────────────────────────────────────
  const topPost = useMemo(() => {
    if (!posts.length) return null;
    return posts.reduce((prev, curr) => {
      const prevEng = (prev.likes || 0) + (prev.comments || 0) + (prev.reposts || 0);
      const currEng = (curr.likes || 0) + (curr.comments || 0) + (curr.reposts || 0);
      return currEng >= prevEng ? curr : prev;
    }, posts[0]);
  }, [posts]);

  // Filtered connections for invite modal
  const filteredConnections = useMemo(() => {
    return SAMPLE_CONNECTIONS.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const toggleSelectConnection = (id: string) => {
    if (invitedIds.includes(id)) return;
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSendInvites = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    setCredits(prev => Math.max(0, prev - count));
    setInvitedIds(prev => [...prev, ...selectedIds]);
    setSelectedIds([]);
    setInviteSuccessMsg(`Successfully sent ${count} invitation${count > 1 ? 's' : ''}!`);
    setTimeout(() => setInviteSuccessMsg(''), 3000);
  };

  return (
    <div className="w-full space-y-3 relative">

      {/* Success Toast */}
      {inviteSuccessMsg && (
        <div className="bg-emerald-800 text-white text-xs px-3 py-2 rounded-xl shadow-lg animate-fade-in flex items-center justify-between font-medium">
          <span>✅ {inviteSuccessMsg}</span>
          <button onClick={() => setInviteSuccessMsg('')} className="ml-2 font-bold opacity-80 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── 1. Post Highlights Widget ── */}
      <div className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-xl p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <h3 className="text-xs font-bold text-[#4a3728]">Post highlights</h3>
            <button
              onClick={() => setShowHighlightInfo(!showHighlightInfo)}
              className="text-[#4a3728]/50 text-[10px] hover:text-[#4a3728] p-0.5 rounded transition-colors"
              title="Highlight info"
            >
              ⓘ
            </button>
          </div>
          <span className="text-[10px] text-[#4a3728]/50 font-medium">Last 30 days</span>
        </div>

        <p className="text-[11px] font-semibold text-[#4a3728]/70">Most reactions</p>

        {/* Dynamic Highlight Content */}
        {topPost ? (
          <div className="bg-white border border-[#e0d8cf] rounded-xl p-2.5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                🔥 Top Performing
              </span>
              <span className="text-[10px] text-[#4a3728]/50">{topPost.time}</span>
            </div>
            <p className="text-xs font-bold text-[#4a3728] line-clamp-1">{topPost.title || topPost.text || 'Company Post'}</p>
            <div className="flex items-center gap-3 text-[10px] text-[#4a3728]/70 font-semibold pt-0.5">
              <span>👍 {topPost.likes} reactions</span>
              <span>💬 {topPost.comments} comments</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 border border-[#e0d8cf] rounded-lg py-4 px-3 text-center shadow-inner">
            <p className="text-[11px] text-[#4a3728]/50 font-medium">No post highlights yet</p>
            <p className="text-[10px] text-[#4a3728]/40 mt-0.5">Create posts to see analytics here</p>
          </div>
        )}
      </div>

      {/* ── 2. Grow Your Followers Widget ── */}
      <div className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-xl p-3 shadow-xs space-y-2">
        <h3 className="text-xs font-bold text-[#4a3728]">Grow your followers</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Overlapping dynamic avatars */}
            <div className="flex -space-x-1.5 overflow-hidden">
              {SAMPLE_CONNECTIONS.slice(0, 3).map(c => (
                <div
                  key={c.id}
                  className="inline-block h-5.5 w-5.5 rounded-full bg-[#4a3728] text-[#f6ede8] text-[9px] font-bold flex items-center justify-center ring-1 ring-white"
                >
                  {c.avatar}
                </div>
              ))}
            </div>
            <span className="text-[11px] font-bold text-[#4a3728]">{credits}/{maxCredits} credits</span>
            <button
              onClick={() => setShowCreditsInfo(!showCreditsInfo)}
              className="text-[#4a3728]/50 text-[10px] hover:text-[#4a3728] p-0.5 rounded transition-colors"
              title="Credits info"
            >
              ⓘ
            </button>
          </div>
        </div>

        <p className="text-[11px] text-[#4a3728]/70 leading-normal">
          Build your company audience by inviting your network connections.
        </p>

        <button
          onClick={() => setShowInviteModal(true)}
          className="w-full border border-[#4a3728] text-[#4a3728] hover:bg-[#4a3728] hover:text-[#f6ede8] text-[11px] font-bold py-1.5 rounded-full transition-all text-center shadow-xs active:scale-98"
        >
          Invite connections ({credits} remaining)
        </button>
      </div>


      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL: Invite Connections Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-[#e0d8cf] shadow-2xl space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e0d8cf] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#4a3728]">Invite Connections to Follow</h3>
                <p className="text-[11px] text-[#4a3728]/60 mt-0.5">{credits} credits remaining this month</p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search connections by name or title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#f6ede8]/40 border border-[#e0d8cf] rounded-xl px-3 py-2 text-xs text-[#4a3728] focus:outline-none focus:border-[#4a3728]"
              />
            </div>

            {/* Connection List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredConnections.length === 0 ? (
                <p className="text-center text-xs text-[#4a3728]/50 py-4">No connections found</p>
              ) : (
                filteredConnections.map(c => {
                  const isInvited = invitedIds.includes(c.id);
                  const isSelected = selectedIds.includes(c.id);

                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleSelectConnection(c.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isInvited
                          ? 'bg-gray-50 border-gray-200 opacity-60'
                          : isSelected
                          ? 'bg-[#f6ede8] border-[#4a3728]'
                          : 'bg-white border-[#e0d8cf] hover:border-[#4a3728]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#4a3728] text-white font-bold flex items-center justify-center text-xs">
                          {c.avatar}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#4a3728]">{c.name}</p>
                          <p className="text-[10px] text-[#4a3728]/60 line-clamp-1">{c.title}</p>
                        </div>
                      </div>

                      {isInvited ? (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                          Invited
                        </span>
                      ) : (
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs transition-colors ${
                          isSelected ? 'bg-[#4a3728] text-white border-[#4a3728]' : 'border-gray-300'
                        }`}>
                          {isSelected && '✓'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between border-t border-[#e0d8cf] pt-3">
              <span className="text-xs text-[#4a3728]/70 font-semibold">
                {selectedIds.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-[#4a3728] hover:bg-[#f6ede8] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvites}
                  disabled={selectedIds.length === 0}
                  className="bg-[#4a3728] disabled:opacity-40 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-all shadow-xs"
                >
                  Send Invites ({selectedIds.length})
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── Info Popover Modals ── */}
      {showHighlightInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-[#e0d8cf] shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-[#4a3728]">About Post Highlights</h4>
            <p className="text-xs text-[#4a3728]/80 leading-relaxed">
              Post highlights display your top-performing post over the last 30 days based on total reactions, comments, and shares across the platform.
            </p>
            <button
              onClick={() => setShowHighlightInfo(false)}
              className="w-full bg-[#4a3728] text-white text-xs font-bold py-1.5 rounded-xl"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showCreditsInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-[#e0d8cf] shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-[#4a3728]">About Invitation Credits</h4>
            <p className="text-xs text-[#4a3728]/80 leading-relaxed">
              You receive 250 invitation credits every month to invite 1st-degree connections to follow your company page. Unused credits expire at the end of the calendar month.
            </p>
            <button
              onClick={() => setShowCreditsInfo(false)}
              className="w-full bg-[#4a3728] text-white text-xs font-bold py-1.5 rounded-xl"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
});

export default PostsRightSidebar;
