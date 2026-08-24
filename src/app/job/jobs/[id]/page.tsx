'use client'
// src/app/job/jobs/[id]/page.
import { useState, memo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSelector } from '@/core/store/store.hooks'
import { useJobs } from '@/features/jobs/hooks/useJobs'
import { ApplicationModal } from '@/features/jobs/components/jobs/ApplicationModal'
import { LOGO_BG, WORK_MODE_STYLE, formatSalary } from '@/features/jobs/constants/jobConstants'
import { selectAppliedJobIds, selectJobById, selectSavedJobIds } from '@/features/jobs/jobsSlice'

const BulletList = memo(function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-[#6b5847]">
          <span className={`w-1.5 h-1.5 rounded-full ${color} mt-1.5 shrink-0`} />
          {item}
        </li>
      ))}
    </ul>
  )
})

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [modal, setModal] = useState(false)

  const job = useAppSelector(selectJobById(id))
  const savedIds = useAppSelector(selectSavedJobIds)
  const appliedIds = useAppSelector(selectAppliedJobIds)
  const { handleToggleSave, handleApply } = useJobs()

  if (!job) {
    return (
      <div className="flex items-center justify-center px-4 py-24">
        <div className="text-center">
          <p className="text-[#4a3728] font-semibold text-lg mb-2">Job not found</p>
          <Link href="/job/jobs" className="text-[#6b5847] hover:text-[#4a3728] text-sm transition-colors">← Back to jobs</Link>
        </div>
      </div>
    )
  }

  const isSaved = savedIds.includes(job.id)
  const isApplied = appliedIds.includes(job.id)

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-[#6b5847] hover:text-[#4a3728] transition-colors text-sm font-medium mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Mobile: apply bar at top */}
      <div className="lg:hidden mb-4 bg-white border border-[#d4c4b5] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[#6b5847]">Compensation</p>
          <p className="text-[#4a3728] font-black text-lg">{formatSalary(job.salary.min, job.salary.max)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleToggleSave(job.id)}
            className={`p-2.5 rounded-xl border transition-colors
              ${isSaved ? 'bg-[#4a3728]/[0.07] text-[#4a3728] border-[#4a3728]/20' : 'bg-white text-[#6b5847] border-[#d4c4b5]'}`}>
            <svg className={`w-4 h-4 ${isSaved ? 'fill-[#4a3728]' : 'fill-none'}`} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            onClick={() => !isApplied && setModal(true)}
            disabled={isApplied}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors
              ${isApplied ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-[#4a3728] hover:bg-[#3a2a1e] text-[#e0d8cf]'}`}
          >
            {isApplied ? '✓ Applied' : 'Apply Now'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Job header card */}
          <div className="bg-white border border-[#d4c4b5] rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0"
                style={{ backgroundColor: LOGO_BG[job.companyLogo] ?? '#4a3728' }}>
                {job.companyLogo}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#6b5847] text-sm font-medium">{job.company}</p>
                <h1 className="text-lg sm:text-xl font-black text-[#4a3728] leading-snug mt-0.5">{job.title}</h1>
                <p className="text-[#6b5847] text-sm mt-1 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {job.location}
                </p>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border font-semibold ${WORK_MODE_STYLE[job.workMode]}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)}
              </span>
              {[job.type, `${job.experience} level`, `${job.applicants} applicants`].map(t => (
                <span key={t} className="px-3 py-1 rounded-full text-xs bg-[#f7f3ef] border border-[#d4c4b5] text-[#6b5847] font-semibold capitalize">{t}</span>
              ))}
            </div>
            <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5">
              {job.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-lg text-xs bg-[#e0d8cf]/50 text-[#4a3728] border border-[#d4c4b5] font-medium">{tag}</span>
              ))}
            </div>
          </div>

          {[
            { title: 'About the Role', body: <p className="text-[#6b5847] text-sm leading-relaxed">{job.description}</p> },
            { title: "What You'll Do", body: <BulletList items={job.responsibilities} color="bg-[#4a3728]" /> },
            { title: 'Requirements', body: <BulletList items={job.requirements} color="bg-[#6b5847]" /> },
            {
              title: 'Benefits & Perks', body: (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {job.benefits.map(b => (
                    <div key={b} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#f7f3ef] border border-[#e8ddd4]">
                      <span className="text-[#4a3728] text-xs">✦</span>
                      <span className="text-sm text-[#4a3728] font-medium">{b}</span>
                    </div>
                  ))}
                </div>
              )
            },
          ].map(({ title, body }) => (
            <div key={title} className="bg-white border border-[#d4c4b5] rounded-2xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-[#4a3728] font-bold mb-3">{title}</h2>
              {body}
            </div>
          ))}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block sticky top-[60px] space-y-3 h-fit">
          <div className="bg-white border border-[#d4c4b5] rounded-2xl p-5 shadow-sm">
            <p className="text-[#6b5847] text-xs font-medium uppercase tracking-widest mb-1">Compensation</p>
            <p className="text-[#4a3728] font-black text-xl mb-4">{formatSalary(job.salary.min, job.salary.max)} / yr</p>
            <button
              onClick={() => !isApplied && setModal(true)}
              disabled={isApplied}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors
                ${isApplied ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default' : 'bg-[#4a3728] hover:bg-[#3a2a1e] text-[#e0d8cf]'}`}
            >
              {isApplied
                ? <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Application Submitted
                </span>
                : 'Apply Now'
              }
            </button>
            <button onClick={() => handleToggleSave(job.id)}
              className={`w-full py-3 rounded-xl font-semibold text-sm mt-2 border transition-colors
                ${isSaved ? 'bg-[#4a3728]/[0.07] text-[#4a3728] border-[#4a3728]/20' : 'bg-white text-[#6b5847] border-[#d4c4b5] hover:text-[#4a3728] hover:border-[#4a3728]/30'}`}
            >
              {isSaved ? '◈ Saved' : '◇ Save Job'}
            </button>
          </div>
          <div className="bg-white border border-[#d4c4b5] rounded-2xl p-5 shadow-sm">
            <h3 className="text-[#4a3728] font-bold text-sm mb-3">Job Details</h3>
            <dl className="space-y-3">
              {[
                ['Category', job.category],
                ['Posted', new Date(job.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
                ['Deadline', new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
                ['Applicants', `${job.applicants} people`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <dt className="text-[#6b5847] text-xs font-medium">{label}</dt>
                  <dd className="text-[#4a3728] text-xs font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {modal && (
        <ApplicationModal job={job} onSubmit={() => { handleApply(job.id); setModal(false) }} onClose={() => setModal(false)} />
      )}
    </main>
  )
}