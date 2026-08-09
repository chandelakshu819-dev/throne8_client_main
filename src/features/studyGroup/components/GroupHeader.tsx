import Image from 'next/image';
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import { setBrowseSearchQuery as setSearchQuery, selectBrowseSearchQuery as selectSearchQuery } from '@/hooks/studyGroup/features/groups/groupsSlice';
import SearchDropdown from '@/features/study-group/components/study/dropdown';
import FilterModal from '@/features/study-group/modals/FilterModal';

const GroupHeader = () => {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(selectSearchQuery);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="relative overflow-visible py-4 sm:py-6 lg:py-8">
      <section className="max-w-7xl mx-auto relative">
        <div className="backdrop-blur-2xl bg-white/40 border-2 border-white/60 rounded-3xl shadow-xs overflow-visible">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center justify-between px-6 sm:px-8 lg:px-10 py-6 sm:py-8 lg:py-10 relative">

            <div className="absolute top-8 left-12 w-20 h-20 bg-gradient-to-br from-[#8b7355]/20 to-[#6b5847]/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-16 right-16 w-28 h-28 bg-gradient-to-tl from-[#6b5847]/15 to-[#8b7355]/15 rounded-full blur-2xl animate-pulse delay-300" />

            {/* Left – Text + Search + Stats */}
            <div className="flex flex-col gap-4 max-w-xl z-[100] w-full lg:w-1/2">
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
                  { value: '500+', label: 'Active Groups' },
                  { value: '10K+', label: 'Members' },
                  { value: '50+', label: 'Subjects' },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="backdrop-blur-xl bg-white/50 px-5 py-3 rounded-xl border border-white/60 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                  >
                    <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#4a3728] to-[#8b7355] bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-[#6b5847] font-semibold whitespace-nowrap">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right – Video Card */}
            <div className="relative w-full lg:w-1/2 max-w-lg z-10">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#8b7355]/20 to-[#6b5847]/20 rounded-3xl blur-2xl" />

              <div className="relative backdrop-blur-2xl bg-gradient-to-br from-[#4a3728]/90 to-[#6b5847]/90 p-3 rounded-3xl shadow-2xl border-2 border-white/20">
                <div className="bg-gradient-to-br from-[#2a1f18] to-[#1a140f] rounded-2xl overflow-hidden aspect-video group relative cursor-pointer">
                  <Image
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                    alt="Study group collaboration"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8b7355]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="backdrop-blur-xl bg-white/95 hover:bg-white text-[#4a3728] w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all border-4 border-white/50">
                      <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 backdrop-blur-sm bg-gradient-to-t from-black/60 to-transparent">
                    <h3 className="text-white font-bold text-lg mb-1">How to Use Study Groups</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <p className="text-white/90 text-sm font-medium">2-minute guide</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 backdrop-blur-2xl bg-white/80 px-6 py-4 rounded-2xl shadow-2xl border-2 border-white/60 flex items-center gap-3">
                <div className="relative">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75" />
                </div>
                <div className="text-sm">
                  <span className="font-extrabold text-[#4a3728] text-lg">250+</span>{' '}
                  <span className="text-[#6b5847] font-semibold">Studying Now</span>
                </div>
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
