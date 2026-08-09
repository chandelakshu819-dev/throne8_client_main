"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Globe, Camera, CameraOff, Users, Search,
  TrendingUp, Lock, Loader2, SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import {
  searchGroupsThunk,
  joinGroupThunk,
} from '@/hooks/studyGroup/features/groups/group.thunks';
import {
  selectSearchResults,
  selectSearchResultsLoading,
  selectJoiningGroupId,
} from '@/hooks/studyGroup/features/groups/groupsSlice';
import { GroupCategory, GroupVisibility } from '@/lib/api/studyGroup.service';
import { useRouter } from 'next/navigation';
import JoinGroupModal from '@/features/study-group/modals/joinGroupModal';
// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterState {
  categories:          string[];
  visibility:          'all' | 'public' | 'private';
  cameraRequired:      'all' | 'yes' | 'no';
  attendanceRequired:  'all' | 'yes' | 'no';
  availability:        'all' | 'available';
}

interface FilterModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  onApply?:   (filters: FilterState) => void;
}

const EMPTY_FILTERS: FilterState = {
  categories:         [],
  visibility:         'all',
  cameraRequired:     'all',
  attendanceRequired: 'all',
  availability:       'all',
};

const CATEGORIES = [
  { label: 'JEE',          value: GroupCategory.JEE },
  { label: 'NEET',         value: GroupCategory.NEET },
  { label: 'College',      value: GroupCategory.COLLEGE },
  { label: 'Placement',    value: GroupCategory.PLACEMENT },
  { label: 'Competitive',  value: GroupCategory.COMPETITIVE },
  { label: 'Language',     value: GroupCategory.LANGUAGE },
  { label: 'Professional', value: GroupCategory.WORKING_PROFESSIONAL },
  { label: 'Other',        value: GroupCategory.OTHER },
];

// ─── Result Card ──────────────────────────────────────────────────────────────

const ResultCard = ({
  group,
  joiningGroupId,
  onJoin,
  onOpen,
}: {
  group:          any;
  joiningGroupId: string | null;
  onJoin:         (group: any) => void;
  onOpen:         (groupId: string) => void;
}) => {
  const isJoining  = joiningGroupId === group.groupId;
  const isMember   = group.isMember ?? false;
  const spotsLeft  = group.capacity - group.currentMemberCount;
  const isFull     = spotsLeft <= 0;
  const fillPct    = Math.min((group.currentMemberCount / group.capacity) * 100, 100);

  return (
    <div className="group flex items-start gap-3 p-3 rounded-xl hover:bg-[#f6ede8]/60 transition-all duration-150 cursor-pointer border border-transparent hover:border-[#e0d8cf]">

      {/* Avatar */}
      <div
        onClick={() => onOpen(group.groupId)}
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b7355] to-[#4a3728] flex items-center justify-center flex-shrink-0 shadow-md"
      >
        <span className="text-white font-black text-sm">
          {group.title?.charAt(0)?.toUpperCase() ?? 'G'}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0" onClick={() => onOpen(group.groupId)}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-bold text-[#1a0f0a] truncate leading-tight">
            {group.title}
          </p>
          {group.visibility === 'private'
            ? <Lock className="w-3 h-3 text-[#8b7355] flex-shrink-0" />
            : <Globe className="w-3 h-3 text-[#8b7355] flex-shrink-0" />
          }
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs font-semibold text-[#5a3e2b] bg-[#f0e4d8] px-1.5 py-0.5 rounded-full">
            {group.category}
          </span>
          <span className="text-xs text-[#6b5847] font-medium">
            {group.currentMemberCount}/{group.capacity}
          </span>
          {!isFull
            ? <span className="text-xs text-green-700 font-semibold">{spotsLeft} left</span>
            : <span className="text-xs text-red-500 font-semibold">Full</span>
          }
        </div>

        {/* Capacity bar */}
        <div className="w-full h-1 bg-[#e0d8cf] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8b7355] to-[#4a3728] transition-all duration-300"
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          isMember ? onOpen(group.groupId) : onJoin(group);
        }}
        disabled={(isFull && !isMember) || isJoining}
        className={`flex-shrink-0 self-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
          isFull && !isMember
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isMember
            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            : 'bg-gradient-to-r from-[#8b7355] to-[#6b5847] text-white hover:from-[#6b5847] hover:to-[#4a3728] shadow-sm'
        }`}
      >
        {isJoining
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : isMember
          ? <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Open</span>
          : isFull ? 'Full' : 'Join'
        }
      </button>
    </div>
  );
};

// ─── Toggle Row ───────────────────────────────────────────────────────────────

const ToggleRow = ({
  icon,
  label,
  active,
  onToggle,
}: {
  icon:     React.ReactNode;
  label:    string;
  active:   boolean;
  onToggle: () => void;
}) => (
  <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#f6ede8]/50 transition-colors">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm font-semibold text-[#2a1810]">{label}</span>
    </div>
    <button
      onClick={onToggle}
      className={`w-10 h-5 rounded-full transition-all duration-200 relative ${
        active ? 'bg-[#8b7355]' : 'bg-[#d4c4b8]'
      }`}
    >
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
        active ? 'left-5' : 'left-0.5'
      }`} />
    </button>
  </div>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply }) => {
  const dispatch      = useAppDispatch();
  const router        = useRouter();
  const debounceRef   = useRef<NodeJS.Timeout>();

  const searchResults  = useAppSelector(selectSearchResults);
  const searchLoading  = useAppSelector(selectSearchResultsLoading);
  const joiningGroupId = useAppSelector(selectJoiningGroupId);

  const [filters, setFilters]         = useState<FilterState>(EMPTY_FILTERS);
  const [joinModalGroup, setJoinModalGroup] = useState<any | null>(null);

  // ── Run search whenever filters change ──
  const runSearch = useCallback((f: FilterState) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params: any = { limit: 30 };

      if (f.categories.length === 1) params.category = f.categories[0];
      if (f.visibility !== 'all')    params.visibility = f.visibility;
      if (f.availability === 'available') params.hasSpace = true;
      if (f.cameraRequired === 'yes') params.cameraRequired = true;
      if (f.cameraRequired === 'no')  params.cameraRequired = false;

      dispatch(searchGroupsThunk(params));
    }, 200);
  }, [dispatch]);

  // Fetch all on open
  useEffect(() => {
    if (isOpen) {
      setFilters(EMPTY_FILTERS);
      dispatch(searchGroupsThunk({ limit: 30 }));
    }
  }, [isOpen, dispatch]);

  // Re-search on filter change
  useEffect(() => {
    if (isOpen) runSearch(filters);
  }, [filters, isOpen, runSearch]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const toggleCategory = (val: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(val)
        ? prev.categories.filter(c => c !== val)
        : [...prev.categories, val],
    }));
  };

  const handleJoin = async (group: any) => {
    if (group.visibility === 'private') {
      setJoinModalGroup(group);
    } else {
      await dispatch(joinGroupThunk({ groupId: group.groupId }));
    }
  };

  const handlePrivateJoin = async (joinCode: string) => {
    if (!joinModalGroup) return;
    const result = await dispatch(joinGroupThunk({ groupId: joinModalGroup.groupId, joinCode }));
    if (joinGroupThunk.fulfilled.match(result)) {
      setJoinModalGroup(null);
    } else {
      throw new Error((result.payload as string) || 'Invalid join code');
    }
  };

  const handleOpen = (groupId: string) => {
    onClose();
    router.push(`/study/groups/${groupId}`);
  };

  const handleReset = () => setFilters(EMPTY_FILTERS);

  const handleApply = () => {
    onApply?.(filters);
    onClose();
  };

  const activeFilterCount = [
    filters.categories.length > 0,
    filters.visibility !== 'all',
    filters.cameraRequired !== 'all',
    filters.attendanceRequired !== 'all',
    filters.availability !== 'available',
  ].filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-[#e0d8cf]">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0d8cf] bg-gradient-to-r from-[#f6ede8] to-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b7355] to-[#4a3728] flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#1a0f0a]">Filter Groups</h2>
                <p className="text-xs text-[#6b5847]">
                  {searchLoading
                    ? 'Searching...'
                    : `${searchResults.length} groups found`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8b7355] hover:bg-[#f6ede8] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex flex-1 min-h-0">

            {/* Left — Filters */}
            <div className="w-64 flex-shrink-0 border-r border-[#e0d8cf] flex flex-col overflow-y-auto bg-[#fdf9f6]">
              <div className="p-4 space-y-5">

                {/* Category */}
                <div>
                  <p className="text-xs font-black text-[#8b7355] uppercase tracking-widest mb-2">
                    Category
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => toggleCategory(cat.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          filters.categories.includes(cat.value)
                            ? 'bg-[#8b7355] text-white shadow-sm'
                            : 'bg-white text-[#4a3728] border border-[#e0d8cf] hover:border-[#8b7355]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <p className="text-xs font-black text-[#8b7355] uppercase tracking-widest mb-2">
                    Visibility
                  </p>
                  <div className="flex gap-1.5">
                    {(['all', 'public', 'private'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setFilters(p => ({ ...p, visibility: v }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                          filters.visibility === v
                            ? 'bg-[#8b7355] text-white'
                            : 'bg-white text-[#4a3728] border border-[#e0d8cf] hover:border-[#8b7355]'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div>
                  <p className="text-xs font-black text-[#8b7355] uppercase tracking-widest mb-1">
                    Options
                  </p>
                  <ToggleRow
                    icon={<Camera className="w-4 h-4 text-[#8b7355]" />}
                    label="Camera On"
                    active={filters.cameraRequired === 'yes'}
                    onToggle={() => setFilters(p => ({
                      ...p,
                      cameraRequired: p.cameraRequired === 'yes' ? 'all' : 'yes',
                    }))}
                  />
                  <ToggleRow
                    icon={<CameraOff className="w-4 h-4 text-[#8b7355]" />}
                    label="Camera Off"
                    active={filters.cameraRequired === 'no'}
                    onToggle={() => setFilters(p => ({
                      ...p,
                      cameraRequired: p.cameraRequired === 'no' ? 'all' : 'no',
                    }))}
                  />
                  <ToggleRow
                    icon={<TrendingUp className="w-4 h-4 text-[#8b7355]" />}
                    label="Attendance Req."
                    active={filters.attendanceRequired === 'yes'}
                    onToggle={() => setFilters(p => ({
                      ...p,
                      attendanceRequired: p.attendanceRequired === 'yes' ? 'all' : 'yes',
                    }))}
                  />
                  <ToggleRow
                    icon={<Users className="w-4 h-4 text-[#8b7355]" />}
                    label="Has Open Slots"
                    active={filters.availability === 'available'}
                    onToggle={() => setFilters(p => ({
                      ...p,
                      availability: p.availability === 'available' ? 'all' : 'available',
                    }))}
                  />
                </div>
              </div>

              {/* Reset / Apply */}
              <div className="mt-auto p-4 border-t border-[#e0d8cf] flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-[#4a3728] border-2 border-[#e0d8cf] hover:border-[#8b7355] hover:bg-[#f6ede8] transition-all"
                >
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#8b7355] to-[#6b5847] hover:from-[#6b5847] hover:to-[#4a3728] shadow-md transition-all"
                >
                  Apply
                  {activeFilterCount > 0 && (
                    <span className="ml-1.5 bg-white/30 px-1.5 rounded-full text-xs">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Right — Results */}
            <div className="flex-1 flex flex-col min-w-0">

              {/* Results header */}
              <div className="px-4 py-3 border-b border-[#e0d8cf] flex items-center gap-2 bg-white flex-shrink-0">
                <Search className="w-4 h-4 text-[#8b7355]" />
                <span className="text-sm font-bold text-[#2a1810]">
                  {searchLoading
                    ? 'Finding groups...'
                    : searchResults.length === 0
                    ? 'No groups match your filters'
                    : `${searchResults.length} groups found`
                  }
                </span>
                {searchLoading && <Loader2 className="w-4 h-4 animate-spin text-[#8b7355] ml-auto" />}
              </div>

              {/* Results list */}
              <div className="flex-1 overflow-y-auto p-3">
                {searchLoading && (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-[#8b7355]" />
                      <p className="text-sm text-[#6b5847] font-medium">Searching groups...</p>
                    </div>
                  </div>
                )}

                {!searchLoading && searchResults.length === 0 && (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Search className="w-10 h-10 mx-auto mb-3 text-[#d4c4b8]" />
                      <p className="text-sm font-bold text-[#2a1810]">No groups found</p>
                      <p className="text-xs text-[#8b7355] mt-1">Try adjusting your filters</p>
                      <button
                        onClick={handleReset}
                        className="mt-3 text-xs font-semibold text-[#8b7355] underline"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </div>
                )}

                {!searchLoading && searchResults.length > 0 && (
                  <div className="space-y-1">
                    {searchResults.map(group => (
                      <ResultCard
                        key={group.groupId}
                        group={group}
                        joiningGroupId={joiningGroupId}
                        onJoin={handleJoin}
                        onOpen={handleOpen}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Private join modal */}
      {joinModalGroup && (
        <JoinGroupModal
          group={joinModalGroup}
          onClose={() => setJoinModalGroup(null)}
          onJoin={handlePrivateJoin}
          onRequest={async () => { await new Promise(r => setTimeout(r, 800)); }}
          isLoading={joiningGroupId === joinModalGroup?.groupId}
        />
      )}
    </>
  );
};

export default FilterModal;
export type { FilterState, FilterModalProps };















// // FilterModal.tsx - Next.js TypeScript Version

// // Import React and hooks (React import is optional in Next.js 13+)
// import React, { useState } from 'react';

// // Import icons from lucide-react (common icon library for Next.js)
// import { X, Globe, Camera, CameraOff, Users } from 'lucide-react';

// // ==========================================
// // TYPE DEFINITIONS (KEY DIFFERENCE #1)
// // ==========================================

// // Define the structure of filter state
// interface FilterState {
//   category: string[];
//   visibility: 'all' | 'public';
//   cameraRequired: 'all' | 'yes' | 'no';
//   attendanceRequired: 'all' | 'yes' | 'no';
//   availability: 'all' | 'available';
//   rank: 'all' | string;
// }

// // Define props interface for the component
// interface FilterModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onApply?: (filters: FilterState) => void; // Optional callback with filters
// }

// // ==========================================
// // COMPONENT DEFINITION (KEY DIFFERENCE #2)
// // ==========================================

// // Use React.FC (Function Component) with typed props
// const FilterModal: React.FC<FilterModalProps> = ({ 
//   isOpen, 
//   onClose, 
//   onApply 
// }) => {
  
//   // ==========================================
//   // STATE WITH TYPE ANNOTATION (KEY DIFFERENCE #3)
//   // ==========================================
  
//   const [filters, setFilters] = useState<FilterState>({
//     category: [],
//     visibility: 'all',
//     cameraRequired: 'all',
//     attendanceRequired: 'all',
//     availability: 'all',
//     rank: 'all'
//   });

//   // ==========================================
//   // CONSTANTS WITH TYPE INFERENCE
//   // ==========================================
  
//   // TypeScript infers this as readonly string array
//   const categories: readonly string[] = [
//     'University',
//     'School',
//     'Working Professional'
//   ] as const;

//   // ==========================================
//   // EVENT HANDLERS WITH TYPED PARAMETERS
//   // ==========================================
  
//   // Type the parameter as string
//   const toggleCategory = (cat: string): void => {
//     setFilters(prev => ({
//       ...prev,
//       category: prev.category.includes(cat)
//         ? prev.category.filter(c => c !== cat)
//         : [...prev.category, cat]
//     }));
//   };

//   const handleApply = (): void => {
//     console.log('Applied filters:', filters);
    
//     // Call parent callback if provided
//     if (onApply) {
//       onApply(filters);
//     }
    
//     onClose();
//   };

//   const handleReset = (): void => {
//     setFilters({
//       category: [],
//       visibility: 'all',
//       cameraRequired: 'all',
//       attendanceRequired: 'all',
//       availability: 'all',
//       rank: 'all'
//     });
//   };

//   // Early return if modal is closed
//   if (!isOpen) return null;

//   // ==========================================
//   // JSX RETURN (Similar to React JS)
//   // ==========================================
  
//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="rounded-2xl shadow-2xl max-w-xl w-full">
//         {/* Header Section */}
//         <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-2xl">
//           <div>
//             <h2 className="text-xl font-bold text-[#4a3728]">Filter Groups</h2>
//             <p className="text-sm text-[#6b5847]">Find your perfect study group</p>
//           </div>
//           <button 
//             onClick={onClose} 
//             className="text-gray-400 hover:text-gray-600"
//             aria-label="Close modal"
//           >
//             <X size={24} />
//           </button>
//         </div>

//         {/* Filter Content */}
//         <div className="p-6 space-y-4 bg-white rounded-b-2xl">
          
//           {/* Category Filter */}
//           <div>
//             <label className="block text-sm font-bold text-[#4a3728] mb-3">
//               Category
//             </label>
//             <div className="grid grid-cols-3 gap-2">
//               {categories.map((cat) => (
//                 <button
//                   key={cat}
//                   onClick={() => toggleCategory(cat)}
//                   className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
//                     filters.category.includes(cat)
//                       ? 'bg-[#8b7355] text-white shadow-md'
//                       : 'bg-[#f6ede8] text-[#4a3728] hover:bg-[#e0d8cf]'
//                   }`}
//                 >
//                   {cat}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Toggle Filters Grid */}
//           <div className="grid grid-cols-2 gap-4">
            
//             {/* Public Only Toggle */}
//             <div className="flex items-center justify-between p-3 bg-[#f6ede8] rounded-lg">
//               <div className="flex items-center gap-2">
//                 <Globe className="text-[#4a3728]" size={18} />
//                 <span className="text-sm font-semibold text-[#4a3728]">
//                   Public Only
//                 </span>
//               </div>
//               <button
//                 onClick={() => setFilters({ 
//                   ...filters, 
//                   visibility: filters.visibility === 'public' ? 'all' : 'public' 
//                 })}
//                 className={`w-11 h-6 rounded-full transition-all ${
//                   filters.visibility === 'public' ? 'bg-[#8b7355]' : 'bg-gray-300'
//                 }`}
//                 aria-label="Toggle public visibility"
//               >
//                 <div className={`w-4 h-4 bg-white rounded-full transition-all ${
//                   filters.visibility === 'public' ? 'translate-x-6' : 'translate-x-1'
//                 }`} />
//               </button>
//             </div>

//             {/* Camera On Toggle */}
//             <div className="flex items-center justify-between p-3 bg-[#f6ede8] rounded-lg">
//               <div className="flex items-center gap-2">
//                 <Camera className="text-[#4a3728]" size={18} />
//                 <span className="text-sm font-semibold text-[#4a3728]">
//                   Camera On
//                 </span>
//               </div>
//               <button
//                 onClick={() => setFilters({ 
//                   ...filters, 
//                   cameraRequired: filters.cameraRequired === 'yes' ? 'all' : 'yes' 
//                 })}
//                 className={`w-11 h-6 rounded-full transition-all ${
//                   filters.cameraRequired === 'yes' ? 'bg-[#8b7355]' : 'bg-gray-300'
//                 }`}
//                 aria-label="Toggle camera required"
//               >
//                 <div className={`w-4 h-4 bg-white rounded-full transition-all ${
//                   filters.cameraRequired === 'yes' ? 'translate-x-6' : 'translate-x-1'
//                 }`} />
//               </button>
//             </div>

//             {/* Camera Off Toggle */}
//             <div className="flex items-center justify-between p-3 bg-[#f6ede8] rounded-lg">
//               <div className="flex items-center gap-2">
//                 <CameraOff className="text-[#4a3728]" size={18} />
//                 <span className="text-sm font-semibold text-[#4a3728]">
//                   Camera Off
//                 </span>
//               </div>
//               <button
//                 onClick={() => setFilters({ 
//                   ...filters, 
//                   cameraRequired: filters.cameraRequired === 'no' ? 'all' : 'no' 
//                 })}
//                 className={`w-11 h-6 rounded-full transition-all ${
//                   filters.cameraRequired === 'no' ? 'bg-[#8b7355]' : 'bg-gray-300'
//                 }`}
//                 aria-label="Toggle camera off"
//               >
//                 <div className={`w-4 h-4 bg-white rounded-full transition-all ${
//                   filters.cameraRequired === 'no' ? 'translate-x-6' : 'translate-x-1'
//                 }`} />
//               </button>
//             </div>

//             {/* Available Only Toggle */}
//             <div className="flex items-center justify-between p-3 bg-[#f6ede8] rounded-lg">
//               <div className="flex items-center gap-2">
//                 <Users className="text-[#4a3728]" size={18} />
//                 <span className="text-sm font-semibold text-[#4a3728]">
//                   Available Only
//                 </span>
//               </div>
//               <button
//                 onClick={() => setFilters({ 
//                   ...filters, 
//                   availability: filters.availability === 'available' ? 'all' : 'available' 
//                 })}
//                 className={`w-11 h-6 rounded-full transition-all ${
//                   filters.availability === 'available' ? 'bg-[#8b7355]' : 'bg-gray-300'
//                 }`}
//                 aria-label="Toggle availability filter"
//               >
//                 <div className={`w-4 h-4 bg-white rounded-full transition-all ${
//                   filters.availability === 'available' ? 'translate-x-6' : 'translate-x-1'
//                 }`} />
//               </button>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-3 pt-2">
//             <button
//               onClick={handleReset}
//               className="flex-1 px-4 py-2 border-2 border-[#4a3728] text-[#4a3728] rounded-lg font-bold hover:bg-[#f6ede8] transition-all"
//             >
//               Reset
//             </button>
//             <button
//               onClick={handleApply}
//               className="flex-1 px-4 py-2 bg-gradient-to-r from-[#8b7355] to-[#6b5847] hover:from-[#6b5847] hover:to-[#4a3728] text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
//             >
//               Apply Filters
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ==========================================
// // EXPORT (KEY DIFFERENCE #4)
// // ==========================================

// // Named export (preferred in Next.js)
// export default FilterModal;

// // You can also export the types for use in parent components
// export type { FilterState, FilterModalProps };