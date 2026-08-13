'use client';
// src/features/user-company/components/posts/PostAuthorRow.tsx
import { Avatar } from '../ui';
import type { PostAuthor } from '@/features/company/type/company.types';
import { relativeTime } from '../../../../shared/utils/format';

interface Props {
  author: PostAuthor;
  publishedAt: string;
  light?: boolean;
}

export function PostAuthorRow({ author, publishedAt, light = false }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar
        src={author.avatarUrl}
        initials={author.initials}
        alt={author.name}
        size="sm"
        rounded="full"
      />
      <div>
        <p className={`text-xs font-bold leading-tight ${light ? 'text-white' : 'text-brand-brown'}`}>
          {author.name}
        </p>
        <p className={`text-xs leading-tight ${light ? 'text-white/60' : 'text-brand-brown/45'}`}>
          {author.role} · {relativeTime(publishedAt)}
        </p>
      </div>
    </div>
  );
}
