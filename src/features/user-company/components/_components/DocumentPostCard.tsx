'use client';

import Image from 'next/image';
import { Download, Eye, FileText, Archive, Table, Presentation } from 'lucide-react';
import { PostAuthorRow } from './PostAuthorRow';
import { PostEngagement } from '../posts/PostEngagement';
import { Button } from '../ui';
import type { DocumentPost, DocumentFileType } from '@/features/company/type/company.types';

const FILE_META: Record<DocumentFileType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  pdf: { label: 'PDF', color: 'text-red-700', bg: 'bg-red-50   border-red-200', Icon: FileText },
  ppt: { label: 'PPT', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', Icon: Presentation },
  doc: { label: 'DOC', color: 'text-blue-700', bg: 'bg-blue-50  border-blue-200', Icon: FileText },
  xls: { label: 'XLS', color: 'text-green-700', bg: 'bg-green-50 border-green-200', Icon: Table },
  csv: { label: 'CSV', color: 'text-teal-700', bg: 'bg-teal-50  border-teal-200', Icon: Table },
  zip: { label: 'ZIP', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', Icon: Archive },
};

export function DocumentPostCard({ post }: { post: DocumentPost }) {
  const meta = FILE_META[post.fileType];
  const { Icon } = meta;

  return (
    <article className="bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-beige/60 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">

      {/* Preview image or file icon banner */}
      {post.previewUrl ? (
        <div className="relative h-36 overflow-hidden">
          <Image
            src={post.previewUrl} alt={post.title} fill
            className="object-cover opacity-60"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
          {/* File type badge over preview */}
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${meta.bg} ${meta.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {meta.label}
          </div>
        </div>
      ) : (
        /* No preview — show branded banner */
        <div className="h-24 bg-gradient-to-br from-brand-beige to-brand-cream flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #4a3728 0, #4a3728 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${meta.bg} ${meta.color} relative z-10`}>
            <Icon className="w-5 h-5" />
            <span className="text-sm font-black">{meta.label}</span>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-4 space-y-3">
        <PostAuthorRow author={post.author} publishedAt={post.publishedAt} />

        <div>
          <h3 className="text-sm font-bold text-brand-brown leading-snug">{post.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-brand-brown/45">
            <span>{post.fileSize}</span>
            {post.pageCount && <><span>·</span><span>{post.pageCount} pages</span></>}
          </div>
        </div>

        <p className="text-xs text-brand-brown/70 leading-relaxed line-clamp-2">{post.caption}</p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <span key={t} className="text-xs font-medium text-brand-medium">#{t}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-brand-beige">
          <Button
            variant="primary" size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => window.open(post.downloadUrl, '_blank')}
          >
            Download
          </Button>
          {post.previewUrl && (
            <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
              Preview
            </Button>
          )}
          <div className="ml-auto">
            <PostEngagement likes={post.likes} comments={post.comments} shares={post.shares} />
          </div>
        </div>
      </div>
    </article>
  );
}
