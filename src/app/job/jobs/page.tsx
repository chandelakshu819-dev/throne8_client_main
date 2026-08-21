'use client'

import { useAppSelector } from '@/core/store/store.hooks'
import { FilterSidebar } from '@/features/jobs/components/jobs/FilterSidebar';
import { JobSections } from '@/features/jobs/components/jobs/JobSections';
import HeroSection from '@/features/public/components/HeroSection';

export default function JobsPage() {
  const isAuthenticated = useAppSelector((state) => state.login.isAuthenticated)

  return (
    <>
      {!isAuthenticated && <HeroSection />}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex gap-6 items-start">
          <div className="hidden lg:block w-60 shrink-0 sticky top-[57px] self-start">
            <FilterSidebar />
          </div>
          <div className="flex-1 min-w-0">
            <JobSections />
          </div>
        </div>
      </main>
    </>
  )
}