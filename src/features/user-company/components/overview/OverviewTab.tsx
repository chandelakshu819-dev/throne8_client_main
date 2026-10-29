'use client';
import Image from 'next/image';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useOverview } from '../../hooks/useOverview';
import { StatCard } from './StatCard';
import { NewsCard } from './NewsCard';
import { useAppDispatch } from '@/store/hooks';
import { TestimonialCard } from './TestimonialCard';
import { setActiveTab } from '@/features/company/store/slices/uiSlice';
import { Card, SectionHeading, Button } from '../ui';

export function OverviewTab() {
  const { stats, news, testimonials, meta, shouldAnimate, statsRef, activeTestimonial, setActiveTestimonial } = useOverview();
  const dispatch = useAppDispatch();
  if (!meta) return null;

  return (
    <div className="space-y-8 animate-slide-up">

      {/* Stats row */}
      <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats?.map((stat) => <StatCard key={stat.id} stat={stat} animate={shouldAnimate} />)}
      </div>

      {/* About + News */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Compact about */}
        <Card padding="lg" className="lg:col-span-2 space-y-4">
          <SectionHeading icon={<TrendingUp className="w-5 h-5 text-brand-light" />}>About</SectionHeading>
          <p className="text-sm text-brand-brown/80 leading-relaxed">{meta.description}</p>
          <dl className="space-y-2 pt-2 border-t border-brand-beige">
            {[
              { label: 'Website', value: meta.website.replace('https://', '') },
              { label: 'Industry', value: meta.industry },
              { label: 'HQ', value: meta.headquarters.full },
              { label: 'Founded', value: meta.founded },
              { label: 'Team size', value: `${meta.employeeCount} people` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <dt className="text-brand-brown/45 w-24 flex-shrink-0 font-medium">{label}</dt>
                <dd className="font-semibold text-brand-brown">{value}</dd>
              </div>
            ))}
          </dl>
          <Button variant="ghost" size="sm" className="-ml-2"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => dispatch(setActiveTab('about'))}>
            Full story
          </Button>
        </Card>

        {/* News */}
        <Card padding="lg" className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeading>Latest Updates</SectionHeading>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>See all</Button>
          </div>
          <div className="space-y-3">
            {news.map((post) => <NewsCard key={post.id} post={post} />)}
          </div>
        </Card>
      </div>

      {/* Testimonials */}
      <Card padding="lg">
        <SectionHeading subtitle="Trusted by 50,000+ professionals" className="mb-6">What our users say</SectionHeading>
        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t, idx) => (
            <TestimonialCard
              key={t.id} testimonial={t}
              isActive={activeTestimonial === idx}
              onClick={() => setActiveTestimonial(idx)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
