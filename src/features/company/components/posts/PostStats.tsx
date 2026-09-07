import { memo } from 'react';

interface Props {
  counts: { published: number; draft: number; scheduled: number };
}

const ITEMS = [
  { key: 'published' as const, label: 'Published', color: 'text-emerald-600' },
  { key: 'draft'     as const, label: 'Drafts',    color: 'text-amber-500'   },
  { key: 'scheduled' as const, label: 'Scheduled', color: 'text-blue-600'    },
];

const PostStats = memo(function PostStats({ counts }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {ITEMS.map(s => (
        <div key={s.key} className="bg-[#f6ede8]/80 border border-[#e0d8cf] rounded-xl py-2.5 px-3 text-center shadow-xs">
          <p className={`text-xl font-bold ${s.color}`}>{counts[s.key] ?? 0}</p>
          <p className="text-[11px] font-semibold text-[#4a3728]/70 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
});

export default PostStats;