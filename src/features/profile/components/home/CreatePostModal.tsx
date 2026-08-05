'use client';
import AuthService from '@/lib/api/auth.service';
import ProfileService from '@/lib/api/profile.service';
import React, { useState, useRef } from 'react';
import { useMentionAutocomplete, MentionUser } from '@/shared/hooks/useMentionAutocomplete';
import MentionAutocomplete from '@/shared/uiComponents/MentionAutocomplete';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (postData: PostFormData) => void;
}

interface PostFormData {
    title: string;
    content: string;
    images: File[];
    videos: File[];
    documents: File[];
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<PostFormData>({
        title: '',
        content: '',
        images: [],
        videos: [],
        documents: [],
    });

    const [previewUrls, setPreviewUrls] = useState({
        images: [] as string[],
        videos: [] as string[],
        documents: [] as string[],
    });

    const [errors, setErrors] = useState({
        title: '',
        content: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    // ref to the content textarea, needed so the formatting toolbar and
    // the mention autocomplete can read cursor position / selection.
    const contentRef = useRef<HTMLTextAreaElement>(null);

    // ✅ NEW: @mention autocomplete wiring
    const mention = useMentionAutocomplete({
        value: formData.content,
        onChange: (newContent) => setFormData((prev) => ({ ...prev, content: newContent })),
    });

    const validateForm = () => {
        const newErrors = { title: '', content: '' };
        let isValid = true;

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
            isValid = false;
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Content is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, title: e.target.value });
        if (errors.title) setErrors({ ...errors, title: '' });
    };

    // ✅ CHANGED: content changes now go through the mention hook, which
    // detects "@" typing and drives the autocomplete dropdown, then
    // forwards the new value into formData.content itself.
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const cursorPos = e.target.selectionStart;
        mention.handleTextChange(e.target.value, cursorPos);
        if (errors.content) setErrors((prev) => ({ ...prev, content: '' }));
    };

    // ✅ NEW: keyboard navigation for the mention dropdown (Up/Down/Enter/Esc)
    const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!mention.isOpen || mention.results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            mention.setActiveIndex((i) => (i + 1) % mention.results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            mention.setActiveIndex((i) => (i - 1 + mention.results.length) % mention.results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSelectMention(mention.results[mention.activeIndex]);
        } else if (e.key === 'Escape') {
            mention.closeMention();
        }
    };

    // ✅ NEW: when a user is picked from the dropdown, insert the mention
    // and restore focus + cursor position right after it.
    const handleSelectMention = (user: MentionUser) => {
        const textarea = contentRef.current;
        if (!textarea) return;
        const cursorPos = textarea.selectionStart;
        const newCursorPos = mention.selectMention(user, cursorPos);
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        });
    };

    // Bold / Italic / Bullet toolbar handler. Reads the current textarea
    // selection, wraps or prefixes it with markdown-lite syntax
    // (**bold**, _italic_, "- " bullet), and restores cursor/selection
    // afterward so typing feels natural (like a real editor toolbar).
    const applyFormat = (type: 'bold' | 'italic' | 'bullet') => {
        const textarea = contentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = formData.content;
        const selected = value.slice(start, end);

        let newValue = value;
        let newCursorStart = start;
        let newCursorEnd = end;

        if (type === 'bold') {
            const placeholder = selected || 'bold text';
            const insert = `**${placeholder}**`;
            newValue = value.slice(0, start) + insert + value.slice(end);
            newCursorStart = start + 2;
            newCursorEnd = start + 2 + placeholder.length;
        } else if (type === 'italic') {
            const placeholder = selected || 'italic text';
            const insert = `_${placeholder}_`;
            newValue = value.slice(0, start) + insert + value.slice(end);
            newCursorStart = start + 1;
            newCursorEnd = start + 1 + placeholder.length;
        } else if (type === 'bullet') {
            // Insert "- " at the start of the current line, not at the
            // cursor position — bullets only make sense at line-start.
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            newValue = value.slice(0, lineStart) + '- ' + value.slice(lineStart);
            newCursorStart = start + 2;
            newCursorEnd = end + 2;
        }

        setFormData((prev) => ({ ...prev, content: newValue }));
        if (errors.content) setErrors((prev) => ({ ...prev, content: '' }));

        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorStart, newCursorEnd);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'images' | 'videos' | 'documents') => {
        const files = Array.from(e.target.files || []);
        const newFiles = [...formData[type], ...files];
        setFormData({ ...formData, [type]: newFiles });

        // Generate preview URLs for images
        if (type === 'images') {
            const newPreviewUrls = files.map(file => URL.createObjectURL(file));
            setPreviewUrls({ ...previewUrls, [type]: [...previewUrls[type], ...newPreviewUrls] });
        }

        // Reset input
        e.target.value = '';
    };

    const removeFile = (type: 'images' | 'videos' | 'documents', index: number) => {
        const newFiles = formData[type].filter((_, i) => i !== index);
        setFormData({ ...formData, [type]: newFiles });

        if (type === 'images') {
            URL.revokeObjectURL(previewUrls.images[index]);
            const newPreviewUrls = previewUrls.images.filter((_, i) => i !== index);
            setPreviewUrls({ ...previewUrls, images: newPreviewUrls });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                setIsSaving(true); // ✅ ADD loading state variable

                // ✅ REPLACE: Call actual API
                const response = await ProfileService.createPost({
                    title: formData.title,
                    content: formData.content,
                    images: formData.images,
                    videos: formData.videos,
                    documents: formData.documents
                });

                // console.log('✅ Post created successfully:', response.data.post);

                onSubmit(formData);
                resetForm();

            } catch (error: any) {
                console.error('❌ Failed to create post:', error);
                setErrors({
                    ...errors,
                    content: error.message || 'Failed to create post'
                });
            } finally {
                setIsSaving(false);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            images: [],
            videos: [],
            documents: [],
        });
        setPreviewUrls({
            images: [],
            videos: [],
            documents: [],
        });
        setErrors({ title: '', content: '' });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
                onClick={handleClose}
            ></div>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-[#f6ede8]/95 via-[#f6ede8]/90 to-[#e0d8cf]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#e0d8cf]/60 w-full h-full max-h-screen overflow-y-auto relative">
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-6 right-6 p-2 text-[#4a3728]/60 hover:text-[#4a3728] hover:bg-[#e0d8cf]/30 rounded-xl transition-all duration-200 z-10"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-[#f6ede8] via-[#f6ede8] to-[#e0d8cf]/50 backdrop-blur-sm p-8 border-b border-[#e0d8cf]/30">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-gradient-to-b from-[#4a3728] to-[#7a5c3e] rounded-full"></div>
                            <h2 className="text-3xl font-bold text-[#4a3728] tracking-tight">Create a Post</h2>
                        </div>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Title Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#4a3728]">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter post title..."
                                value={formData.title}
                                onChange={handleTitleChange}
                                className="w-full px-4 py-3 bg-[#e0d8cf]/30 border border-[#e0d8cf]/50 rounded-xl text-[#4a3728] placeholder-[#4a3728]/40 focus:outline-none focus:ring-2 focus:ring-[#4a3728] focus:bg-[#f6ede8] transition-all duration-300"
                            />
                            {errors.title && <p className="text-red-500 text-sm font-medium">{errors.title}</p>}
                        </div>

                        {/* Content Field */}
                        <div className="space-y-2 relative">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-semibold text-[#4a3728]">
                                    Content <span className="text-red-500">*</span>
                                </label>
                                {/* formatting toolbar — Bold / Italic / Bullet */}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => applyFormat('bold')}
                                        title="Bold"
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold text-[#4a3728] bg-[#e0d8cf]/40 hover:bg-[#e0d8cf]/70 transition-colors"
                                    >
                                        B
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFormat('italic')}
                                        title="Italic"
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm italic text-[#4a3728] bg-[#e0d8cf]/40 hover:bg-[#e0d8cf]/70 transition-colors"
                                    >
                                        i
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFormat('bullet')}
                                        title="Bullet point"
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-[#4a3728] bg-[#e0d8cf]/40 hover:bg-[#e0d8cf]/70 transition-colors"
                                    >
                                        •
                                    </button>
                                </div>
                            </div>
                            <textarea
                                ref={contentRef}
                                placeholder="Write your post content here... (type @ to mention someone)"
                                value={formData.content}
                                onChange={handleContentChange}
                                onKeyDown={handleContentKeyDown}
                                onBlur={() => setTimeout(() => mention.closeMention(), 150)}
                                rows={6}
                                className="w-full px-4 py-3 bg-[#e0d8cf]/30 border border-[#e0d8cf]/50 rounded-xl text-[#4a3728] placeholder-[#4a3728]/40 focus:outline-none focus:ring-2 focus:ring-[#4a3728] focus:bg-[#f6ede8] transition-all duration-300 resize-none"
                            />
                            {mention.isOpen && (
                                <MentionAutocomplete
                                    results={mention.results}
                                    isSearching={mention.isSearching}
                                    activeIndex={mention.activeIndex}
                                    onSelect={handleSelectMention}
                                    onHover={mention.setActiveIndex}
                                />
                            )}
                            {errors.content && <p className="text-red-500 text-sm font-medium">{errors.content}</p>}
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#4a3728]">
                                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Attach Images
                            </label>
                            <label htmlFor="image-upload" className="block px-4 py-3 bg-[#e0d8cf]/30 border-2 border-dashed border-[#4a3728]/30 rounded-xl text-center cursor-pointer hover:bg-[#e0d8cf]/50 hover:border-[#4a3728]/50 transition-all duration-300">
                                <input
                                    id="image-upload"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'images')}
                                    className="sr-only"
                                />
                                <p className="text-sm font-medium text-[#4a3728]/70">Click to select images</p>
                            </label>
                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                    {previewUrls.images.map((url, idx) => (
                                        <div key={idx} className="relative group">
                                            <img src={url} alt={`Preview ${idx}`} className="w-full h-32 object-cover rounded-xl" />
                                            <button
                                                type="button"
                                                onClick={() => removeFile('images', idx)}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                            <p className="text-xs text-[#4a3728]/70 mt-1 truncate">{formData.images[idx].name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Video Upload */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#4a3728]">
                                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Attach Videos
                            </label>
                            <label htmlFor="video-upload" className="block px-4 py-3 bg-[#e0d8cf]/30 border-2 border-dashed border-[#4a3728]/30 rounded-xl text-center cursor-pointer hover:bg-[#e0d8cf]/50 hover:border-[#4a3728]/50 transition-all duration-300">
                                <input
                                    id="video-upload"
                                    type="file"
                                    multiple
                                    accept="video/*"
                                    onChange={(e) => handleFileChange(e, 'videos')}
                                    className="sr-only"
                                />
                                <p className="text-sm font-medium text-[#4a3728]/70">Click to select videos</p>
                            </label>
                            {formData.videos.length > 0 && (
                                <div className="space-y-2">
                                    {formData.videos.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-[#e0d8cf]/30 p-3 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <svg className="w-5 h-5 text-[#4a3728]" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-sm font-medium text-[#4a3728] truncate">{file.name}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile('videos', idx)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Document Upload */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#4a3728]">
                                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Attach Documents
                            </label>
                            <label htmlFor="document-upload" className="block px-4 py-3 bg-[#e0d8cf]/30 border-2 border-dashed border-[#4a3728]/30 rounded-xl text-center cursor-pointer hover:bg-[#e0d8cf]/50 hover:border-[#4a3728]/50 transition-all duration-300">
                                <input
                                    id="document-upload"
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                    onChange={(e) => handleFileChange(e, 'documents')}
                                    className="sr-only"
                                />
                                <p className="text-sm font-medium text-[#4a3728]/70">Click to select documents</p>
                            </label>
                            {formData.documents.length > 0 && (
                                <div className="space-y-2">
                                    {formData.documents.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-[#e0d8cf]/30 p-3 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <svg className="w-5 h-5 text-[#4a3728]" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-[#4a3728] truncate">{file.name}</p>
                                                    <p className="text-xs text-[#4a3728]/50">{(file.size / 1024).toFixed(2)} KB</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile('documents', idx)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-6 border-t border-[#e0d8cf]/30">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-6 py-3 bg-[#e0d8cf]/30 hover:bg-[#e0d8cf]/50 text-[#4a3728] font-semibold rounded-xl transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#4a3728] to-[#7a5c3e] hover:from-[#7a5c3e] hover:to-[#4a3728] text-[#f6ede8] font-semibold rounded-xl transition-all duration-300 shadow-lg"
                            >
                                {isSaving ? 'Creating...' : 'Create Post'} {/* ✅ UPDATE */}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CreatePostModal;