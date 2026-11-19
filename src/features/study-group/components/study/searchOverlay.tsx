"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTrendingGroupsThunk,
  fetchPopularGroupsThunk,
  fetchRecommendedGroupsThunk,
  joinGroupThunk,
  sendJoinRequestThunk,
  searchGroupsThunk,
} from "@/hooks/studyGroup/features/groups/group.thunks";
import {
  selectSearchResults,
  selectSearchResultsLoading,
  selectTrendingGroups,
  selectPopularGroups,
  selectRecommendedGroups,
  selectJoiningGroupId,
} from "@/hooks/studyGroup/features/groups/groupsSlice";
import {
  Search, X, TrendingUp, Flame, Sparkles,
  Users, Clock, Eye, EyeOff, Lock, Globe,
  ChevronRight, Loader2,
} from "lucide-react";
import { GroupCategory } from "@/lib/api/studyGroup.service";
import JoinGroupModal from "../../modals/joinGroupModal";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "JEE", value: GroupCategory.JEE },
  { label: "NEET", value: GroupCategory.NEET },
  { label: "College", value: GroupCategory.COLLEGE },
  { label: "Placement", value: GroupCategory.PLACEMENT },
  { label: "Competitive", value: GroupCategory.COMPETITIVE },
  { label: "Language", value: GroupCategory.LANGUAGE },
  { label: "Other", value: GroupCategory.OTHER },
];

// ─── Search Result Card ───────────────────────────────────────────────────────

const SearchResultCard = ({
  group,
  onJoin,
  joiningGroupId,
  onOpenGroup,
}: {
  group: any;
  onJoin: (group: any) => void;
  joiningGroupId: string | null;
  onOpenGroup: (groupId: string) => void;
}) => {
  const isJoining = joiningGroupId === group.groupId;
  const isMember = group.isMember ?? false;
  const spotsLeft = group.capacity - group.currentMemberCount;
  const isFull = spotsLeft <= 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#f6ede8]/60 transition-all duration-150 cursor-pointer group rounded-xl mx-2">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b7355] to-[#4a3728] flex items-center justify-center flex-shrink-0 shadow-md">
        <span className="text-white font-bold text-sm">
          {group.title?.charAt(0)?.toUpperCase() ?? "G"}
        </span>
      </div>

      {/* Info */}
      <div
        className="flex-1 min-w-0"
        onClick={() => onOpenGroup(group.groupId)}
      >
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#4a3728] truncate">
            {group.title}
          </p>
          {group.visibility === "private" ? (
            <Lock className="w-3 h-3 text-[#8b7355] flex-shrink-0" />
          ) : (
            <Globe className="w-3 h-3 text-[#8b7355] flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[#8b7355] bg-[#f6ede8] px-2 py-0.5 rounded-full">
            {group.category}
          </span>
          <span className="text-xs text-[#6b5847]">
            {group.currentMemberCount}/{group.capacity} members
          </span>
          {!isFull && (
            <span className="text-xs text-green-600">
              {spotsLeft} spots left
            </span>
          )}
        </div>
      </div>

      {/* Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isMember) {
            onOpenGroup(group.groupId);
          } else {
            onJoin(group);
          }
        }}
        disabled={isFull && !isMember || isJoining}
        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
          isMember
            ? "bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white hover:from-[#6b5847] hover:to-[#4a3728]"
            : isFull
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white hover:from-[#6b5847] hover:to-[#4a3728]"
        }`}
      >
        {isJoining ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isMember ? (
          "Open"
        ) : isFull ? (
          "Full"
        ) : (
          "Join"
        )}
      </button>
    </div>
  );
};

// ─── Section Row (trending/popular/recommended) ───────────────────────────────

const SectionRow = ({
  icon,
  label,
  groups,
  onJoin,
  joiningGroupId,
  onOpenGroup,
}: {
  icon: React.ReactNode;
  label: string;
  groups: any[];
  onJoin: (group: any) => void;
  joiningGroupId: string | null;
  onOpenGroup: (groupId: string) => void;
}) => {
  if (!groups.length) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 px-4 py-2">
        {icon}
        <span className="text-xs font-bold text-[#8b7355] uppercase tracking-widest">
          {label}
        </span>
      </div>
      {groups.slice(0, 3).map((group) => (
        <SearchResultCard
          key={group.groupId}
          group={group}
          onJoin={onJoin}
          joiningGroupId={joiningGroupId}
          onOpenGroup={onOpenGroup}
        />
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const searchResults = useAppSelector(selectSearchResults);
  const searchLoading = useAppSelector(selectSearchResultsLoading);
  const trendingGroups = useAppSelector(selectTrendingGroups);
  const popularGroups = useAppSelector(selectPopularGroups);
  const recommendedGroups = useAppSelector(selectRecommendedGroups);
  const joiningGroupId = useAppSelector(selectJoiningGroupId);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [joinModalGroup, setJoinModalGroup] = useState<any | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const hasQuery = query.trim().length > 0 || activeCategory !== "";
  const hasResults = searchResults.length > 0;

  // ── Focus input on open ──
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // Fetch discovery data if not already loaded
      if (!trendingGroups.length) dispatch(fetchTrendingGroupsThunk(5));
      if (!popularGroups.length) dispatch(fetchPopularGroupsThunk(5));
      if (!recommendedGroups.length) dispatch(fetchRecommendedGroupsThunk({ limit: 5 }));
    }
  }, [isOpen]);

  // ── Escape key ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── Debounced search ──
  const triggerSearch = useCallback(
    (searchQuery: string, category: string) => {
      clearTimeout(debounceRef.current);
      if (!searchQuery.trim() && !category) return;
      debounceRef.current = setTimeout(() => {
        dispatch(
          searchGroupsThunk({
            search: searchQuery || undefined,
            category: category as GroupCategory || undefined,
            limit: 20,
          })
        );
      }, 300);
    },
    [dispatch]
  );

  const handleQueryChange = (val: string) => {
    setQuery(val);
    triggerSearch(val, activeCategory);
  };

  const handleCategoryClick = (cat: string) => {
    const next = cat === activeCategory ? "" : cat;
    setActiveCategory(next);
    triggerSearch(query, next);
  };

  const handleClear = () => {
    setQuery("");
    setActiveCategory("");
    inputRef.current?.focus();
  };

  // ── Join handlers ──
  const handleJoinClick = (group: any) => {
    if (group.visibility === "private") {
      setJoinModalGroup(group);
    } else {
      handlePublicJoin(group.groupId);
    }
  };

  const handlePublicJoin = async (groupId: string) => {
    const result = await dispatch(joinGroupThunk({ groupId }));
    if (joinGroupThunk.fulfilled.match(result)) {
      setJoinSuccess("Successfully joined!");
      setTimeout(() => setJoinSuccess(null), 3000);
    } else {
      setJoinError((result.payload as string) || "Failed to join");
      setTimeout(() => setJoinError(null), 3000);
    }
  };

  // Private groups: send a join request; the group leader approves or rejects it
  const handleRequestAccess = async (message: string) => {
    if (!joinModalGroup) return;
    const result = await dispatch(
      sendJoinRequestThunk({ groupId: joinModalGroup.groupId, message })
    );
    if (!sendJoinRequestThunk.fulfilled.match(result)) {
      throw new Error((result.payload as string) || "Failed to send request");
    }
  };

  const handleOpenGroup = (groupId: string) => {
    onClose();
    router.push(`/study/groups/${groupId}`);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Overlay Panel */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 overflow-hidden">

          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e0d8cf]">
            {searchLoading ? (
              <Loader2 className="w-5 h-5 text-[#8b7355] animate-spin flex-shrink-0" />
            ) : (
              <Search className="w-5 h-5 text-[#8b7355] flex-shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search groups by name, topic, subject..."
              className="flex-1 bg-transparent text-[#4a3728] placeholder-[#c4b5a5] text-sm font-medium outline-none"
            />
            {(query || activeCategory) && (
              <button
                onClick={handleClear}
                className="text-[#8b7355] hover:text-[#4a3728] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[#8b7355] hover:text-[#4a3728] transition-colors ml-1"
            >
              <span className="text-xs bg-[#f6ede8] px-2 py-1 rounded-lg font-semibold">
                ESC
              </span>
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto border-b border-[#e0d8cf] scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeCategory === cat.value
                    ? "bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white shadow-md"
                    : "bg-[#f6ede8] text-[#6b5847] hover:bg-[#e0d8cf]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto py-2">

            {/* Empty state — show discovery sections */}
            {!hasQuery && (
              <>
                <SectionRow
                  icon={<TrendingUp className="w-3.5 h-3.5 text-[#8b7355]" />}
                  label="Trending This Week"
                  groups={trendingGroups}
                  onJoin={handleJoinClick}
                  joiningGroupId={joiningGroupId}
                  onOpenGroup={handleOpenGroup}
                />
                <SectionRow
                  icon={<Flame className="w-3.5 h-3.5 text-orange-500" />}
                  label="Most Popular"
                  groups={popularGroups}
                  onJoin={handleJoinClick}
                  joiningGroupId={joiningGroupId}
                  onOpenGroup={handleOpenGroup}
                />
                <SectionRow
                  icon={<Sparkles className="w-3.5 h-3.5 text-yellow-500" />}
                  label="Recommended"
                  groups={recommendedGroups}
                  onJoin={handleJoinClick}
                  joiningGroupId={joiningGroupId}
                  onOpenGroup={handleOpenGroup}
                />
                {!trendingGroups.length && !popularGroups.length && (
                  <div className="text-center py-10 text-[#8b7355]">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">Search for a study group</p>
                    <p className="text-xs text-[#c4b5a5] mt-1">
                      Type anything or select a category above
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Search results */}
            {hasQuery && (
              <>
                {searchLoading && (
                  <div className="flex items-center justify-center py-10 gap-2 text-[#8b7355]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Searching...</span>
                  </div>
                )}

                {!searchLoading && hasResults && (
                  <>
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-xs font-bold text-[#8b7355] uppercase tracking-widest">
                        Results
                      </span>
                      <span className="text-xs text-[#c4b5a5]">
                        {searchResults.length} found
                      </span>
                    </div>
                    {searchResults.map((group) => (
                      <SearchResultCard
                        key={group.groupId}
                        group={group}
                        onJoin={handleJoinClick}
                        joiningGroupId={joiningGroupId}
                        onOpenGroup={handleOpenGroup}
                      />
                    ))}
                  </>
                )}

                {!searchLoading && !hasResults && (
                  <div className="text-center py-10 text-[#8b7355]">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No groups found</p>
                    <p className="text-xs text-[#c4b5a5] mt-1">
                      Try a different search or category
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toasts */}
      {joinSuccess && (
        <div className="fixed bottom-6 right-6 z-[60] bg-green-500 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold">
          ✓ {joinSuccess}
        </div>
      )}
      {joinError && (
        <div className="fixed bottom-6 right-6 z-[60] bg-red-500 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold">
          ✕ {joinError}
        </div>
      )}

      {/* Join Modal */}
      {joinModalGroup && (
        <JoinGroupModal
          group={joinModalGroup}
          onClose={() => setJoinModalGroup(null)}
          onRequest={handleRequestAccess}
          isLoading={joiningGroupId === joinModalGroup?.groupId}
        />
      )}
    </>
  );
}