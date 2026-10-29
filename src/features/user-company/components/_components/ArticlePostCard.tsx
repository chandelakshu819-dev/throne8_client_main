'use client';
import Image from 'next/image';
import { ArrowUpRight, Clock } from 'lucide-react';
import { PostAuthorRow } from './PostAuthorRow';
import { PostEngagement } from '../posts/PostEngagement';
import { Badge } from '../ui';
import type { ArticlePost } from '@/features/company/type/company.types';

export function ArticlePostCard({ post }: { post: ArticlePost }) {
  return (
    <article className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-beige/60 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">

      {/* Cover image */}
      {post.coverUrl && (
        <div className="relative h-40 overflow-hidden">
          <Image
            src={post.coverUrl} alt={post.title} fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <Badge label={post.category} variant="default" className="!bg-white/20 !text-white border border-white/20 backdrop-blur-sm" />
            <div className="flex items-center gap-1 text-white/80 text-xs">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-4 space-y-3">
        <PostAuthorRow author={post.author} publishedAt={post.publishedAt} />

        {/* Title + excerpt */}
        <div>
          {!post.coverUrl && (
            <div className="flex items-center gap-2 mb-2">
              <Badge label={post.category} />
              <span className="text-xs text-brand-brown/45 flex items-center gap-1">
                <Clock className="w-3 h-3" />{post.readTime}
              </span>
            </div>
          )}
          <h3 className="text-sm font-bold text-brand-brown leading-snug group-hover:text-brand-medium transition-colors">
            {post.title}
          </h3>
          <p className="text-xs text-brand-brown/65 mt-1.5 leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
        </div>

        <p className="text-xs text-brand-brown/60 italic line-clamp-1">{post.caption}</p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <span key={t} className="text-xs font-medium text-brand-medium">#{t}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-brand-beige">
          <PostEngagement likes={post.likes} comments={post.comments} shares={post.shares} />
          <a
            href={post.articleUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-brand-medium hover:text-brand-brown transition-colors"
          >
            Read <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
