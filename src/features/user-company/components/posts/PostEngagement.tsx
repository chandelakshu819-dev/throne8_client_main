'use client';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { formatNumber } from '../../../../shared/utils/format';

interface Props {
  likes: number;
  comments: number;
  shares: number;
  light?: boolean;   // for use on dark image backgrounds
}

export function PostEngagement({ likes, comments, shares, light = false }: Props) {
  const base = light
    ? 'text-white/70 hover:text-white'
    : 'text-brand-brown/50 hover:text-brand-brown';

  return (
    <div className="flex items-center gap-4">
      <button className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${base}`}>
        <Heart className="w-3.5 h-3.5" />
        {formatNumber(likes)}
      </button>
      <button className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${base}`}>
        <MessageCircle className="w-3.5 h-3.5" />
        {formatNumber(comments)}
      </button>
      <button className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${base}`}>
        <Share2 className="w-3.5 h-3.5" />
        {formatNumber(shares)}
      </button>
    </div>
  );
}
