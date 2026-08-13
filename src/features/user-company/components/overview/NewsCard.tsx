'use client';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { formatDate } from '../../../../shared/utils/format';
import type { NewsPost } from '@/features/company/type/company.types';

export function NewsCard({ post }: { post: NewsPost }) {
  const href = post.externalUrl ?? `/news/${post.slug}`;
  return (
    <a
      href={href} target={post.externalUrl ? '_blank' : '_self'} rel="noopener noreferrer"
      className="group flex gap-4 p-3 -mx-3 rounded-xl hover:bg-brand-beige/40 transition-colors"
    >
      <div className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden">
        <Image
          src={post.imageUrl} alt={post.title} fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="80px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-brand-light uppercase tracking-wide">{post.category}</span>
        <h3 className="text-sm font-semibold text-brand-brown mt-0.5 line-clamp-2 leading-snug group-hover:text-brand-medium transition-colors">
          {post.title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-brand-brown/50">
          <Clock className="w-3 h-3" />
          {post.readTime}
          <span>·</span>
          {formatDate(post.date, { month: 'short', year: 'numeric' })}
        </div>
      </div>
    </a>
  );
}
