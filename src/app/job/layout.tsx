import { JobsTopNav } from '@/features/jobs/components/jobs/JobTopNav'

export default function JobLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f7f3ef]">
      <JobsTopNav />
      {children}
    </div>
  )
}