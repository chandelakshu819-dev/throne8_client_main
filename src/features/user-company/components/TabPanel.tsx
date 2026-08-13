'use client'
import dynamic from 'next/dynamic'
import { useAppSelector } from '@/core/store/store.hooks'

const Spinner = () => (
  <div className="py-16 flex justify-center">
    <div className="w-5 h-5 border-2 border-[#d4c4b5] border-t-[#4a3728] rounded-full animate-spin" />
  </div>
)

const OverviewTab = dynamic(() => import('@/features/user-company/components/overview/OverviewTab').then(m => ({ default: m.OverviewTab })), { loading: () => <Spinner />, ssr: false })
const AboutTab = dynamic(() => import('@/features/user-company/components/about/AboutTab').then(m => ({ default: m.AboutTab })), { loading: () => <Spinner />, ssr: false })
const PostsTab = dynamic(() => import('@/features/user-company/components/posts/PostsTab').then(m => ({ default: m.PostsTab })), { loading: () => <Spinner />, ssr: false })
const EventsTab = dynamic(() => import('@/features/user-company/components/events/EventsTab').then(m => ({ default: m.EventsTab })), { loading: () => <Spinner />, ssr: false })
const LifeTab = dynamic(() => import('@/features/user-company/components/life/LifeTab').then(m => ({ default: m.LifeTab })), { loading: () => <Spinner />, ssr: false })
const JobsTab = dynamic(() => import('@/features/user-company/components/jobs/JobsTab').then(m => ({ default: m.JobsTab })), { loading: () => <Spinner />, ssr: false })
const ProductsTab = dynamic(() => import('@/features/user-company/components/products/ProductsTab').then(m => ({ default: m.ProductsTab })), { loading: () => <Spinner />, ssr: false })

export function TabPanel() {
  const activeTab = useAppSelector((s) => s.ui.activeTab)
  const PANELS = { overview: OverviewTab, about: AboutTab, posts: PostsTab, events: EventsTab, life: LifeTab, jobs: JobsTab, products: ProductsTab } as const
  const Panel = PANELS[activeTab as keyof typeof PANELS] ?? OverviewTab
  return (
    <div role="tabpanel" className="min-h-[60vh]">
      <Panel />
    </div>
  )
}