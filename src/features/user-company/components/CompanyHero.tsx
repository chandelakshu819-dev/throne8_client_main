'use client'
import Image from 'next/image'
import { useCallback } from 'react'
import { Bell, BellRing, UserPlus, UserCheck, ExternalLink, MapPin, Users, Zap, Globe, CalendarDays, Shield, TrendingUp } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toggleFollow, toggleNotifications } from '@/features/company/store/slices/uiSlice'
import { decrementFollowers, incrementFollowers } from '@/features/company/store/slices/companySlice'
import CompanyService from '@/lib/api/company.service'

export function CompanyHero() {
  const dispatch = useAppDispatch()
  const apiData = useAppSelector((s) => s.company.apiData)
  const jobs = useAppSelector((s) => s.company.jobs)
  const following = useAppSelector((s) => s.ui.followingCompany)
  const notifOn = useAppSelector((s) => s.ui.notificationsEnabled)

  const activeJobs = jobs?.filter((j) => j.isActive).length ?? apiData?.stats?.activeJobs ?? 0

  const handleFollow = useCallback(async () => {
    try {
      const companyId = apiData?.companyId;
      if (!companyId) return;

      if (following) {
        // Unfollow
        await CompanyService.unfollowCompany(companyId);
        dispatch(toggleFollow());
        dispatch(decrementFollowers());
      } else {
        // Follow
        await CompanyService.followCompany(companyId);
        dispatch(toggleFollow());
        dispatch(incrementFollowers());
      }
    } catch (error: any) {
      console.error('Follow/Unfollow failed:', error.message);
      // Agar API fail ho to UI revert mat karo
    }
  }, [dispatch, following, apiData?.companyId])


  const handleNotif = useCallback(() => dispatch(toggleNotifications()), [dispatch])

  // Dynamic fields from apiData
  const companyName = apiData?.companyName ?? ''
  const logoUrl = apiData?.media?.logo?.url ?? null
  const description = apiData?.descriptions?.tagline ?? ''
  const city = apiData?.headquarters?.city ?? ''
  const country = apiData?.headquarters?.country ?? ''
  const companySize = apiData?.companySize ?? ''
  const foundedYear = apiData?.foundedYear ?? ''
  const website = apiData?.website ?? ''
  const websiteDisplay = website.replace(/^https?:\/\//, '')

  return (
    <section className="relative overflow-hidden bg-[#f7f3ef]">

      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: 'radial-gradient(#4a3728 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Blur blobs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#d4c4b5] opacity-40 blur-[80px] pointer-events-none" />
      <div className="absolute top-0 right-[20%] w-64 h-64 rounded-full bg-[#e0d8cf] opacity-30 blur-[60px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* ── TOP ROW: Logo + Identity + Actions ── */}
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center mb-5">

          {/* Logo */}
          <div className="shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] bg-white border border-[#d4c4b5] shadow-[0_4px_20px_rgba(74,55,40,0.12)] overflow-hidden flex items-center justify-center p-1.5">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${companyName} logo`}
                width={72}
                height={72}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#f0ebe5] rounded-xl">
                <span className="text-2xl font-black text-[#4a3728]">
                  {companyName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name + pills */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <h1 className={[
                'font-black text-[#2d1f14] leading-none tracking-tight',
                companyName.length > 20 ? 'text-2xl sm:text-3xl' :
                  companyName.length > 12 ? 'text-2xl sm:text-3xl lg:text-4xl' :
                    'text-3xl sm:text-4xl lg:text-[44px]',
              ].join(' ')}>
                {companyName}<span className="text-[#c9a882]">.</span>
              </h1>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleFollow}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-[0.98] ${following
                ? 'bg-[#f0ebe5] text-[#4a3728] border-[#d4c4b5] hover:bg-[#e8e0d8]'
                : 'bg-[#4a3728] text-[#e0d8cf] border-[#4a3728] hover:bg-[#3a2a1e] shadow-sm'
                }`}
            >
              {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {following ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={handleNotif}
              aria-label="Toggle notifications"
              className={`p-2 rounded-xl border transition-all ${notifOn
                ? 'bg-[#4a3728] text-[#e0d8cf] border-[#4a3728]'
                : 'bg-white text-[#6b5847] border-[#d4c4b5] hover:border-[#4a3728]'
                }`}
            >
              {notifOn ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </button>
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white text-[#6b5847] border border-[#d4c4b5] hover:border-[#4a3728] hover:text-[#4a3728] transition-all"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* ── DESCRIPTION ── */}
        {description && (
          <div className="flex gap-3 mb-6 max-w-2xl">
            <div className="w-[3px] shrink-0 self-stretch rounded-full bg-gradient-to-b from-[#c9a882] via-[#c9a882]/40 to-transparent" />
            <p className="text-[#6b5847] text-sm leading-relaxed">{description}</p>
          </div>
        )}

        {/* ── SINGLE INFO STRIP ── */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">

          {/* Meta chips */}
          {[
            city || country
              ? { Icon: MapPin, text: [city, country].filter(Boolean).join(', ') }
              : null,
            companySize
              ? { Icon: Users, text: companySize }
              : null,
            foundedYear
              ? { Icon: CalendarDays, text: `Founded ${foundedYear}` }
              : null,
            websiteDisplay
              ? { Icon: Globe, text: websiteDisplay }
              : null,
          ]
            .filter((item): item is { Icon: any; text: any } => Boolean(item))
            .map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs font-bold text-[#6b5847]">
                <Icon className="w-3.5 h-3.5 text-[#9d8876]" />
                {text}
              </div>
            ))}

          {/* Divider */}
          <div className="hidden sm:block w-px h-4 bg-[#d4c4b5]" />

          {/* Divider */}
          <div className="hidden sm:block w-px h-4 bg-[#d4c4b5]" />

          {/* Growth badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">Top SaaS · 2024</span>
          </div>

        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-[#d4c4b5]" />
    </section>
  )
}