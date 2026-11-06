"use client";

import TopRankedGroups from '@/features/studyGroup/components/TopRankedGroups';
import React, { useEffect } from 'react';
import GroupHeader from '@/features/studyGroup/components/GroupHeader';
import CTA from '@/features/studyGroup/components/CTA';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPlacementGroupsThunk, fetchPopularGroupsThunk, fetchPublicGroupsThunk, fetchTopRankedGroupsThunk, fetchTrendingGroupsThunk, fetchUniversityGroupsThunk } from '@/hooks/studyGroup/features/groups/group.thunks';
import GroupGrid from '@/features/studyGroup/components/GroupGrid';
import { GraduationCap, Globe, Briefcase } from 'lucide-react';
import { useGroupData } from '@/features/study-group/hooks/useGroupData';




const Groups: React.FC = () => {
  const dispatch = useAppDispatch();
  const { fetchMyJoinRequests } = useGroupData();

  useEffect(() => {
    dispatch(fetchTopRankedGroupsThunk(10));
    dispatch(fetchUniversityGroupsThunk(10));
    dispatch(fetchPlacementGroupsThunk(10));
    dispatch(fetchPublicGroupsThunk(10));
    dispatch(fetchTrendingGroupsThunk(6));
    dispatch(fetchPopularGroupsThunk(6));
    fetchMyJoinRequests();
  }, [dispatch]);





  // Every section uses the same horizontal and vertical spacing.
  const SECTION = "px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 lg:py-10";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f6ede8] via-[#ede4db] to-[#e0d8cf] overflow-x-hidden">
      <div className="w-full max-w-[1920px] mx-auto">

        <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <GroupHeader />
        </div>

        <div className={SECTION}>
          <TopRankedGroups />
        </div>

        <div className={SECTION}>
          <GroupGrid
            icon={<GraduationCap size={22} />}
            title="University Groups"
            subtitle="Find friends from your college"
            sectionKey="university"
          />
        </div>

        <div className={SECTION}>
          <GroupGrid
            icon={<Globe size={22} />}
            title="Public Groups"
            subtitle="Open groups with instant access, no approval required"
            sectionKey="public"
          />
        </div>

        <div className={SECTION}>
          <GroupGrid
            icon={<Briefcase size={22} />}
            title="Placement Groups"
            subtitle="Gear up for placements with like-minded people"
            sectionKey="dsa"
          />
        </div>

        <div className={SECTION}>
          <CTA />
        </div>

      </div>
    </div>
  );
};

export default Groups;
