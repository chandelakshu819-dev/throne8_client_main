"use client";

import React from "react";
import GoalsHeader from "@/features/studyGroup/components/GoalsHeader";
import WeeklyTracker from "@/features/studyGroup/components/WeeklyTracker";

const Goals: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f7f3ee] mt-20 p-4 md:p-6 lg:p-8">
      <GoalsHeader />
      <WeeklyTracker />
    </div>
  );
};

export default Goals;
