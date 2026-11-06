"use client";
//src/features/studyGroup/components/GroupGrid.tsx
import React from 'react';
import GroupCard from './GroupCard';
import { GROUP_GRID, SectionHeader, ShowMoreButton } from './GroupSectionUI';
import { useAppDispatch, useAppSelector } from '@/core/store/store.hooks';
import {
  toggleSectionExpanded,
  selectExpandedSections,
  selectFilteredUniversityGroups,
  selectFilteredDsaGroups,
  selectFilteredJeeGroups,
  selectUniversityGroups,
  selectPlacementGroups,
  selectUniversityGroupsLoading,
  selectPlacementGroupsLoading,
  selectPublicGroupsFromApi,
  selectPublicGroupsFromApiLoading,
} from '@/hooks/studyGroup/features/groups/groupsSlice';
import type { Group } from '../interface';
import { GroupResponse } from '@/lib/api/studyGroup.service';
import SkeletonLoader from '@/app/loading';
import { SectionKey } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────



interface GroupGridProps {
  title: string;
  subtitle?: string;
  /** Which Redux-managed group list to display */
  sectionKey: SectionKey;
  icon?: React.ReactNode;
}

// ─── Selector map ─────────────────────────────────────────────────────────────

const INITIAL_DESKTOP_CARDS = 3;
const INITIAL_MOBILE_CARDS = 2;

// ─── Component ────────────────────────────────────────────────────────────────

const GroupGrid: React.FC<GroupGridProps> = ({ title, subtitle, sectionKey, icon }) => {
  const dispatch = useAppDispatch();

  // Pick the right filtered selector based on sectionKey
  // const universityGroups = useAppSelector(selectFilteredUniversityGroups);
  // const dsaGroups = useAppSelector(selectFilteredDsaGroups);
  // const jeeGroups = useAppSelector(selectFilteredJeeGroups);
  const universityGroups = useAppSelector(selectUniversityGroups) ?? [];
  const placementGroups = useAppSelector(selectPlacementGroups) ?? [];
  const universityLoading = useAppSelector(selectUniversityGroupsLoading);
  const placementLoading = useAppSelector(selectPlacementGroupsLoading);
  const publicGroups = useAppSelector(selectPublicGroupsFromApi) ?? [];
  const publicLoading = useAppSelector(selectPublicGroupsFromApiLoading);
  // ADD new section key type

  const jeeGroups = useAppSelector(selectFilteredJeeGroups) ?? [];

  const apiGroupMap: Record<SectionKey, any[]> = {
    university: universityGroups,
    dsa: placementGroups,
    jee: jeeGroups,
    public: publicGroups,
  };

  const loadingMap: Record<SectionKey, boolean> = {
    university: universityLoading,
    dsa: placementLoading,
    jee: false,
    public: publicLoading,
  };

  // REPLACE groups variable
  const groups = apiGroupMap[sectionKey];
  const isLoading = loadingMap[sectionKey];



  const expandedSections = useAppSelector(selectExpandedSections);
  const showAll = expandedSections?.[sectionKey] ?? false;

  const displayedGroups = showAll ? groups : groups.slice(0, INITIAL_DESKTOP_CARDS);
  const hasMoreGroups = groups.length > INITIAL_DESKTOP_CARDS;

  const handleToggle = () => dispatch(toggleSectionExpanded(sectionKey));

  if (isLoading) return <SkeletonLoader count={3} />;

  return (
    <section className="mx-auto w-full max-w-7xl">
      <SectionHeader title={title} subtitle={subtitle} icon={icon} />

      {/* Cards Grid */}
      <div className={GROUP_GRID}>
        {displayedGroups && displayedGroups.length > 0 ? (
          displayedGroups.map((g, index) => (
            <div
              key={(g as any).groupId ?? index}
              className={
                !showAll && index >= INITIAL_MOBILE_CARDS
                  ? 'hidden lg:block h-full'
                  : 'h-full'
              }
            >
              <GroupCard group={g} />
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-[#d4c4b5] bg-white/50 py-12 text-center text-[#6b5847]">
            <p className="text-base">No groups found.</p>
          </div>
        )}
      </div>

      {/* Show More / Show Less */}
      {hasMoreGroups && <ShowMoreButton expanded={showAll} onClick={handleToggle} />}
    </section>
  );
};

export default GroupGrid;

