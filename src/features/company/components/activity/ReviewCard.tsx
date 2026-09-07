import { memo, useState } from 'react';

interface ReviewData {
  rating: number;
  title: string;
  content: string;
  isAnonymous: boolean;
  isVerified: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  existingResponse?: string;
}

interface Props {
  itemId: string;
  review: ReviewData;
  postedResponse?: string;
  onRespond: (id: string, text: string) => void;
  onMarkRead: (id: string) => void;
}

const SENTIMENT_STYLES = {
  positive: 'bg-green-100 text-green-700',
  neutral: 'bg-yellow-100 text-yellow-700',
  negative: 'bg-red-100 text-red-600',
} as const;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'text-yellow-400' : 'text-[#e0d8cf]'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

const ReviewCard = memo(function ReviewCard({ itemId, review, postedResponse, onRespond, onMarkRead }: Props) {
  const [isReplying, setIsReplying] = useState(false);
  const [responseText, setResponseText] = useState('');

  const hasResponse = review.existingResponse || postedResponse;

  const handleSubmit = () => {
    if (!responseText.trim()) return;
    onRespond(itemId, responseText);
    setIsReplying(false);
    setResponseText('');
  };

  return (
    <div className="mx-3.5 sm:mx-4 mb-3.5 sm:mb-4 bg-white border border-[#e0d8cf] rounded-xl p-3.5 sm:p-4 space-y-3 shadow-xs">
      <div className="flex items-start gap-2 flex-wrap">
        <Stars rating={review.rating} />
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${SENTIMENT_STYLES[review.sentiment]}`}>
          {review.sentiment}
        </span>
        {review.isVerified && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">✓ Verified Employee</span>
        )}
        {review.isAnonymous && (
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Anonymous</span>
        )}
      </div>

      <p className="text-sm font-bold text-[#4a3728]">{review.title}</p>
      <p className="text-xs text-[#4a3728]/70 leading-relaxed">{review.content}</p>

      {hasResponse && (
        <div className="bg-[#4a3728]/5 border border-[#4a3728]/15 rounded-xl p-3">
          <p className="text-[11px] font-bold text-[#4a3728] mb-1">🏢 Your Response</p>
          <p className="text-xs text-[#4a3728]/70 leading-relaxed">{postedResponse || review.existingResponse}</p>
        </div>
      )}

      {!hasResponse && (
        isReplying ? (
          <div className="space-y-2">
            <textarea
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
              placeholder="Write your company's response to this review..."
              rows={3}
              autoFocus
              className="w-full bg-white border border-[#e0d8cf] rounded-xl px-3 py-2.5 text-xs text-[#4a3728] placeholder-[#4a3728]/40 focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setIsReplying(false); setResponseText(''); }}
                className="px-3 py-1.5 text-xs font-semibold border border-[#e0d8cf] rounded-lg text-[#4a3728] hover:bg-[#e0d8cf] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-3 py-1.5 text-xs font-semibold bg-[#4a3728] text-[#f6ede8] rounded-lg hover:bg-[#6b4e3d] transition-colors"
              >
                Post Response
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setIsReplying(true); onMarkRead(itemId); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#4a3728] bg-[#e0d8cf] px-3 py-2 rounded-lg hover:bg-[#4a3728] hover:text-[#f6ede8] transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Respond as Throne8
          </button>
        )
      )}
    </div>
  );
});

export default ReviewCard;
export type { ReviewData };