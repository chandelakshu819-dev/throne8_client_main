import React, { useState } from 'react';
import { X, Calendar, Clock, FileText, User, Image as ImageIcon } from 'lucide-react';
import SeniorSessionService from '@/lib/api/seniorSession.service';


import type { ISeniorSession } from './SeniorMentorServicesPage';

interface CreateOneToOneSessionProps {
    category: string;
    onClose: () => void;
    onSuccess?: () => void;
    editSession?: ISeniorSession;
}

export default function CreateOneToOneSession({ category, onClose, onSuccess, editSession }: CreateOneToOneSessionProps) {
    const isEdit = !!editSession;

    const [title, setTitle] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [duration, setDuration] = useState(60);
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [customCategory, setCustomCategory] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const sessionType = 'one_to_one';
    const isCustom = category === 'Custom Mentoring';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

    const toLocalDatetimeString = (date: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    React.useEffect(() => {
        if (editSession) {
            setTitle(editSession.title);
            setDescription(editSession.description);
            const dt = new Date(editSession.scheduledAt);
            setScheduledAt(toLocalDatetimeString(dt));
            setDuration(editSession.duration);
            setEditCategory(editSession.category);
        }
    }, [editSession]);

    const getTitlePlaceholder = (cat: string) => {
        if (cat.includes('Technical') || cat.includes('DSA')) return 'e.g. DSA Problem Solving & Interview Prep';
        if (cat.includes('Web')) return 'e.g. Full Stack Web Development Guidance';
        if (cat.includes('AI') || cat.includes('ML')) return 'e.g. Machine Learning Project Guidance';
        if (cat.includes('Project')) return 'e.g. Final Year Project Mentoring';
        return `e.g. 1-to-1 ${cat} Mentoring Session`;
    };

    const handleSubmit = async () => {
        const finalCategory = isEdit ? editCategory.trim() : (isCustom ? customCategory.trim() : category);

        if (!title || !description || !scheduledAt || !duration || !finalCategory) {
            showToast("Please fill in all required fields", "error");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("scheduledAt", scheduledAt);
            formData.append("duration", duration.toString());
            formData.append("category", finalCategory);
            
            // Only attach sessionType if creating (edit preserves non-editables natively)
            if (!isEdit) formData.append("sessionType", "one_to_one");
            
            if (image) {
                formData.append("thumbnailImage", image);
            }

            if (isEdit) {
                await SeniorSessionService.updateSession(editSession.sessionId, formData);
                showToast("Senior Mentor service updated successfully", "success");
            } else {
                await SeniorSessionService.createSession(formData);
                showToast("Senior Mentor service created successfully", "success");
            }
            
            setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
            }, 1000);
        } catch (error: any) {
            showToast(error.message || `Failed to ${isEdit ? 'update' : 'create'} senior mentor service. Please try again.`, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col font-sans border-2 border-[#e0d8cf]">
                
                {/* Header */}
                <div className="flex justify-between items-start p-8 pb-4 shrink-0 border-b-2 border-[#fbf7f3]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fbf7f3] flex items-center justify-center">
                            <User className="w-6 h-6 text-[#7a5c3e]" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-[#4a3728]">{isEdit ? 'Edit 1-to-1 Service' : 'Create 1-to-1 Service'}</h3>
                            <p className="text-sm font-medium text-[#8a7a6a] mt-1 mb-2">Create a personalized mentoring experience for students.</p>
                            <div className="flex items-center gap-2">
                                {!isEdit && <span className="px-2 py-1 bg-[#4a3728] text-white text-xs font-bold rounded-full">{category}</span>}
                                <span className="px-2 py-1 bg-[#e0d8cf] text-[#4a3728] text-xs font-bold rounded-full">1-to-1 Mentoring</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-[#fbf7f3] rounded-xl transition-colors border-2 border-transparent hover:border-[#e0d8cf]">
                        <X className="w-6 h-6 text-[#4a3728]" />
                    </button>
                </div>
                
                {/* Scrollable Body */}
                <div className="overflow-y-auto p-8 space-y-6">
                    {/* Image Upload */}
                    <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-[#4a3728] mb-2">
                            <ImageIcon className="w-4 h-4 text-[#7a5c3e]" />
                            Service Thumbnail (Optional)
                        </div>
                        <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-[#e0d8cf] hover:border-[#4a3728] rounded-[16px] bg-[#fbf7f3] cursor-pointer transition-colors group relative overflow-hidden">
                           {image ? (
                             <div className="flex flex-col items-center gap-2">
                               <ImageIcon className="w-6 h-6 text-[#4a3728]" />
                               <span className="text-sm font-bold text-[#4a3728] text-center px-4 max-w-full truncate">{image.name}</span>
                               <span className="text-xs text-[#8a7a6a] font-medium">Click to change</span>
                             </div>
                           ) : (
                             <>
                               <ImageIcon className="w-6 h-6 text-[#8a7a6a] group-hover:text-[#4a3728] mb-2 transition-colors" />
                               <span className="text-sm font-bold text-[#4a3728]">Upload service thumbnail</span>
                               <span className="text-xs font-medium text-[#8a7a6a] mt-0.5">Optional · JPG, PNG</span>
                             </>
                           )}
                           <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                        </label>
                    </div>

                    {/* Category Edit Field (Only for Editing) */}
                    {isEdit && (
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <label className="flex flex-1 items-center gap-2 text-sm font-bold text-[#4a3728]">
                                    Category
                                </label>
                            </div>
                            <input 
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full px-4 py-3 bg-[#fbf7f3] border-2 border-[#4a3728] focus:border-[#7a5c3e] rounded-xl outline-none text-[#4a3728] font-bold transition-colors" 
                            />
                        </div>
                    )}

                    {/* Custom Category Field (Only for Creating Custom Mentoring) */}
                    {!isEdit && isCustom && (
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <label className="flex flex-1 items-center gap-2 text-sm font-bold text-[#4a3728]">
                                    Custom Category
                                </label>
                            </div>
                            <input 
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                className="w-full px-4 py-3 bg-[#fbf7f3] border-2 border-[#4a3728] focus:border-[#7a5c3e] rounded-xl outline-none text-[#4a3728] font-bold transition-colors" 
                                placeholder="e.g. Career Roadmap, Startup Guidance, System Design..." 
                            />
                            <p className="text-xs font-medium text-[#8a7a6a] mt-1.5 ml-1">
                                Define the mentoring area you want to offer.
                            </p>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <label className="flex flex-1 items-center gap-2 text-sm font-bold text-[#4a3728]">
                                Service Name
                            </label>
                            <span className={`text-xs font-bold ${title.length >= 80 ? 'text-red-500' : 'text-[#8a7a6a]'}`}>
                                {title.length}/80
                            </span>
                        </div>
                        <input 
                            value={title}
                            maxLength={80}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-[#f3ece4] border-2 border-[#e0d8cf] focus:border-[#4a3728] rounded-xl outline-none text-[#4a3728] font-bold transition-colors" 
                            placeholder={getTitlePlaceholder(category)} 
                        />
                    </div>
                    
                    {/* Description */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-[#4a3728] mb-2">
                            <FileText className="w-4 h-4 text-[#7a5c3e]" />
                            Description
                        </label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={2000}
                            className="w-full px-4 py-3 bg-[#f3ece4] border-2 border-[#e0d8cf] focus:border-[#4a3728] rounded-xl outline-none text-[#4a3728] min-h-[120px] resize-none font-medium transition-colors" 
                            placeholder="Describe what students can expect from this mentoring session..." 
                        />
                    </div>
                    
                    {/* Schedule & Duration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-[#4a3728] mb-2">
                                <Calendar className="w-4 h-4 text-[#7a5c3e]" />
                                Scheduled At
                            </label>
                            <input 
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                min={toLocalDatetimeString(new Date(Date.now() + 10 * 60 * 1000))}
                                className="w-full px-4 py-3 bg-[#f3ece4] border-2 border-[#e0d8cf] focus:border-[#4a3728] rounded-[10px] outline-none text-[#4a3728] font-bold transition-colors" 
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-[#4a3728] mb-2">
                                <Clock className="w-4 h-4 text-[#7a5c3e]" />
                                Duration
                            </label>
                            <select 
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-[#f3ece4] border-2 border-[#e0d8cf] focus:border-[#4a3728] rounded-[10px] outline-none text-[#4a3728] font-bold transition-colors cursor-pointer"
                            >
                                <option value={30}>30 Minutes</option>
                                <option value={45}>45 Minutes</option>
                                <option value={60}>60 Minutes</option>
                                <option value={90}>90 Minutes</option>
                                <option value={120}>120 Minutes</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="text-left -mt-2">
                        <span className="text-xs text-[#8a7a6a] font-medium">Timezone: {timezone}</span>
                    </div>

                    {/* What students get */}
                    <div className="bg-[#fbf7f3] border border-[#e0d8cf] rounded-[16px] p-5">
                        <h4 className="text-sm font-bold text-[#4a3728] mb-3">What students get</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
                            <div className="flex items-center gap-2 text-[#7a5c3e] text-[13px] font-bold">
                                <span className="text-[#10B981] text-lg leading-none">✓</span> Personalized guidance
                            </div>
                            <div className="flex items-center gap-2 text-[#7a5c3e] text-[13px] font-bold">
                                <span className="text-[#10B981] text-lg leading-none">✓</span> Direct mentor interaction
                            </div>
                            <div className="flex items-center gap-2 text-[#7a5c3e] text-[13px] font-bold">
                                <span className="text-[#10B981] text-lg leading-none">✓</span> Practical problem solving
                            </div>
                            <div className="flex items-center gap-2 text-[#7a5c3e] text-[13px] font-bold">
                                <span className="text-[#10B981] text-lg leading-none">✓</span> Session-focused learning
                            </div>
                        </div>
                    </div>


                </div>

                {/* Footer Buttons */}
                <div className="flex gap-4 p-8 pt-0 shrink-0">
                    <button 
                        onClick={onClose} 
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 bg-white border-2 border-[#e0d8cf] hover:bg-[#fbf7f3] text-[#4a3728] rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-8 py-3.5 bg-[#4a3728] hover:bg-[#3a2a1e] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#4a3728]"
                    >
                        {isSubmitting ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            isEdit ? 'Save Changes' : 'Create Service'
                        )}
                    </button>
                </div>
            </div>

            {/* Custom Toast */}
            {toast && (
                <div
                    style={{
                        position: "fixed", top: 20, right: 20, zIndex: 1000, padding: "12px 16px", borderRadius: 12,
                        fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
                        color: toast.type === "success" ? "#15803d" : "#dc2626",
                        border: `1px solid ${toast.type === "success" ? "#86efac" : "#fca5a5"}`,
                    }}
                    className="animate-in fade-in slide-in-from-top-4"
                >
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
