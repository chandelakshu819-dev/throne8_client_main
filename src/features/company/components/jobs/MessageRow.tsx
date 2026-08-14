//src/features/company/components/jobs/MessageRow.tsx
import { memo, useCallback } from 'react';
import type { Contact } from '../../interface';

interface Props {
  msg: Contact;
  isSelected: boolean;
  onSelect: (msg: Contact) => void;
}

// memo — clicking any message changes `selected` in parent
// Without memo: ALL 7 rows re-render on every click
// With memo: only the deselected + newly selected row re-render (isSelected changed)
const MessageRow = memo(function MessageRow({ msg, isSelected, onSelect }: Props) {
  const handleClick = useCallback(() => onSelect(msg), [msg, onSelect]);

  return (
    <div onClick={handleClick}
      className={`flex items-start gap-3 p-4 cursor-pointer border-b border-[#e0d8cf]/50 transition-all duration-200
        ${isSelected ? 'bg-[#4a3728]/10' : 'hover:bg-[#e0d8cf]/40'}
        ${!msg.read ? 'bg-[#4a3728]/5' : ''}`}>
      <div className={`w-9 h-9 ${msg.color} rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
        {msg.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm truncate ${!msg.read ? 'font-bold text-[#4a3728]' : 'font-medium text-[#4a3728]/80'}`}>
            {msg.from}
          </p>
          <span className="text-[10px] text-[#4a3728]/40 flex-shrink-0 ml-2">{msg.time}</span>
        </div>
        <p className="text-xs text-[#4a3728]/60 truncate">{msg.preview}</p>
      </div>
      {!msg.read && <div className="w-2 h-2 bg-[#4a3728] rounded-full flex-shrink-0 mt-1" />}
    </div>
  );
});

export default MessageRow;