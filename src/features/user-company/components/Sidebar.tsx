// src/app/user-company/_components/Sidebar.tsx
'use client'
import { useCallback } from 'react'
import { UserPlus, TrendingUp, Linkedin, Twitter, Github, Instagram } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setActiveTab } from '@/features/company/store/slices/uiSlice'
import { MOCK_SUGGESTED_PEOPLE } from '@/features/company/constants/company.data'

export function Sidebar() {
  const dispatch = useAppDispatch()
  const meta = useAppSelector((s) => s.company.meta)
  const following = useAppSelector((s) => s.ui.followingCompany)
  const featuredJobs = useAppSelector((s) => s.company.jobs.filter((j) => j.isActive).slice(0, 3))
  const goToJobs = useCallback(() => dispatch(setActiveTab('jobs')), [dispatch])
  if (!meta) return null;

  return (
    <aside className="space-y-4">

      {following && (
        <div className="card p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-bold text-[#4a3728]">Following Throne8</p>
          </div>
          <p className="text-xs text-[#6b5847]">Updates will appear in your feed.</p>
        </div>
      )}

      {/* Company overview */}
      <div className="card p-4">
        <p className="text-[10px] font-bold text-[#9d8876] uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" /> Company Overview
        </p>
        <dl className="space-y-2">
          {[
            { label: 'Founded', value: meta.founded },
            { label: 'Industry', value: meta.industry },
            { label: 'Size', value: meta.size },
            { label: 'HQ', value: meta.headquarters.city + ', India' },
            { label: 'Website', value: meta.website.replace('https://', '') },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-2 text-xs">
              <dt className="text-[#9d8876] font-medium shrink-0">{label}</dt>
              <dd className="text-[#4a3728] font-semibold text-right">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex gap-1.5 mt-4 pt-3 border-t border-[#e8ddd4]">
          {[
            { href: meta.socialLinks.linkedin, Icon: Linkedin, label: 'LinkedIn' },
            { href: meta.socialLinks.twitter, Icon: Twitter, label: 'Twitter' },
            { href: meta.socialLinks.github, Icon: Github, label: 'GitHub' },
            { href: meta.socialLinks.instagram, Icon: Instagram, label: 'Instagram' },
          ].filter(s => s.href).map(({ href, Icon, label }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
              className="p-1.5 rounded-lg text-[#4a3727] hover:text-[#4a3728] hover:bg-[#f0ebe5] transition-colors">
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>

      {/* Featured roles */}
      <div className="card p-4">
        <p className="text-[10px] font-bold text-[#9d8876] uppercase tracking-widest mb-3">Featured Roles</p>
        <div className="space-y-3">
          {featuredJobs.map((job) => (
            <button key={job.id} onClick={goToJobs} className="w-full text-left group">
              <p className="text-sm font-semibold text-[#4a3728] group-hover:text-[#2d1f14] transition-colors leading-snug">
                {job.title}
              </p>
              <p className="text-xs text-[#9d8876] mt-0.5">{job.location} · {job.type}</p>
            </button>
          ))}
        </div>
        <button onClick={goToJobs} className="mt-3 text-xs font-semibold text-[#6b5847] hover:text-[#4a3728] transition-colors">
          View all open roles →
        </button>
      </div>

      {/* People you may know */}
      <div className="card p-4 sticky top-[112px]">
        <p className="text-[10px] font-bold text-[#9d8876] uppercase tracking-widest mb-0.5">People You May Know</p>
        <p className="text-xs text-[#9d8876] mb-4">From your industry</p>
        <div className="space-y-4">
          {MOCK_SUGGESTED_PEOPLE.map((p) => (
            <div key={p.id} className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#4a3728] flex items-center justify-center text-[#e0d8cf] text-xs font-bold shrink-0">
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#4a3728] truncate">{p.name}</p>
                <p className="text-xs text-[#9d8876] line-clamp-1">{p.title}</p>
                {p.mutualConnections && (
                  <p className="text-[10px] text-[#c4b8ab] mt-0.5">{p.mutualConnections} mutual</p>
                )}
                <button className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#6b5847] hover:text-[#4a3728] transition-colors">
                  <UserPlus className="w-3 h-3" /> Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
