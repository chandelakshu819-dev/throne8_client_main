'use client';
import { cn } from '@/shared/utils/cn';
import { Image, FileText, BookOpen, LayoutGrid } from 'lucide-react';
import type { PostFilter } from '@/features/company/type/company.types';
import type { FilterOption } from '../../hooks/usePosts';

const ICONS: Record<PostFilter, React.ElementType> = {
  all: LayoutGrid,
  image: Image,
  document: FileText,
  article: BookOpen,
};

interface Props {
  options: FilterOption[];
  activeFilter: PostFilter;
  onFilterChange: (f: PostFilter) => void;
}

export function PostsFilterBar({ options, activeFilter, onFilterChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {options.map(({ id, label, count }) => {
        const Icon = ICONS[id];
        const isActive = activeFilter === id;
        return (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200',
              isActive
                ? 'bg-brand-brown text-brand-cream shadow-md'
                : 'bg-brand-beige/60 text-brand-brown/70 hover:bg-brand-beige hover:text-brand-brown border border-brand-beige',
            )}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {label}
            <span className={cn(
              'text-xs font-bold px-1.5 py-0.5 rounded-full leading-none',
              isActive ? 'bg-brand-cream/20 text-brand-cream' : 'bg-brand-brown/10 text-brand-brown/60',
            )}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
