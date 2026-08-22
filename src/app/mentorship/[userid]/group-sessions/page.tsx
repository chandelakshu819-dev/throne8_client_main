// src/app/mentorship/[userid]/group-sessions/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import MentorService from "@/lib/api/mentorship.service";
import { ArrowLeft, Users, Calendar, SlidersHorizontal, X, Clock } from "lucide-react";
import { GlobalStyles, Navigation } from "@/features/index";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function MentorGroupSessionsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const mentorId = params.userid as string;

    const [sessions, setSessions] = useState<any[]>([]);
    const [mentorData, setMentorData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [dateFilter, setDateFilter] = useState<string>("All Dates");
    const [customDate, setCustomDate] = useState<string>("");
    const [timeFilter, setTimeFilter] = useState<string>("Any Time");
    const [topicFilter, setTopicFilter] = useState<string>("All");
    const [durationFilter, setDurationFilter] = useState<string>("All");
    const [priceFilter, setPriceFilter] = useState<string>("All");
    const [availabilityFilter, setAvailabilityFilter] = useState<string>("All");
    const [sortBy, setSortBy] = useState<string>("Soonest");

    useEffect(() => {
        if (!mentorId) return;

        // Fetch Mentor Profile for Header
        MentorService.getMyMentorProfile(mentorId)
            .then((res: any) => setMentorData(res?.data || res?.mentor || res))
            .catch(() => {});

        // Fetch Group Sessions
        MentorService.getAllGroupSessions({ mentorId })
            .then((res: any) => {
                setSessions(res.data?.sessions || res.data || res.sessions || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [mentorId]);

    const handleSessionClick = (sessionId: string) => {
        router.push(`/mentorship/group-session/${sessionId}`);
    };

    // --- Dynamic Options Generation ---
    const topicOptions = useMemo(() => {
        const topics = new Set(sessions.map((s) => s.topic || s.category));
        const cleanTopics = Array.from(topics).filter(Boolean);
        return ["All", ...cleanTopics.map(t => typeof t === 'string' ? t : 'Topic')];
    }, [sessions]);

    // --- Filtering Logic ---
    const filteredAndSortedSessions = useMemo(() => {
        let result = [...sessions];
        const now = new Date();

        // 1. Date Filter
        if (dateFilter !== "All Dates") {
            result = result.filter(s => {
                if (!s.scheduledAt) return false;
                const d = new Date(s.scheduledAt);
                const isToday = d.toDateString() === now.toDateString();
                
                const tomorrow = new Date(now);
                tomorrow.setDate(now.getDate() + 1);
                const isTomorrow = d.toDateString() === tomorrow.toDateString();

                // Start of week (Sunday)
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0,0,0,0);
                
                // End of week (Saturday)
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23,59,59,999);

                const isThisWeek = d >= startOfWeek && d <= endOfWeek;

                const startOfWeekend = new Date(startOfWeek);
                startOfWeekend.setDate(startOfWeek.getDate() + 5); // Friday
                
                const isThisWeekend = d >= startOfWeekend && d <= endOfWeek;

                const startOfNextWeek = new Date(endOfWeek);
                startOfNextWeek.setDate(endOfWeek.getDate() + 1);
                const endOfNextWeek = new Date(startOfNextWeek);
                endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

                const isNextWeek = d >= startOfNextWeek && d <= endOfNextWeek;

                if (dateFilter === "Today") return isToday;
                if (dateFilter === "Tomorrow") return isTomorrow;
                if (dateFilter === "This Week") return isThisWeek;
                if (dateFilter === "This Weekend") return isThisWeekend;
                if (dateFilter === "Next Week") return isNextWeek;
                if (dateFilter === "Custom Date" && customDate) {
                    return d.toISOString().split('T')[0] === customDate;
                }
                return true;
            });
        }

        // 2. Time Filter
        if (timeFilter !== "Any Time") {
            result = result.filter(s => {
                if (!s.scheduledAt) return false;
                const hours = new Date(s.scheduledAt).getHours();
                if (timeFilter === "Morning") return hours >= 6 && hours < 12;
                if (timeFilter === "Afternoon") return hours >= 12 && hours < 17;
                if (timeFilter === "Evening") return hours >= 17 && hours < 21;
                if (timeFilter === "Night") return hours >= 21 || hours < 6;
                return true;
            });
        }

        // 3. Topic Filter
        if (topicFilter !== "All") {
            result = result.filter(s => {
                const sTopic = s.topic || s.category;
                return sTopic === topicFilter;
            });
        }

        // 4. Duration Filter
        if (durationFilter !== "All") {
            result = result.filter(s => {
                const duration = Number(s.duration) || 0;
                if (durationFilter === "≤ 60 min") return duration <= 60;
                if (durationFilter === "60–120 min") return duration > 60 && duration <= 120;
                if (durationFilter === "120+ min") return duration > 120;
                return true;
            });
        }

        // 5. Price Filter
        if (priceFilter !== "All") {
            result = result.filter(s => {
                const price = Number(s.pricing?.pricePerPerson) || 0;
                if (priceFilter === "Free") return price === 0;
                if (priceFilter === "Under ₹500") return price > 0 && price < 500;
                if (priceFilter === "₹500–₹1000") return price >= 500 && price <= 1000;
                if (priceFilter === "₹1000+") return price > 1000;
                return true;
            });
        }

        // 6. Availability Filter
        if (availabilityFilter !== "All") {
            result = result.filter(s => {
                if (typeof s.maxParticipants !== 'number' || typeof s.currentParticipants !== 'number') {
                    // Fail securely if backend does not explicitly provide both
                    return false; 
                }
                const seatsLeft = s.maxParticipants - s.currentParticipants;
                if (availabilityFilter === "Seats Available") return seatsLeft > 0;
                if (availabilityFilter === "Almost Full") return seatsLeft > 0 && seatsLeft <= 2;
                if (availabilityFilter === "Full") return seatsLeft === 0;
                return true;
            });
        }

        // 7. Sorting
        result.sort((a, b) => {
            const priceA = Number(a.pricing?.pricePerPerson) || 0;
            const priceB = Number(b.pricing?.pricePerPerson) || 0;
            const durA = Number(a.duration) || 0;
            const durB = Number(b.duration) || 0;
            const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
            const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;

            if (sortBy === "Soonest") return dateA - dateB;
            if (sortBy === "Latest") return dateB - dateA;
            if (sortBy === "Price: Low → High") return priceA - priceB;
            if (sortBy === "Price: High → Low") return priceB - priceA;
            if (sortBy === "Duration: Short → Long") return durA - durB;
            
            return 0;
        });

        return result;
    }, [sessions, dateFilter, customDate, timeFilter, topicFilter, durationFilter, priceFilter, availabilityFilter, sortBy]);

    const activeFiltersCount = 
        (dateFilter !== "All Dates" ? 1 : 0) +
        (timeFilter !== "Any Time" ? 1 : 0) +
        (topicFilter !== "All" ? 1 : 0) + 
        (durationFilter !== "All" ? 1 : 0) + 
        (priceFilter !== "All" ? 1 : 0) + 
        (availabilityFilter !== "All" ? 1 : 0) + 
        (sortBy !== "Soonest" ? 1 : 0);

    const clearFilters = () => {
        setDateFilter("All Dates");
        setCustomDate("");
        setTimeFilter("Any Time");
        setTopicFilter("All");
        setDurationFilter("All");
        setPriceFilter("All");
        setAvailabilityFilter("All");
        setSortBy("Soonest");
    };

    return (
        <div className="min-h-screen bg-[#f9f8f6] text-[#2d2116] font-sans selection:bg-[#8b7355] selection:text-white pb-24">
            <GlobalStyles />
            <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />

            <main className="max-w-[1400px] mx-auto px-4 md:px-6 pt-24">
                
                {/* Back Link */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-[#8e847c] hover:text-[#2d2116] transition-colors mb-8 font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Mentor Profile
                </button>

                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end mb-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f4ece1] rounded-full text-[#8b7355] text-xs font-bold uppercase tracking-wider mb-4">
                            <Users className="w-3.5 h-3.5" />
                            Live Group Sessions
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-[#2d2116] leading-tight mb-2">
                            Browse Upcoming Sessions
                        </h1>
                        {mentorData && (
                            <div className="flex items-center gap-3 mt-4">
                                <span className="text-[#8e847c]">Hosted by</span>
                                {mentorData.profilePic || mentorData.user?.profilePic ? (
                                    <img 
                                        src={mentorData.profilePic || mentorData.user?.profilePic} 
                                        alt="Mentor" 
                                        className="w-8 h-8 rounded-full border border-[#ece7e2] object-cover" 
                                    />
                                ) : (
                                    <span className="w-8 h-8 rounded-full bg-[#f4ece1] text-[#8b7355] font-bold text-xs flex items-center justify-center">
                                       {(mentorData.user?.firstName || "M").charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <span className="font-bold text-[#2d2116]">
                                    {mentorData.user?.firstName} {mentorData.user?.lastName}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Premium Filter Bar ─── */}
                <div className="bg-white rounded-2xl border border-[#ece7e2] shadow-sm p-4 mb-8 flex items-center gap-4 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2 text-[#8b7355] px-2 font-bold text-sm shrink-0">
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                    </div>
                    
                    <div className="h-6 w-px bg-[#ece7e2] mx-2 shrink-0"></div>

                    {/* Date */}
                    <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Date</span>
                        <select 
                            value={dateFilter} 
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-[#fdfbf9] border border-[#ece7e2] rounded-lg px-3 py-2 text-sm font-semibold text-[#2d2116] focus:outline-none focus:border-[#8b7355] cursor-pointer"
                        >
                            <option value="All Dates">All Dates</option>
                            <option value="Today">Today</option>
                            <option value="Tomorrow">Tomorrow</option>
                            <option value="This Week">This Week</option>
                            <option value="This Weekend">This Weekend</option>
                            <option value="Next Week">Next Week</option>
                            <option value="Custom Date">Custom Date</option>
                        </select>
                        {dateFilter === "Custom Date" && (
                            <input 
                                type="date"
                                className="bg-[#fdfbf9] border border-[#ece7e2] rounded-lg px-3 py-2 text-sm font-semibold text-[#2d2116] focus:outline-none focus:border-[#8b7355] min-w-[140px]"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                            />
                        )}
                    </div>

                    {/* Time */}
                    <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Time</span>
                        <select 
                            value={timeFilter} 
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="bg-[#fdfbf9] border border-[#ece7e2] rounded-lg px-3 py-2 text-sm font-semibold text-[#2d2116] focus:outline-none focus:border-[#8b7355] cursor-pointer"
                        >
                            <option value="Any Time">Any Time</option>
                            <option value="Morning">Morning (6 AM–12 PM)</option>
                            <option value="Afternoon">Afternoon (12 PM–5 PM)</option>
                            <option value="Evening">Evening (5 PM–9 PM)</option>
                            <option value="Night">Night (9 PM+)</option>
                        </select>
                    </div>

                    {/* Topic */}
                    <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Topic</span>
                        <select 
                            value={topicFilter} 
                            onChange={(e) => setTopicFilter(e.target.value)}
                            className="bg-[#fdfbf9] border border-[#ece7e2] rounded-lg px-3 py-2 text-sm font-semibold text-[#2d2116] focus:outline-none focus:border-[#8b7355] cursor-pointer"
                        >
                            {topicOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    {/* Duration */}
                    <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Duration</span>
                        <select 
                            value={durationFilter} 
                            onChange={(e) => setDurationFilter(e.target.value)}
                            className="bg-[#fdfbf9] border border-[#ece7e2] rounded-lg px-3 py-2 text-sm font-semibold text-[#2d2116] focus:outline-none focus:border-[#8b7355] cursor-pointer"
                        >
                            <option value="All">All</option>
                            <option value="≤ 60 min">≤ 60 min</option>
                            <option value="60–120 min">60–120 min</option>
                            <option value="120+ min">120+ min</option>
                        </select>
                    </div>

                    {/* Price */}
                    <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Price</span>
                        <select 
                            value={priceFilter} 
                            onChange={(e) => setPriceFilter(e.target.value)}
                            className="bg-[#fdfbf9] border border-[#ece7e2] rounded-lg px-3 py-2 text-sm font-semibold text-[#2d2116] focus:outline-none focus:border-[#8b7355] cursor-pointer"
                        >
                            <option value="All">All</option>
                            <option value="Free">Free</option>
                            <option value="Under ₹500">Under ₹500</option>
                            <option value="₹500–₹1000">₹500–₹1000</option>
                            <option value="₹1000+">₹1000+</option>
                        </select>
                    </div>

                    {/* Availability */}
                    <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Availability</span>
                        <select 
                            value={availabilityFilter} 
                            onChange={(e) => setAvailabilityFilter(e.target.value)}
                            className="bg-[#fdfbf9] border border-[#ece7e2] rounded-lg px-3 py-2 text-sm font-semibold text-[#2d2116] focus:outline-none focus:border-[#8b7355] cursor-pointer"
                        >
                            <option value="All">All</option>
                            <option value="Seats Available">Seats Available</option>
                            <option value="Almost Full">Almost Full</option>
                            <option value="Full">Full</option>
                        </select>
                    </div>


                    <div className="h-6 w-px bg-[#ece7e2] mx-2 shrink-0"></div>

                    {/* Sort */}
                    <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Sort</span>
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-[#fdfbf9] border border-[#ece7e2] rounded-lg px-3 py-2 text-sm font-semibold text-[#2d2116] focus:outline-none focus:border-[#8b7355] cursor-pointer appearance-none pr-8"
                        >
                            <option value="Soonest">Soonest</option>
                            <option value="Latest">Latest</option>
                            <option value="Price: Low → High">Price: Low → High</option>
                            <option value="Price: High → Low">Price: High → Low</option>
                            <option value="Duration: Short → Long">Duration: Short → Long</option>
                        </select>
                    </div>

                    {/* Clear Filters */}
                    {activeFiltersCount > 0 && (
                        <button 
                            onClick={clearFilters}
                            className="shrink-0 ml-auto flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Results Meta */}
                <div className="mb-6 font-medium text-sm text-[#8e847c]">
                    {loading ? "Loading..." : `${filteredAndSortedSessions.length} session${filteredAndSortedSessions.length !== 1 ? 's' : ''} available`}
                </div>

                {/* ─── Cards Grid ─── */}
                {!loading && filteredAndSortedSessions.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-[#ece7e2] p-16 text-center shadow-sm">
                        <div className="w-16 h-16 bg-[#f4ece1] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-[#8b7355]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#2d2116] mb-2">No matching sessions</h3>
                        <p className="text-[#8e847c] mb-6">We couldn't find any group sessions matching your selected filters.</p>
                        {activeFiltersCount > 0 && (
                            <button 
                                onClick={clearFilters}
                                className="px-6 py-2.5 bg-[#8b7355] text-white font-bold rounded-xl text-sm"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedSessions.map((session, index) => {
                            const sessionId = session.sessionId || session._id || session.id;
                            const mentorName = mentorData ? `${mentorData.user?.firstName || ""} ${mentorData.user?.lastName || ""}`.trim() : "Mentor";
                            
                            return (
                                <div 
                                    key={sessionId || index}
                                    className="group flex flex-col bg-white rounded-[32px] overflow-hidden border border-[#ece7e2] shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 h-full"
                                    onClick={() => handleSessionClick(sessionId)}
                                >
                                    <div className="relative w-full h-[180px] bg-gradient-to-br from-[#f4ece1] to-[#e2d5c8] overflow-hidden flex-shrink-0">
                                        {session.thumbnailImage || session.thumbnail ? (
                                            <img 
                                                src={session.thumbnailImage || session.thumbnail} 
                                                alt={session.title}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-[#f4ece1] flex items-center justify-center p-8">
                                                <div className="w-full h-full border border-[#e2d5c8] rounded-2xl bg-gradient-to-tr from-[#f4ece1] to-white opacity-50"></div>
                                            </div>
                                        )}
                                        
                                        <div className="absolute top-4 left-4 bg-[#8b7355]/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                                {session.topic || session.category || 'Session'}
                                            </span>
                                        </div>
                                        
                                        {session.maxParticipants && (
                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                                    {session.maxParticipants} Seats
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col p-6 flex-grow">
                                        <div className="flex items-center gap-3 mb-4">
                                            {mentorData?.profilePic || mentorData?.user?.profilePic ? (
                                                <img 
                                                    src={mentorData.profilePic || mentorData.user?.profilePic} 
                                                    alt={mentorName} 
                                                    className="w-8 h-8 rounded-full object-cover border border-[#ece7e2]"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-[#f4ece1] text-[#8b7355] flex items-center justify-center font-bold border border-[#ece7e2] text-xs">
                                                    {mentorName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-sm font-bold text-[#2d2116] leading-tight">
                                                {mentorName}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-black text-[#2d2116] leading-tight mb-3 group-hover:text-[#8b7355] transition-colors line-clamp-2">
                                            {session.title}
                                        </h3>
                                        
                                        <p className="text-sm text-[#8e847c] line-clamp-2 mb-6">
                                            {session.description || "Interactive group session led by an expert mentor."}
                                        </p>

                                        <div className="flex items-center gap-4 mb-6 mt-auto">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4 text-[#8b7355]" />
                                                <span className="text-xs font-bold text-[#2d2116]">
                                                    {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-[#8b7355]" />
                                                <span className="text-xs font-bold text-[#2d2116]">
                                                    {session.duration ? `${session.duration} mins` : 'TBA'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-[#ece7e2] pt-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-[#2d2116]">
                                                    {session.pricing?.pricePerPerson === 0 
                                                        ? 'Free' 
                                                        : session.pricing?.pricePerPerson 
                                                            ? `₹${session.pricing.pricePerPerson}` 
                                                            : 'Price N/A'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">/ person</span>
                                            </div>
                                            
                                            <div className="px-5 py-2.5 bg-transparent border border-[#ece7e2] hover:bg-[#f9f5f0] text-[#8b7355] text-xs font-bold rounded-xl transition-colors duration-300 flex items-center gap-2">
                                                Reserve Seat →
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
