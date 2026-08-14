'use client';

import { useState, useRef, useCallback, useEffect, memo } from 'react';
import type { ChatMessage } from '../../interface';

interface Props {
  onSend: (msg: Omit<ChatMessage, 'id' | 'time'>) => void;
  contactName: string;
}

// Real emoji data by category — native unicode, no library needed
const EMOJI_DATA: Record<string, string[]> = {
  '😊': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'],
  '👋': ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁️','👅','👄','🫦'],
  '❤️': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☯️','🕉️','🔯','🪯','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛎','🔀','🔁','🔂','▶️','⏩','⏭️','⏯️','◀️','⏪','⏮️'],
  '🎉': ['🎉','🎊','🎈','🎁','🎀','🪅','🎆','🎇','🧨','✨','🌟','💫','⭐','🌠','🌌','🎑','🎃','🎄','🎋','🎍','🎎','🎏','🎐','🧧','🎗️','🎟️','🎫','🏆','🥇','🥈','🥉','🏅','🎖️','🎪','🤹','🎭','🎨','🎬','🎤','🎧','🎼','🎵','🎶','🎷','🎸','🎹','🎺','🎻','🪕','🥁','🪘'],
  '💼': ['💼','📁','📂','🗂️','📊','📈','📉','📝','📋','📌','📍','📎','🖇️','📏','📐','✂️','🗃️','🗄️','🗑️','🔒','🔓','🔏','🔐','🔑','🗝️','🔨','🪓','⛏️','⚒️','🛠️','🗡️','⚔️','🛡️','🪚','🔧','🪛','🔩','⚙️','🗜️','💡','🔋','🪫','🔌','💻','🖥️','🖨️','⌨️','🖱️','💾','💿','📀','🎞️','📷','📸','📹','📞','☎️','📟','📠'],
};

type EmojiCategory = keyof typeof EMOJI_DATA;
const CATEGORIES = Object.keys(EMOJI_DATA) as EmojiCategory[];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ChatInput = memo(function ChatInput({ onSend, contactName }: Props) {
  const [text,         setText]         = useState('');
  const [showEmoji,    setShowEmoji]    = useState(false);
  const [emojiTab,     setEmojiTab]     = useState<EmojiCategory>('😊');
  const [emojiSearch,  setEmojiSearch]  = useState('');
  const [pendingFiles, setPendingFiles] = useState<{ file: File; url: string; type: 'image' | 'document' }[]>([]);
  const [isDragging,   setIsDragging]  = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageRef    = useRef<HTMLInputElement>(null);
  const docRef      = useRef<HTMLInputElement>(null);
  const emojiRef    = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
        setEmojiSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when picker opens
  useEffect(() => {
    if (showEmoji) setTimeout(() => searchRef.current?.focus(), 50);
  }, [showEmoji]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [text]);

  // Filtered emojis for search
  const displayedEmojis = emojiSearch.trim()
    ? CATEGORIES.flatMap(cat => EMOJI_DATA[cat]).filter(e => e.includes(emojiSearch))
    : EMOJI_DATA[emojiTab] ?? [];

  const sendText = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && pendingFiles.length === 0) return;

    pendingFiles.forEach(({ file, url, type }) => {
      onSend({ from: 'me', type, fileUrl: url, fileName: file.name, fileSize: formatFileSize(file.size), text: type === 'image' && trimmed ? trimmed : undefined });
    });

    if (trimmed && pendingFiles.length === 0) {
      onSend({ from: 'me', type: 'text', text: trimmed });
    }

    setText('');
    setPendingFiles([]);
    textareaRef.current?.focus();
  }, [text, pendingFiles, onSend]);

  const sendEmoji = useCallback((emoji: string) => {
    onSend({ from: 'me', type: 'emoji', emoji });
    setShowEmoji(false);
    setEmojiSearch('');
    textareaRef.current?.focus();
  }, [onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
  }, [sendText]);

  const handleFiles = useCallback((files: FileList | null, forceType?: 'image' | 'document') => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const type: 'image' | 'document' = forceType ?? (file.type.startsWith('image/') ? 'image' : 'document');
      setPendingFiles(prev => [...prev, { file, url: URL.createObjectURL(file), type }]);
    });
  }, []);

  const removePending = useCallback((idx: number) => {
    setPendingFiles(prev => { URL.revokeObjectURL(prev[idx].url); return prev.filter((_, i) => i !== idx); });
  }, []);

  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop      = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }, [handleFiles]);

  const canSend = text.trim().length > 0 || pendingFiles.length > 0;

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{ background: '#f6ede8', borderTop: '1px solid #e0d8cf', position: 'relative', transition: 'all 0.2s' }}
      className={isDragging ? 'ring-2 ring-inset ring-[#4a3728]/30' : ''}
    >
      {isDragging && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
          <span style={{ background: '#f6ede8', border: '1px solid #e0d8cf', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#4a3728', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>Drop to attach</span>
        </div>
      )}

      {/* Pending file previews */}
      {pendingFiles.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0', flexWrap: 'wrap' }}>
          {pendingFiles.map((pf, i) => (
            <div key={i} style={{ position: 'relative' }} className="group">
              {pf.type === 'image'
                ? <img src={pf.url} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, border: '1px solid #e0d8cf' }} />
                : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.8)', border: '1px solid #e0d8cf', borderRadius: 10, padding: '6px 10px', maxWidth: 160 }}>
                    <svg width="16" height="16" fill="none" stroke="#4a3728" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#4a3728', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pf.file.name}</p>
                      <p style={{ fontSize: 9, color: 'rgba(74,55,40,0.5)' }}>{formatFileSize(pf.file.size)}</p>
                    </div>
                  </div>
                )}
              <button onClick={() => removePending(i)}
                style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: '#4a3728', color: 'white', borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '8px 12px 4px' }}>

        {/* Image */}
        <button onClick={() => imageRef.current?.click()} title="Send image"
          className="p-2 rounded-lg text-[#4a3728]/50 hover:text-[#4a3728] hover:bg-[#e0d8cf] transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files, 'image')} />

        {/* Document */}
        <button onClick={() => docRef.current?.click()} title="Send document"
          className="p-2 rounded-lg text-[#4a3728]/50 hover:text-[#4a3728] hover:bg-[#e0d8cf] transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" multiple className="hidden" onChange={e => handleFiles(e.target.files, 'document')} />

        <div style={{ width: 1, height: 16, background: '#e0d8cf', margin: '0 4px' }} />

        {/* Emoji picker */}
        <div style={{ position: 'relative' }} ref={emojiRef}>
          <button onClick={() => setShowEmoji(v => !v)} title="Emoji"
            className={`p-2 rounded-lg transition-all ${showEmoji ? 'bg-[#4a3728] text-[#f6ede8]' : 'text-[#4a3728]/50 hover:text-[#4a3728] hover:bg-[#e0d8cf]'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {showEmoji && (
            <div style={{
              position: 'absolute', bottom: '40px', left: 0,
              width: '300px', background: '#f6ede8', border: '1px solid #e0d8cf',
              borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              zIndex: 50, overflow: 'hidden',
            }}>
              {/* Search bar */}
              <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid #e0d8cf' }}>
                <input
                  ref={searchRef}
                  type="text"
                  value={emojiSearch}
                  onChange={e => setEmojiSearch(e.target.value)}
                  placeholder="Search emoji..."
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.8)', border: '1px solid #e0d8cf',
                    borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#4a3728',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Category tabs — only show when not searching */}
              {!emojiSearch && (
                <div style={{ display: 'flex', gap: 2, padding: '6px 8px', borderBottom: '1px solid #e0d8cf', background: 'rgba(224,216,207,0.3)', overflow: 'hidden' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setEmojiTab(cat)}
                      style={{
                        flex: 1, padding: '4px 0', fontSize: '16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: emojiTab === cat ? '#4a3728' : 'transparent',
                        transition: 'all 0.15s',
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Emoji grid */}
              <div className="[&::-webkit-scrollbar]:hidden" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, padding: 8, maxHeight: 240, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>
                {displayedEmojis.length === 0
                  ? <p style={{ gridColumn: '1/-1', textAlign: 'center', fontSize: 11, color: 'rgba(74,55,40,0.4)', padding: '16px 0' }}>No emoji found</p>
                  : displayedEmojis.map((emoji, idx) => (
                    <button key={`${emoji}-${idx}`} onClick={() => sendEmoji(emoji)}
                      style={{
                        padding: '4px', fontSize: '20px', border: 'none', background: 'transparent',
                        borderRadius: 6, cursor: 'pointer', lineHeight: 1,
                        transition: 'transform 0.1s, background 0.1s',
                      }}
                      className="hover:bg-[#e0d8cf] hover:scale-125 active:scale-95">
                      {emoji}
                    </button>
                  ))}
              </div>
              <p style={{ textAlign: 'center', fontSize: 9, color: 'rgba(74,55,40,0.35)', padding: '0 0 8px' }}>Click to send as emoji</p>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <p style={{ fontSize: 10, color: 'rgba(74,55,40,0.3)' }} className="hidden sm:block">Enter to send · Shift+Enter for newline</p>
      </div>

      {/* Text input + send */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '4px 12px 12px' }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${contactName}...`}
          rows={1}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.75)', border: '1px solid #e0d8cf',
            borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#4a3728',
            outline: 'none', resize: 'none', minHeight: 40, maxHeight: 120,
            lineHeight: '1.5', fontFamily: 'inherit', overflow: 'hidden',
          }}
          className="focus:ring-2 focus:ring-[#4a3728]/20"
        />
        <button
          onClick={sendText}
          disabled={!canSend}
          style={{
            width: 40, height: 40, flexShrink: 0, background: canSend ? '#4a3728' : '#4a3728',
            color: '#f6ede8', border: 'none', borderRadius: 12, cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: canSend ? 1 : 0.3, transition: 'all 0.2s', boxShadow: canSend ? '0 2px 4px rgba(0,0,0,0.15)' : 'none',
          }}
          className="active:scale-95 hover:bg-[#6b4e3d]">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
});

export default ChatInput;