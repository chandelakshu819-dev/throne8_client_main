import React, { useState } from 'react';
import { usePublicGroupStats, formatStat } from '@/features/studyGroup/hooks/usePublicGroupStats';
import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import { setBrowseSearchQuery as setSearchQuery, selectBrowseSearchQuery as selectSearchQuery } from '@/hooks/studyGroup/features/groups/groupsSlice';
import SearchDropdown from '@/features/study-group/components/study/dropdown';
import FilterModal from '@/features/study-group/modals/FilterModal';

const GroupHeader = () => {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(selectSearchQuery);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // Real numbers from the server; null while loading or if the request failed
  const stats = usePublicGroupStats();

  return (
    <div className="relative overflow-visible py-4 sm:py-6 lg:py-8">
      <section className="w-full relative">
        <div className="backdrop-blur-2xl bg-white/40 border-2 border-white/60 rounded-3xl shadow-xs overflow-visible">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center justify-between px-6 sm:px-8 lg:px-10 py-6 sm:py-8 lg:py-10 relative">

            <div className="absolute top-8 left-12 w-20 h-20 bg-gradient-to-br from-[#8b7355]/20 to-[#6b5847]/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-16 right-16 w-28 h-28 bg-gradient-to-tl from-[#6b5847]/15 to-[#8b7355]/15 rounded-full blur-2xl animate-pulse delay-300" />

            {/* Left – Text + Search + Stats */}
            <div className="flex flex-col gap-4 max-w-2xl z-[100] w-full">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 backdrop-blur-xl bg-gradient-to-r from-[#8b7355]/20 to-[#6b5847]/20 px-4 py-2 rounded-full border border-white/40 shadow-lg">
                  <span className="text-2xl">🎓</span>
                  <span className="text-[#4a3728] font-bold text-xs sm:text-sm">Discover & Learn Together</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#4a3728] leading-tight">
                  Find Your{' '}
                  <span className="block sm:inline bg-gradient-to-r from-[#6b5847] via-[#8b7355] to-[#6b5847] bg-clip-text text-transparent animate-gradient">
                    Study Group
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-[#6b5847] font-medium leading-relaxed">
                  Connect with passionate learners, collaborate on projects, and reach your academic goals together.
                </p>
              </div>

              {/* Search — now controlled by Redux */}

              <div className="flex flex-col sm:flex-row gap-3 relative" style={{ zIndex: 100 }}>
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      dispatch(setSearchQuery(e.target.value));
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search by topic, university, subject..."
                    className="w-full px-5 py-3.5 rounded-2xl backdrop-blur-xl bg-white text-[#1a0f0a] border-2 border-[#e0d8cf] focus:border-[#8b7355] focus:bg-white outline-none transition-all placeholder:text-[#a89080] shadow-lg hover:shadow-xl text-sm font-semibold"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b7355] opacity-50 group-focus-within:opacity-100 transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsFilterOpen(true);
                    setIsDropdownOpen(false); // close search dropdown when filter opens
                  }}
                  className="backdrop-blur-xl bg-gradient-to-r from-[#8b7355] to-[#6b5847] hover:from-[#6b5847] hover:to-[#4a3728] text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105 whitespace-nowrap text-sm border border-white/20"
                >
                  Explore Groups
                </button>
                {/* <button
                  onClick={() => {
                    // <FilterModal
                    //   isOpen={isFilterOpen}
                    //   onClose={() => setIsFilterOpen(false)}
                    // />
                    // setIsSearchOpen(true);
                    // setIsDropdownOpen(false);
                  }}
                  className="backdrop-blur-xl bg-gradient-to-r from-[#8b7355] to-[#6b5847] hover:from-[#6b5847] hover:to-[#4a3728] text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105 whitespace-nowrap text-sm border border-white/20"
                >
                  Explore Groups
                </button> */}

                {/* Dropdown — sits directly below search row */}
                <SearchDropdown
                  isOpen={isDropdownOpen}
                  onClose={() => setIsDropdownOpen(false)}
                  query={searchQuery}
                  onQueryChange={(val) => dispatch(setSearchQuery(val))}
                />
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-3 mt-2">
                {[
                  { value: formatStat(stats?.activeGroups), label: 'Active Groups' },
                  { value: formatStat(stats?.members), label: 'Members' },
                  { value: formatStat(stats?.subjects), label: 'Subjects' },
                  { value: formatStat(stats?.studyingNow), label: 'Studying Now', live: true },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="backdrop-blur-xl bg-white/50 px-5 py-3 rounded-xl border border-white/60 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                  >
                    <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#4a3728] to-[#8b7355] bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#6b5847] font-semibold whitespace-nowrap">
                      {stat.live && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
  <FilterModal
    isOpen={isFilterOpen}
    onClose={() => setIsFilterOpen(false)}
    onApply={(filters) => {
      console.log('Applied filters:', filters);
      // TODO: wire to search/filter thunk in next step
      setIsFilterOpen(false);
    }}
  />
    </div >
  );
};

export default GroupHeader;
