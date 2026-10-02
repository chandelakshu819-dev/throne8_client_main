import React, { useState } from 'react';
import { X, Calendar, Clock, FileText, Users } from 'lucide-react';

interface CreateGroupSessionProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CreateGroupSession({ onClose, onSuccess }: CreateGroupSessionProps) {
    const [title, setTitle] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [duration, setDuration] = useState(60);
    const [description, setDescription] = useState('');

    // Hardcoded according to specs
    const sessionType = 'group';
    
    // Default timezone from browser
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

    const toLocalDatetimeString = (date: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const handleSubmit = async () => {
        // Here we would integrate with the API
        // const payload = { sessionType, title, scheduledAt: new Date(scheduledAt), duration, description, timezone };
        console.log("Submitting Group session", { sessionType, title, scheduledAt, duration, description });
        if (onSuccess) onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col font-sans border-2 border-[#e0d8cf]">
                
                {/* Header */}
                <div className="flex justify-between items-start p-8 pb-4 shrink-0 border-b-2 border-[#fbf7f3]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fbf7f3] flex items-center justify-center">
                            <Users className="w-6 h-6 text-[#7a5c3e]" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-[#4a3728]">Create Group Session</h3>
                            <p className="text-sm font-medium text-[#8a7a6a] mt-1">Create a collaborative session for multiple students.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-[#fbf7f3] rounded-xl transition-colors border-2 border-transparent hover:border-[#e0d8cf]">
                        <X className="w-6 h-6 text-[#4a3728]" />
                    </button>
                </div>
                
                {/* Scrollable Body */}
                <div className="overflow-y-auto p-8 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-[#4a3728] mb-2">
                            Session Title
                        </label>
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-[#fbf7f3] border-2 border-[#e0d8cf] focus:border-[#4a3728] rounded-xl outline-none text-[#4a3728] font-medium transition-colors" 
                            placeholder="e.g. React Interview Preparation" 
                        />
                    </div>
                    
                    {/* Schedule & Duration */}
                    <div className="grid grid-cols-2 gap-4">
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
                                className="w-full px-4 py-3 bg-[#fbf7f3] border-2 border-[#e0d8cf] focus:border-[#4a3728] rounded-xl outline-none text-[#4a3728] font-medium transition-colors" 
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
                                className="w-full px-4 py-3 bg-[#fbf7f3] border-2 border-[#e0d8cf] focus:border-[#4a3728] rounded-xl outline-none text-[#4a3728] font-medium transition-colors cursor-pointer"
                            >
                                <option value={15}>15 Minutes</option>
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
                            className="w-full px-4 py-3 bg-[#fbf7f3] border-2 border-[#e0d8cf] focus:border-[#4a3728] rounded-xl outline-none text-[#4a3728] min-h-[120px] resize-none font-medium transition-colors" 
                            placeholder="Tell participants what will be covered during this session..." 
                        />
                        <div className="text-right mt-1">
                            <span className="text-xs font-bold text-[#8a7a6a]">{description.length}/2000</span>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-4 p-8 pt-0 shrink-0">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3.5 bg-white border-2 border-[#e0d8cf] hover:bg-[#fbf7f3] text-[#4a3728] rounded-xl font-bold transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="flex-1 py-3.5 bg-[#4a3728] hover:bg-[#7a5c3e] text-white rounded-xl font-bold transition-colors shadow-md"
                    >
                        Create Group Session
                    </button>
                </div>
            </div>
        </div>
    );
}
