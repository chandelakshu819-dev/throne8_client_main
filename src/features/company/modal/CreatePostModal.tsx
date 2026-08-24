'use client';
// src/features/company/modal/CreatePostModal.tsx
import { useState, useRef, useCallback, memo } from 'react';
import Image from 'next/image';
import type { Post } from '@/features/company/store/slices/postsSlice';
import CompanyService from '@/lib/api/company.service';

interface Employee {
  id: string;
  name: string;
  title: string;
}

interface Props {
  onClose: () => void;
  onAdd: (post: Post) => void;
  companyId: string;
  employees: Employee[];
}

type MediaKind = 'image' | 'video' | 'document';

interface MediaPreview {
  file: File;
  url: string;
  kind: MediaKind;
}

const POST_TYPES = ['Blog', 'News', 'Update', 'Achievement'] as const;
const POLL_DURATIONS = [
  { label: '1 Day', value: 1 },
  { label: '3 Days', value: 3 },
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 },
];

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    const hour = h.toString().padStart(2, '0');
    slots.push(`${hour}:00`);
    slots.push(`${hour}:30`);
  }
  return slots;
}
const TIME_SLOTS = generateTimeSlots();

const CreatePostModal = memo(function CreatePostModal({
  onClose, onAdd, companyId, employees,
}: Props) {

  // ── Form State ─────────────────────────────────────
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<typeof POST_TYPES[number]>('Blog');
  const [tags, setTags] = useState('');
  const [authorId, setAuthorId] = useState(employees[0]?.id || '');

  // ── Media State ────────────────────────────────────
  const [previews, setPreviews] = useState<MediaPreview[]>([]);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);

  // ── Poll State ─────────────────────────────────────
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState(7);

  // ── UI State ───────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Schedule State ──────────────────────────────────
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // ── Media Handlers ─────────────────────────────────
  const handleFiles = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    kind: MediaKind
  ) => {
    const files = Array.from(e.target.files || []);
    const next: MediaPreview[] = files.map(file => ({
      file,
      url: kind !== 'document' ? URL.createObjectURL(file) : '',
      kind,
    }));
    setPreviews(prev => [...prev, ...next]);
    e.target.value = '';
  }, []);

  const removePreview = useCallback((i: number) => {
    setPreviews(prev => {
      const copy = [...prev];
      if (copy[i].url) URL.revokeObjectURL(copy[i].url);
      copy.splice(i, 1);
      return copy;
    });
  }, []);

  // ── Poll Handlers ──────────────────────────────────
  const setOption = (i: number, val: string) =>
    setPollOptions(prev => { const c = [...prev]; c[i] = val; return c; });

  const addOption = () => {
    if (pollOptions.length < 4) setPollOptions(p => [...p, '']);
  };

  const removeOption = (i: number) => {
    if (pollOptions.length > 2)
      setPollOptions(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (title.trim().length < 5) { setError('Title must be at least 5 characters'); return; }
    if (!authorId) { setError('Please select an author'); return; }

    const isPoll = showPoll;
    if (isPoll) {
      if (!pollQuestion.trim()) { setError('Poll question is required'); return; }
      const valid = pollOptions.filter(o => o.trim());
      if (valid.length < 2) { setError('At least 2 poll options required'); return; }
    }

    if (isScheduled) {
      if (!scheduleDate) { setError('Please select a date'); return; }
      if (!scheduleTime) { setError('Please select a time slot'); return; }
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
      if (scheduledDateTime <= new Date()) {
        setError('Scheduled time must be in the future');
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      const fd = new FormData();

      fd.append('title', title.trim());
      fd.append('company', companyId);
      fd.append('author', authorId);
      fd.append('type', postType);

      if (content.trim()) fd.append('content', content.trim());

      if (tags.trim()) {
        const arr = tags.split(',').map(t => t.trim()).filter(Boolean);
        fd.append('tags', JSON.stringify(arr));
      }

      if (isScheduled && scheduleDate && scheduleTime) {
        const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
        fd.append('scheduledFor', scheduledDateTime.toISOString());
      }

      previews.forEach(({ file, kind }) => {
        if (kind === 'image') fd.append('images', file);
        if (kind === 'video') fd.append('videos', file);
        if (kind === 'document') fd.append('documents', file);
      });

      if (isPoll && pollQuestion.trim()) {
        const validOpts = pollOptions.filter(o => o.trim());
        fd.append('pollData', JSON.stringify({
          question: pollQuestion.trim(),
          options: validOpts,
          duration: pollDuration,
        }));
      }

      // ✅ DEBUG: FormData contents dekho
      // console.log('=== FormData Contents ===');
      for (const [key, value] of fd.entries()) {
        if (value instanceof File) {
          // console.log(`  ${key}: [File] name=${value.name} size=${value.size} type=${value.type}`);
        } else {
          // console.log(`  ${key}: ${value}`);
        }
      }
      // console.log('=== Previews State ===', previews.map(p => ({
      //   kind: p.kind,
      //   name: p.file.name,
      //   size: p.file.size,
      //   hasUrl: !!p.url,
      // })));

      const result = await CompanyService.createPost(fd);

      // ✅ DEBUG: Full response dekho
      // console.log('=== API Response ===', JSON.stringify(result, null, 2));

      if (!result?.data && !result?.success) {
        throw new Error(result?.message || 'Failed to create post');
      }

      const bp = result.data;

      // ✅ DEBUG: Backend post data dekho
      // console.log('=== Backend Post Data ===', {
      //   _id: bp._id,
      //   title: bp.title,
      //   media: bp.media,
      //   documents: bp.documents,
      //   hasPoll: bp.hasPoll,
      // });

      const newPost: Post = {
        id: bp._id,
        postId: bp.postId,
        title: bp.title || '',
        text: bp.content || '',
        image: bp.media?.find((m: any) => m.type === 'Image')?.url,
        images: bp.media?.filter((m: any) => m.type === 'Image').map((m: any) => m.url) || [],
        videos: bp.media?.filter((m: any) => m.type === 'Video').map((m: any) => m.url) || [],
        documents: bp.documents || [],
        hasPoll: bp.hasPoll || false,
        pollData: bp.pollData ? {
          ...bp.pollData,
          endsAt: bp.pollData.endsAt?.toString() || '',
        } : undefined,
        likes: bp.engagementMetrics?.likesCount || 0,
        comments: bp.engagementMetrics?.commentsCount || 0,
        reposts: bp.engagementMetrics?.sharesCount || 0,
        time: 'Just now',
        liked: false,
        status: (bp.status?.toLowerCase() || 'draft') as Post['status'],
        type: bp.type,
        company: bp.company,
        author: bp.author,
        tags: bp.tags,
        createdAt: bp.createdAt,
      };

      // ✅ DEBUG: Redux mein kya ja raha hai
      // console.log('=== New Post for Redux ===', {
      //   id: newPost.id,
      //   images: newPost.images,
      //   videos: newPost.videos,
      //   documents: newPost.documents,
      // });

      onAdd(newPost);
      onClose();

    } catch (err: any) {
      console.error('=== Submit Error ===', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [
    title, content, postType, authorId, tags,
    previews, showPoll, pollQuestion, pollOptions, pollDuration,
    isScheduled, scheduleDate, scheduleTime,
    companyId, onAdd, onClose,
  ]);

  // ── Render ─────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#faf6f3] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e0d8cf] sticky top-0 bg-[#faf6f3] z-10">
          <h2 className="text-lg font-bold text-[#4a3728]">Create Post</h2>
          <button onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#e0d8cf] text-[#4a3728] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-[#4a3728] mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter post title..."
              maxLength={200}
              className="w-full px-4 py-3 bg-white border border-[#e0d8cf] rounded-xl text-sm
                         text-[#4a3728] placeholder:text-[#4a3728]/40
                         focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20 transition-shadow"
            />
            <p className="text-xs text-[#4a3728]/40 mt-1 text-right">{title.length}/200</p>
          </div>

          {/* Post Type */}
          <div>
            <label className="block text-sm font-semibold text-[#4a3728] mb-1.5">Post Type</label>
            <div className="flex gap-2 flex-wrap">
              {POST_TYPES.map(pt => (
                <button key={pt} onClick={() => setPostType(pt)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${postType === pt
                      ? 'bg-[#4a3728] text-white shadow-sm'
                      : 'bg-[#e0d8cf] text-[#4a3728] hover:bg-[#4a3728]/20'}`}>
                  {pt}
                </button>
              ))}
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-semibold text-[#4a3728] mb-1.5">
              Author <span className="text-red-500">*</span>
            </label>
            <select
              value={authorId}
              onChange={e => setAuthorId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[#e0d8cf] rounded-xl text-sm
                         text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20">
              <option value="">Select author...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.title}
                </option>
              ))}
            </select>
          </div>

          {/* ── Content ── */}
          <div>
            <label className="block text-sm font-semibold text-[#4a3728] mb-1.5">Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What do you want to share?"
              rows={4}
              maxLength={10000}
              className="w-full px-4 py-3 bg-white border border-[#e0d8cf] rounded-xl text-sm
                         text-[#4a3728] placeholder:text-[#4a3728]/40 resize-none
                         focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20"
            />
            <p className="text-xs text-[#4a3728]/40 mt-1 text-right">{content.length}/10000</p>
          </div>

          {/* ── Poll Toggle Button ── */}
          <div>
            <button
              type="button"
              onClick={() => {
                setShowPoll(v => !v);
                if (showPoll) {
                  setPollQuestion('');
                  setPollOptions(['', '']);
                  setPollDuration(7);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                          transition-all border-2
                          ${showPoll
                  ? 'bg-[#4a3728] text-white border-[#4a3728]'
                  : 'bg-white text-[#4a3728] border-[#e0d8cf] hover:border-[#4a3728]'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {showPoll ? 'Remove Poll' : '+ Add Poll'}
            </button>
          </div>

          {/* ── Poll Section ── */}
          {showPoll && (
            <div className="bg-white border border-[#e0d8cf] rounded-xl p-4 space-y-4">

              {/* Question */}
              <div>
                <label className="block text-sm font-semibold text-[#4a3728] mb-1.5">
                  Poll Question <span className="text-red-500">*</span>
                </label>
                <input
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  maxLength={140}
                  className="w-full px-3 py-2.5 border border-[#e0d8cf] rounded-lg text-sm
                             text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20"
                />
                <p className="text-xs text-[#4a3728]/40 mt-1 text-right">{pollQuestion.length}/140</p>
              </div>

              {/* Options — 2x2 grid */}
              <div>
                <label className="block text-sm font-semibold text-[#4a3728] mb-2">
                  Options <span className="text-[#4a3728]/40 font-normal text-xs">(min 2, max 4)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#e0d8cf] flex items-center justify-center
                                       text-xs font-bold text-[#4a3728] flex-shrink-0">
                        {i + 1}
                      </span>
                      <input
                        value={opt}
                        onChange={e => setOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        maxLength={100}
                        className="flex-1 px-2.5 py-2 border border-[#e0d8cf] rounded-lg text-xs
                                   text-[#4a3728] focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          className="p-1 text-[#4a3728]/30 hover:text-red-500 transition-colors flex-shrink-0">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-1 text-xs text-[#4a3728]/50
                               hover:text-[#4a3728] transition-colors mt-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add option
                  </button>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-[#4a3728] mb-1.5">Duration</label>
                <div className="flex gap-2">
                  {POLL_DURATIONS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setPollDuration(d.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${pollDuration === d.value
                          ? 'bg-[#4a3728] text-white'
                          : 'bg-[#e0d8cf] text-[#4a3728] hover:bg-[#4a3728]/20'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-semibold text-[#4a3728] mb-2">
              Attachments
            </label>
            <div className="flex gap-2 flex-wrap">

              {/* Images */}
              <button onClick={() => imageRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#e0d8cf] text-[#4a3728]
                           rounded-lg text-sm font-medium hover:bg-[#4a3728] hover:text-white
                           transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Images
              </button>
              <input ref={imageRef} type="file" accept="image/*" multiple hidden
                onChange={e => handleFiles(e, 'image')} />

              {/* Video */}
              <button onClick={() => videoRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#e0d8cf] text-[#4a3728]
                           rounded-lg text-sm font-medium hover:bg-[#4a3728] hover:text-white
                           transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Video
              </button>
              <input ref={videoRef} type="file" accept="video/*" hidden
                onChange={e => handleFiles(e, 'video')} />

              {/* Document */}
              <button onClick={() => documentRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#e0d8cf] text-[#4a3728]
                           rounded-lg text-sm font-medium hover:bg-[#4a3728] hover:text-white
                           transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Document
              </button>
              <input ref={documentRef} type="file" accept=".pdf,.doc,.docx,.txt" hidden
                onChange={e => handleFiles(e, 'document')} />
            </div>

            {/* Count badges */}
            {previews.length > 0 && (
              <div className="flex gap-2 mt-2">
                {(['image', 'video', 'document'] as MediaKind[]).map(kind => {
                  const count = previews.filter(p => p.kind === kind).length;
                  if (!count) return null;
                  return (
                    <span key={kind}
                      className="text-xs bg-[#4a3728]/10 text-[#4a3728] px-2 py-0.5 rounded-full capitalize">
                      {count} {kind}{count > 1 ? 's' : ''}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Media Previews Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {previews.map((p, i) => (
                <div key={i}
                  className="relative group rounded-xl overflow-hidden border border-[#e0d8cf] bg-white">

                  {/* Image */}
                  {p.kind === 'image' && (
                    <Image src={p.url} alt="" width={200} height={150}
                      className="w-full h-28 object-cover" />
                  )}

                  {/* Video */}
                  {p.kind === 'video' && (
                    <video src={p.url} className="w-full h-28 object-cover" muted playsInline />
                  )}

                  {/* Document */}
                  {p.kind === 'document' && (
                    <div className="w-full h-28 bg-[#f6ede8] flex flex-col items-center justify-center gap-2 px-3">
                      <svg className="w-8 h-8 text-[#4a3728]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-xs text-[#4a3728] font-medium text-center truncate w-full">
                        {p.file.name}
                      </p>
                      <p className="text-xs text-[#4a3728]/50">
                        {(p.file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  )}

                  {/* Remove */}
                  <button onClick={() => removePreview(i)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full
                               opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Kind badge */}
                  <span className="absolute bottom-1.5 left-1.5 text-xs bg-black/50 text-white
                                   px-1.5 py-0.5 rounded-md capitalize">
                    {p.kind}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-[#4a3728] mb-1.5">
              Tags
              <span className="text-[#4a3728]/40 font-normal text-xs ml-1">(comma separated)</span>
            </label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="tech, announcement, update"
              className="w-full px-4 py-3 bg-white border border-[#e0d8cf] rounded-xl text-sm
                         text-[#4a3728] placeholder:text-[#4a3728]/40
                         focus:outline-none focus:ring-2 focus:ring-[#4a3728]/20"
            />
          </div>
          {/* ── Schedule Section ── */}
          <div className="border-t border-[#e0d8cf] pt-4">

            {/* Toggle Row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#4a3728]">Schedule Post</p>
                <p className="text-xs text-[#4a3728]/50 mt-0.5">
                  Auto-move to Draft at scheduled time
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsScheduled(v => !v);
                  if (isScheduled) {
                    setScheduleDate('');
                    setScheduleTime('');
                  }
                }}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
                  ${isScheduled ? 'bg-[#4a3728]' : 'bg-[#e0d8cf]'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow
                       transition-transform duration-200
                       ${isScheduled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Date + Time Pickers */}
            {isScheduled && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-[#4a3728] mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduleDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-[#e0d8cf] rounded-xl
                       text-sm text-[#4a3728] focus:outline-none
                       focus:ring-2 focus:ring-[#4a3728]/20"
                    />
                  </div>

                  {/* Time Slot */}
                  <div>
                    <label className="block text-xs font-semibold text-[#4a3728] mb-1.5">
                      Time <span className="text-[#4a3728]/40 font-normal">(30 min slots)</span>
                    </label>
                    <select
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-[#e0d8cf] rounded-xl
                       text-sm text-[#4a3728] focus:outline-none
                       focus:ring-2 focus:ring-[#4a3728]/20">
                      <option value="">Select time...</option>
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview */}
                {scheduleDate && scheduleTime && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <p className="text-xs text-blue-700 font-medium">
                      📅 Will move to Draft on:{' '}
                      <span className="font-bold">
                        {new Date(`${scheduleDate}T${scheduleTime}:00`).toLocaleString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-[#e0d8cf]
                        sticky bottom-0 bg-[#faf6f3]">
          <button onClick={onClose} disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-[#4a3728] bg-[#e0d8cf]
                       rounded-xl hover:bg-[#d0c8bf] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || !title.trim()}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#4a3728]
             rounded-xl hover:bg-[#6b4e3d] transition-colors
             disabled:opacity-50 disabled:cursor-not-allowed
             flex items-center gap-2 min-w-[120px] justify-center">
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 8 12 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isScheduled ? 'Scheduling...' : 'Creating...'}
              </>
            ) : isScheduled ? '🗓️ Schedule Post' : 'Create Post'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default CreatePostModal;