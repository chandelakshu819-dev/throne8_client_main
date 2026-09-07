import { memo } from 'react';
import ActivityItem, { ActivityItemData } from './ActivityItem';

interface Props {
  items: ActivityItemData[];
  postedResponses: Record<string, string>;
  onMarkRead: (id: string) => void;
  onRespond: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
}

const ActivityList = memo(function ActivityList({ items, postedResponses, onMarkRead, onRespond, onDelete }: Props) {
  if (!items.length) {
    return (
      <div className="bg-[#f6ede8]/40 border border-[#e0d8cf] rounded-2xl p-12 text-center space-y-2">
        <div className="w-12 h-12 bg-[#4a3728]/10 text-[#4a3728] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          🔔
        </div>
        <h3 className="text-sm font-bold text-[#4a3728]">No activities yet</h3>
        <p className="text-xs text-[#4a3728]/60 max-w-sm mx-auto">
          When users leave reviews, follow your company, like/comment on posts, apply to job openings, or register for events, real live notifications will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <ActivityItem
          key={item.id}
          item={item}
          postedResponse={postedResponses[item.id]}
          onMarkRead={onMarkRead}
          onRespond={onRespond}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});

export default ActivityList;