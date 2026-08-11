'use client';

import { memo, useEffect, useRef } from 'react';
import type { ChatMessage, Contact } from '../../interface';
import { AVATAR_COLORS } from '../../constants/data';

interface Props {
  thread: ChatMessage[];
  isTyping: boolean;
  selected: Contact | undefined;
}

function ImageBubble({ msg }: { msg: ChatMessage }) {
  return (
    // FIX: constrain width so image never overflows parent bubble column (max-w-[68%])
    <div style={{ maxWidth: '220px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e0d8cf', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <img
        src={msg.fileUrl}
        alt={msg.fileName ?? 'image'}
        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '280px', objectFit: 'cover' }}
      />
      {msg.text && (
        <div style={{ padding: '8px 12px', fontSize: '12px', background: msg.from === 'me' ? '#4a3728' : 'white', color: msg.from === 'me' ? '#f6ede8' : '#4a3728' }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

function DocBubble({ msg }: { msg: ChatMessage }) {
  const isMe = msg.from === 'me';
  return (
    <a
      href={msg.fileUrl}
      download={msg.fileName}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border max-w-[240px] transition-opacity hover:opacity-80
        ${isMe ? 'bg-[#4a3728] border-[#3a2718] text-[#f6ede8]' : 'bg-white/90 border-[#e0d8cf] text-[#4a3728]'}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-white/15' : 'bg-[#e0d8cf]'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate">{msg.fileName}</p>
        <p className={`text-[10px] mt-0.5 ${isMe ? 'text-white/50' : 'text-[#4a3728]/50'}`}>{msg.fileSize} · Download</p>
      </div>
    </a>
  );
}

const ChatThread = memo(function ChatThread({ thread, isTyping, selected }: Props) {
  const bottomRef    = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // FIX: scroll the container div directly, not scrollIntoView
  // scrollIntoView can break when the parent has overflow:hidden
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [thread.length, isTyping]);

  return (
    // FIX: style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} is the key
    // Tailwind flex-1 + overflow-y-auto alone doesn't work without minHeight: 0
    // because flex children default to min-height: auto which expands beyond container
    <div
      ref={containerRef}
      style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '16px 20px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {thread.map((msg, i) => {
          const isMe       = msg.from === 'me';
          const prevMsg    = thread[i - 1];
          const nextMsg    = thread[i + 1];
          const sameAsPrev = prevMsg?.from === msg.from;
          const sameAsNext = nextMsg?.from === msg.from;
          const showAvatar = !isMe && !sameAsNext;
          const marginTop  = !sameAsPrev ? '12px' : '2px';

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                flexDirection: isMe ? 'row-reverse' : 'row',
                marginTop,
              }}
            >
              {/* Avatar slot — always reserve space for alignment */}
              <div style={{ width: '28px', flexShrink: 0 }}>
                {showAvatar && (
                  <div
                    className={`${AVATAR_COLORS[selected?.avatar ?? ''] ?? 'bg-gray-400'}`}
                    style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: 700 }}
                  >
                    {selected?.avatar}
                  </div>
                )}
              </div>

              {/* Bubble column — max 68% width, clips children */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '68%', alignItems: isMe ? 'flex-end' : 'flex-start' }}>

                {msg.type === 'emoji' && (
                  <span style={{ fontSize: '36px', lineHeight: 1, userSelect: 'none' }}>{msg.emoji}</span>
                )}

                {msg.type === 'image' && <ImageBubble msg={msg} />}

                {msg.type === 'document' && <DocBubble msg={msg} />}

                {msg.type === 'text' && (
                  <div style={{
                    padding: '10px 16px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    borderRadius: '18px',
                    borderBottomRightRadius: isMe ? '4px' : '18px',
                    borderBottomLeftRadius:  isMe ? '18px' : '4px',
                    background:  isMe ? '#4a3728' : 'rgba(255,255,255,0.9)',
                    color:       isMe ? '#f6ede8' : '#4a3728',
                    border:      isMe ? 'none' : '1px solid #e0d8cf',
                    boxShadow:   isMe ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                    wordBreak:   'break-word',
                  }}>
                    {msg.text}
                  </div>
                )}

                {/* Timestamp — only last in group */}
                {!sameAsNext && (
                  <p style={{ fontSize: '10px', color: 'rgba(74,55,40,0.35)', padding: '0 4px', textAlign: isMe ? 'right' : 'left' }}>
                    {msg.time}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <div
              className={`${AVATAR_COLORS[selected?.avatar ?? ''] ?? 'bg-gray-400'}`}
              style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: 700, flexShrink: 0 }}
            >
              {selected?.avatar}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e0d8cf', borderRadius: '18px', borderBottomLeftRadius: '4px', padding: '10px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '12px' }}>
                {[0, 150, 300].map(delay => (
                  <div
                    key={delay}
                    className="animate-bounce"
                    style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(74,55,40,0.4)', animationDelay: `${delay}ms`, animationDuration: '900ms' }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
});

export default ChatThread;