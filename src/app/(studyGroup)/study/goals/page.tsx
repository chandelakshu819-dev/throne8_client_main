"use client";

import React from "react";
import GoalsHeader from "@/features/studyGroup/components/GoalsHeader";
import WeeklyTracker from "@/features/studyGroup/components/WeeklyTracker";
import { STUDY_PAGE_WRAP } from "@/features/study-group/constants/pageLayout";

const Goals: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f7f3ee] py-4 md:py-6 lg:py-8">
      <div className={STUDY_PAGE_WRAP}>
        <GoalsHeader />
        <WeeklyTracker />
      </div>
    </div>
  );
};

export default Goals;
