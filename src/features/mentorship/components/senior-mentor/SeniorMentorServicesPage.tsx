"use client";

import React, { useState, useEffect } from "react";
import type { SeniorMentorApplication } from "@/lib/api/seniorMentorApplication.service";
import SeniorSessionService from "@/lib/api/seniorSession.service";
import CreateOneToOneSession from "./CreateOneToOneSession";
import { 
  User, Users, Sparkles, ChevronRight, Edit, 
  Code, Code2, Monitor, Brain, Folder, MessageSquare, 
  Video, Calendar, Clock, Briefcase, Package, BookOpen, LayoutGrid, AlertCircle, MoreVertical
} from "lucide-react";
import emptyIllustration from "../../../public/empty-illustration.png";

// --- Types ---

export interface ISeniorSession {
  sessionId: string;
  mentorId: string;
  sessionType: "one_to_one";
  status: string;
  scheduledAt: string;
  duration: number;
  timezone: string;
  title: string;
  description: string;
  category: string;
  thumbnailImage?: string;
  bookings: any[];
  createdAt: string;
  updatedAt: string;
}

// --- Components ---

function formatDateLocal(isoString: string, timezone?: string) {
  try {
    return new Date(isoString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone || undefined
    });
  } catch (e) {
    return new Date(isoString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

function SessionCard({ session, onEdit, onDeleteClick }: { session: ISeniorSession; onEdit: (s: ISeniorSession) => void; onDeleteClick: (s: ISeniorSession) => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const isOneToOne = session.sessionType === 'one_to_one';

  // Fallback for malformed descriptions (backend leaking whole document string)
  let safeDescription = "";
  if (typeof session.description === 'string') {
    if (session.description.includes('ObjectId(') || session.description.includes('"_id":') || session.description.includes('sessionId')) {
      safeDescription = "Learn through personalized one-to-one mentoring.";
    } else {
      safeDescription = session.description;
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-[24px] border border-[#e0d8cf] shadow-sm hover:shadow-md transition-shadow relative group min-h-[220px]">
      
      {/* LEFT: Thumbnail Block (Fixed size 220-240px wide) */}
      <div className={`w-full md:w-[220px] lg:w-[240px] aspect-video md:aspect-auto md:h-auto rounded-[16px] shrink-0 flex flex-col items-center justify-center ${!session.thumbnailImage ? 'bg-[#fffbeb]' : 'bg-gray-100'} relative overflow-hidden border border-[#e0d8cf]/50 ${!session.thumbnailImage ? 'p-4' : ''}`}>
        
        {session.thumbnailImage ? (
          <img src={session.thumbnailImage} alt={session.title} className="w-full h-full object-cover absolute inset-0" />
        ) : (
          <LayoutGrid className="w-8 h-8 text-[#b45309]" />
        )}
        
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-[#4a3728] text-[11px] font-bold rounded-[8px] uppercase tracking-wider shadow-sm flex items-center gap-1.5 z-10">
          <Video className="w-3.5 h-3.5" />
          1-to-1 Mentoring
        </div>
      </div>

      {/* CENTER & BOTTOM: Info & Metadata */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
        <div>
           <div className="flex flex-wrap gap-2 mb-2.5">
             {session.category && (
               <span className="px-3 py-1 bg-[#fbf7f3] text-[#7a5c3e] text-[11px] font-bold rounded-[8px] border border-[#e0d8cf]/80">
                 {session.category}
               </span>
             )}
           </div>
           
           <h4 className="text-[20px] font-[800] text-[#4a3728] leading-tight pr-4 mb-2 truncate">{session.title}</h4>
           
           <p className="text-[14px] text-[#7a5c3e] font-medium leading-relaxed mb-6 line-clamp-2 md:pr-10 overflow-hidden text-ellipsis break-words">
             {safeDescription}
           </p>
        </div>

        {/* BOTTOM METADATA & ACTIONS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-[#e0d8cf]/60 pt-4 mt-auto gap-4 sm:gap-0">
           <div className="flex flex-wrap items-center gap-4 md:gap-5">
             <div className="flex items-center gap-1.5 text-[13px] text-[#7a5c3e] font-bold whitespace-nowrap">
               <Calendar className="w-[14px] h-[14px] text-[#4a3728]" />
               <span>{formatDateLocal(session.scheduledAt, session.timezone)}</span>
             </div>
             <div className="flex items-center gap-1.5 text-[13px] text-[#7a5c3e] font-bold whitespace-nowrap">
               <Clock className="w-[14px] h-[14px] text-[#4a3728]" />
               <span>{session.duration} min</span>
             </div>
             <div className="flex items-center gap-1.5 text-[13px] text-[#7a5c3e] font-bold md:pl-4 md:border-l border-[#e0d8cf] whitespace-nowrap">
               <Users className="w-[14px] h-[14px] text-[#4a3728]" />
               <span>{session.bookings?.length || 0} <span className="font-medium">enrolled</span></span>
             </div>
           </div>
           
           <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
           <div className="relative" ref={dropdownRef}>
             <button 
               onClick={() => setDropdownOpen(!dropdownOpen)}
               className="w-9 h-9 bg-white border border-[#e0d8cf] text-[#4a3728] rounded-[10px] flex items-center justify-center transition-colors hover:bg-[#fbf7f3] shrink-0 shadow-sm focus:outline-none"
             >
               <MoreVertical className="w-5 h-5" />
             </button>

             {dropdownOpen && (
               <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl border border-[#e0d8cf] shadow-lg overflow-hidden z-50">
                 <button 
                   onClick={() => { setDropdownOpen(false); onEdit(session); }}
                   className="w-full text-left px-4 py-3 text-[#4a3728] text-[13px] font-bold hover:bg-[#fbf7f3] flex items-center gap-2 transition-colors"
                 >
                   <Edit className="w-4 h-4" />
                   Edit Service
                 </button>
                 <button 
                   onClick={() => { setDropdownOpen(false); onDeleteClick(session); }}
                   className="w-full text-left px-4 py-3 text-red-600 text-[13px] font-bold hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-[#e0d8cf]/60"
                 >
                   <AlertCircle className="w-4 h-4" />
                   Delete Service
                 </button>
               </div>
             )}
           </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function SeniorMentorServicesPage({ seniorData }: { seniorData: SeniorMentorApplication }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<ISeniorSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<ISeniorSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  
  const [sessions, setSessions] = useState<ISeniorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
        await SeniorSessionService.deleteSession(sessionToDelete.sessionId);
        showToast("Service deleted successfully", "success");
        setSessionToDelete(null);
        fetchSessions();
    } catch (error: any) {
        showToast(error.message || "Failed to delete service.", "error");
    } finally {
        setIsDeleting(false);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await SeniorSessionService.getMySessions();
      // Filter for exactly one_to_one sessions 
      const oneToOne = data.filter((s: any) => s.sessionType === 'one_to_one');
      setSessions(oneToOne);
    } catch (err: any) {
      setError(err.message || "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto w-full font-sans bg-[#fbf7f3] min-h-screen">
      
      {/* 1. HEADER SECTION */}
      <div className="relative px-8 md:px-10 py-5 md:py-6 flex flex-col md:flex-row justify-between items-center bg-[#fbf7f3] rounded-b-[24px] shadow-sm mb-10 overflow-hidden border-b border-[#e0d8cf]/60">
        
        {/* Subtle Decorative Shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-16 -right-10 w-[300px] h-[300px] bg-[#fcebe4] rounded-full blur-[50px] opacity-70"></div>
          <div className="absolute top-[20%] right-[10%] w-[250px] h-[250px] bg-[#EFE3D8] rounded-full blur-[40px] opacity-60"></div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1 className="text-[28px] md:text-[34px] font-[800] text-[#4a3728] leading-tight mb-1 tracking-tight">Senior Mentor Sessions</h1>
          <p className="text-[14px] md:text-[15px] font-medium text-[#7a5c3e] leading-snug">Share your expertise and help students grow.</p>
        </div>

        <div className="relative z-10 w-full md:w-[45%] flex items-center justify-end shrink-0 md:-mr-6 mt-4 md:mt-0">
          <img 
            src={(emptyIllustration as any).src || emptyIllustration} 
            alt="Mentor Illustration" 
            className="w-full max-w-[320px] h-auto object-contain mix-blend-multiply opacity-95" 
            style={{ maxHeight: '130px' }} 
          />
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-8 flex flex-col gap-10 pb-24">
        


        {/* 2. CATEGORIES SECTION */}
        <section>
          <div className="mb-5">
            <h2 className="text-[24px] font-[800] text-[#1e1b4b]">What do you want to offer?</h2>
            <p className="text-[#64748b] text-[15px] font-medium mt-1">Choose a service type to get started. You can customize details, set your pricing and availability next.</p>
          </div>
          
          <div className="flex overflow-x-auto gap-3 md:gap-4 pb-4 snap-x hide-scrollbar mb-4">
             
             {/* Technical Mentoring */}
             <div 
                onClick={() => setSelectedCategory('Technical Mentoring')}
                className="shrink-0 w-36 md:w-40 aspect-[4/4.5] p-4 rounded-2xl bg-[#fee2e2] flex flex-col items-center justify-center transition-all duration-200 cursor-pointer border border-[#fecaca] hover:shadow-md relative group hover:-translate-y-1"
             >
                <Code2 className="w-9 h-9 text-[#b91c1c] mb-3" />
                <h4 className="font-bold text-[#1e1b4b] text-[14px] text-center leading-tight">Technical<br/>Mentoring</h4>
                <div className="absolute bottom-3 text-[10px] font-bold bg-[#ffedd5] text-[#c2410c] px-2 py-0.5 rounded-full">Most Popular</div>
                <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-[#94a3b8] group-hover:text-[#1e1b4b] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
             </div>

             {/* Career Guidance */}
             <div 
                onClick={() => setSelectedCategory('Career Guidance')}
                className="shrink-0 w-36 md:w-40 aspect-[4/4.5] p-4 rounded-2xl bg-[#ffedd5] flex flex-col items-center justify-center transition-all duration-200 cursor-pointer border border-[#fed7aa] hover:shadow-md relative group hover:-translate-y-1"
             >
                <Briefcase className="w-9 h-9 text-[#ea580c] mb-3" />
                <h4 className="font-bold text-[#1e1b4b] text-[14px] text-center leading-tight">Career<br/>Guidance</h4>
                <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-[#94a3b8] group-hover:text-[#1e1b4b] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
             </div>

             {/* Interview Preparation */}
             <div 
                onClick={() => setSelectedCategory('Interview Preparation')}
                className="shrink-0 w-36 md:w-40 aspect-[4/4.5] p-4 rounded-2xl bg-[#f3e8ff] flex flex-col items-center justify-center transition-all duration-200 cursor-pointer border border-[#e9d5ff] hover:shadow-md relative group hover:-translate-y-1"
             >
                <MessageSquare className="w-9 h-9 text-[#7e22ce] mb-3" />
                <h4 className="font-bold text-[#1e1b4b] text-[14px] text-center leading-tight">Interview<br/>Preparation</h4>
                <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-[#94a3b8] group-hover:text-[#1e1b4b] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
             </div>

             {/* Project Guidance */}
             <div 
                onClick={() => setSelectedCategory('Project Guidance')}
                className="shrink-0 w-36 md:w-40 aspect-[4/4.5] p-4 rounded-2xl bg-[#e0f2fe] flex flex-col items-center justify-center transition-all duration-200 cursor-pointer border border-[#bae6fd] hover:shadow-md relative group hover:-translate-y-1"
             >
                <Package className="w-9 h-9 text-[#0369a1] mb-3" />
                <h4 className="font-bold text-[#1e1b4b] text-[14px] text-center leading-tight">Project<br/>Guidance</h4>
                <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-[#94a3b8] group-hover:text-[#1e1b4b] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
             </div>

             {/* AI / ML Guidance */}
             <div 
                onClick={() => setSelectedCategory('AI / ML Guidance')}
                className="shrink-0 w-36 md:w-40 aspect-[4/4.5] p-4 rounded-2xl bg-[#fce7f3] flex flex-col items-center justify-center transition-all duration-200 cursor-pointer border border-[#fbcfe8] hover:shadow-md relative group hover:-translate-y-1"
             >
                <Brain className="w-9 h-9 text-[#be185d] mb-3" />
                <h4 className="font-bold text-[#1e1b4b] text-[14px] text-center leading-tight">AI / ML<br/>Guidance</h4>
                <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-[#94a3b8] group-hover:text-[#1e1b4b] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
             </div>

             {/* Subject Doubt Solving */}
             <div 
                onClick={() => setSelectedCategory('Subject Doubt Solving')}
                className="shrink-0 w-36 md:w-40 aspect-[4/4.5] p-4 rounded-2xl bg-[#ecfdf5] flex flex-col items-center justify-center transition-all duration-200 cursor-pointer border border-[#d1fae5] hover:shadow-md relative group hover:-translate-y-1"
             >
                <BookOpen className="w-9 h-9 text-[#047857] mb-3" />
                <h4 className="font-bold text-[#1e1b4b] text-[14px] text-center leading-tight">Subject<br/>Doubt Solving</h4>
                <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-[#94a3b8] group-hover:text-[#1e1b4b] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
             </div>

             {/* Explore More */}
             <div 
                onClick={() => setSelectedCategory('Custom Mentoring')}
                className="shrink-0 w-36 md:w-40 aspect-[4/4.5] p-4 rounded-2xl bg-[#fffbeb] flex flex-col items-center justify-center transition-all duration-200 cursor-pointer border border-[#fef3c7] hover:shadow-md relative group hover:-translate-y-1"
             >
                <LayoutGrid className="w-9 h-9 text-[#b45309] mb-3" />
                <h4 className="font-bold text-[#1e1b4b] text-[14px] text-center leading-tight">Explore<br/>More</h4>
                <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-[#94a3b8] group-hover:text-[#1e1b4b] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
             </div>
             
          </div>

          {/* Banner */}
          <div className="bg-[#fbf7f3] border border-[#e0d8cf] rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex gap-4 items-start md:items-center">
              <Sparkles className="w-6 h-6 text-[#7a5c3e] shrink-0 mt-1 md:mt-0" />
              <div>
                <h4 className="text-[16px] font-[800] text-[#1e1b4b]">Not sure which to choose?</h4>
                <p className="text-[14px] text-[#64748b] font-medium leading-snug mt-0.5">You can also start from a custom service or create a service that doesn't fit in the above categories.</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedCategory('Custom Mentoring')}
              className="shrink-0 w-full md:w-auto bg-[#4a3728] hover:bg-[#38291e] text-white text-[14px] font-bold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              Create Custom Service
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* 4. YOUR SESSIONS SECTION */}
        <section>
          <div className="mb-6 border-b border-[#e0d8cf] pb-4">
            <h2 className="text-2xl font-black text-[#4a3728]">Your Sessions</h2>
            <p className="text-[#7a5c3e] text-sm font-medium mt-1">Manage your upcoming and previous mentoring sessions.</p>
          </div>

          <div className="space-y-10">
            
            {/* UPCOMING 1-TO-1 SESSIONS */}
            <div>
               <h3 className="text-xs font-bold text-[#8a7a6a] tracking-wider uppercase mb-3 pl-2 border-l-[3px] border-[#7a5c3e]">Upcoming 1-to-1 Sessions</h3>
               
               {loading ? (
                 <div className="py-12 flex flex-col items-center justify-center bg-[#fbf7f3] border border-[#e0d8cf] border-dashed rounded-2xl w-full">
                    <div className="w-8 h-8 rounded-full border-4 border-[#7a5c3e] border-t-transparent animate-spin mb-4" />
                    <p className="text-[#7a5c3e] font-bold">Loading your sessions...</p>
                 </div>
               ) : error ? (
                 <div className="py-8 px-6 flex flex-col items-center justify-center bg-red-50 border border-red-200 border-dashed rounded-2xl w-full">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                    <p className="text-red-700 font-bold mb-1">Error Loading Sessions</p>
                    <p className="text-red-600 text-sm">{error}</p>
                    <button onClick={fetchSessions} className="mt-4 px-4 py-2 bg-red-100 text-red-700 font-bold rounded shadow-sm hover:bg-red-200">Try Again</button>
                 </div>
               ) : sessions.length > 0 ? (
                 <div className="flex flex-col gap-3">
                   {sessions.map(session => (
                     <SessionCard key={session.sessionId} session={session} onEdit={setSessionToEdit} onDeleteClick={setSessionToDelete} />
                   ))}
                 </div>
               ) : (
                 <div className="py-8 px-8 flex flex-col md:flex-row items-center justify-between bg-[#fbf7f3] border border-[#e0d8cf] border-dashed rounded-2xl relative overflow-hidden">
                   <div className="relative z-10 flex flex-col items-start gap-2">
                     <h4 className="text-lg font-black text-[#4a3728]">No 1-to-1 sessions yet</h4>
                     <p className="text-[#7a5c3e] text-sm font-medium">Create your first mentoring session to start helping students.</p>
                   </div>
                   <div className="relative z-10 mt-6 md:mt-0 flex shrink-0">
                     <img src={(emptyIllustration as any).src || emptyIllustration} alt="Guidance" className="w-48 h-auto object-contain mix-blend-multiply opacity-80" />
                   </div>
                 </div>
               )}
            </div>

          </div>
        </section>

      </div>

      {/* Creation Modals */}
      {(selectedCategory || sessionToEdit) && (
        <CreateOneToOneSession 
          category={selectedCategory || ''} 
          editSession={sessionToEdit || undefined}
          onClose={() => {
            setSelectedCategory(null);
            setSessionToEdit(null);
          }} 
          onSuccess={fetchSessions}
        />
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 font-sans border border-[#e0d8cf]">
            <h3 className="text-xl font-bold text-[#4a3728] mb-3">Delete Service?</h3>
            <p className="text-[15px] font-medium text-[#7a5c3e] mb-6">
              Are you sure you want to delete this mentoring service? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end mt-4">
              <button 
                onClick={() => setSessionToDelete(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 text-[#4a3728] font-bold bg-[#fbf7f3] hover:bg-[#e0d8cf] border border-[#e0d8cf] rounded-xl transition-colors shrink-0 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl transition-colors shrink-0 flex items-center justify-center min-w-[120px] disabled:opacity-50"
              >
                {isDeleting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete Service'}
              </button>
            </div>
          </div>
        </div>
      )}

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
      
      {/* Required for css to hide scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
