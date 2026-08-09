"use client";

import TopRankedGroups from '@/features/studyGroup/components/TopRankedGroups';
import React, { useEffect } from 'react';
import GroupHeader from '@/features/studyGroup/components/GroupHeader';
import CTA from '@/features/studyGroup/components/CTA';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPlacementGroupsThunk, fetchPopularGroupsThunk, fetchPublicGroupsThunk, fetchTopRankedGroupsThunk, fetchTrendingGroupsThunk, fetchUniversityGroupsThunk } from '@/hooks/studyGroup/features/groups/group.thunks';
import GroupGrid from '@/features/studyGroup/components/GroupGrid';
import PublicStudyGroups from '@/features/studyGroup/components/PublicGroups';
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





  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f6ede8] via-[#ede4db] to-[#e0d8cf] overflow-x-hidden">
      <div className="w-full max-w-[1920px] mx-auto">

        <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <GroupHeader />
        </div>

        <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3 sm:py-6 md:py-8 lg:py-10">
          <TopRankedGroups />
        </div>

        <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3 sm:py-6 md:py-8">
          <GroupGrid
            title="University Groups"
            subtitle="Find Friends from your College"
            sectionKey="university"
          />
        </div>

        <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3 sm:py-6 md:py-8">
          <PublicStudyGroups />
        </div>

        <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3 sm:py-6 md:py-8">
          <GroupGrid
            title="Placement Groups"
            subtitle="Gear your placement preparation with like minded people"
            sectionKey="dsa"
          />
        </div>

        <div className="px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-3 sm:py-6 md:py-8 lg:py-10">
          <CTA />
        </div>

      </div>
    </div>
  );
};

export default Groups;

