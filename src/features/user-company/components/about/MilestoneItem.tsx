'use client';
import { Milestone } from '@/features/company/type/company.types';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/features/company/components/about/ui/AboutPrimitives';

const TYPE_BADGE: Record<Milestone['type'], string> = {
  funding: 'bg-amber-100  text-amber-800',
  product: 'bg-blue-100   text-blue-800',
  growth: 'bg-emerald-100 text-emerald-800',
  team: 'bg-purple-100 text-purple-800',
  award: 'bg-pink-100   text-pink-800',
};

interface Props { milestone: Milestone; isLast: boolean; }

export function MilestoneItem({ milestone: m, isLast }: Props) {
  return (
    <div className="relative flex gap-5 items-start group">
      <div className="relative z-10 w-12 h-12 flex-shrink-0 flex items-center justify-center">
        <div className={cn(
          'w-4 h-4 rounded-full border-2 border-brand-brown shadow-md transition-all duration-300 group-hover:scale-125',
          isLast ? 'bg-brand-brown' : 'bg-brand-cream',
        )} />
      </div>
      <div className="flex-1 pb-2 group-hover:-translate-y-0.5 transition-transform duration-200">
        <div className="flex items-center flex-wrap gap-2 mb-1">
          <span className="text-xs font-bold text-brand-light bg-brand-beige px-2 py-0.5 rounded-full">
            {m.quarter ? `${m.quarter} ${m.year}` : m.year}
          </span>
          <h3 className="text-base font-bold text-brand-brown">{m.title}</h3>
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', TYPE_BADGE[m.type])}>
            {m.type}
          </span>
          {isLast && <Badge label="Now" variant="default" />}
        </div>
        <p className="text-sm text-brand-brown/70 leading-relaxed">{m.description}</p>
      </div>
    </div>
  );
}
