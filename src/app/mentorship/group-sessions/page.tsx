"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Calendar, ArrowRight, Clock, Users, Zap, Video } from "lucide-react";
import MentorService from "@/lib/api/mentorship.service";

// Define basic interface for services to avoid any
interface GroupSession {
    sessionId?: string;
    _id?: string;
    id?: string;
    mentorId: string;
    title: string;
    description?: string;
    topic?: string;
    category?: string;
    scheduledAt: string;
    duration: number;
    maxParticipants?: number;
    currentParticipants?: number;
    participants?: any[];
    pricing?: { pricePerPerson: number; };
    thumbnailImage?: string;
    thumbnail?: string;
}

interface Mentor {
    mentorId: string;
    user?: { firstName: string; lastName: string; profilePic?: string; };
    profilePic?: string;
    headline?: string;
    experience?: { currentRole?: string; };
    domains?: string[];
    skills?: string[];
}

export default function GlobalGroupSessionsMarketplace() {
    const router = useRouter();

    const [sessions, setSessions] = useState<GroupSession[]>([]);
    const [mentorMap, setMentorMap] = useState<Map<string, Mentor>>(new Map());
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMentor, setSelectedMentor] = useState("All");
    const [selectedTopic, setSelectedTopic] = useState("All");
    const [selectedDate, setSelectedDate] = useState("All");
    const [selectedTime, setSelectedTime] = useState("All");
    const [selectedDuration, setSelectedDuration] = useState("All");
    const [selectedPrice, setSelectedPrice] = useState("All");
    const [selectedAvailability, setSelectedAvailability] = useState("All");
    const [sortBy, setSortBy] = useState("Soonest");
    const [showFiltersMobile, setShowFiltersMobile] = useState(false);

    useEffect(() => {
        const fetchGlobalMarketplace = async () => {
            try {
                // Fetch all group sessions globally without breaking Joi validator limit (max 100)
                const sessionRes = await MentorService.getAllGroupSessions({ limit: 100 });
                const globalSessions = sessionRes.data?.sessions || sessionRes.data || sessionRes.sessions || [];
                
                // Include all sessions (even past ones for testing/display purposes)
                const validSessions = globalSessions;
                setSessions(validSessions);

                const uniqueMentorIds = Array.from(new Set(validSessions.map((s: any) => s.mentorId))).filter(Boolean) as string[];
                const map = new Map<string, Mentor>();

                if (uniqueMentorIds.length > 0) {
                    let page = 1;
                    let hasMore = true;

                    while (hasMore) {
                        const mRes = await MentorService.getAllMentors({ page, limit: 50 });
                        const list = Array.isArray(mRes.data) ? mRes.data : (mRes.data?.mentors || []);
                        
                        if (!list || list.length === 0) {
                            hasMore = false;
                        } else {
                            list.forEach((m: Mentor) => {
                                if (m.mentorId) map.set(m.mentorId, m);
                            });

                            const allFound = uniqueMentorIds.every(id => map.has(id));
                            if (list.length < 50 || allFound) {
                                hasMore = false;
                            }
                        }
                        page++;
                    }
                }
                setMentorMap(map);
            } catch (error) {
                console.error("Failed to load global group sessions marketplace", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalMarketplace();
    }, []);

    const handleSessionClick = (sessionId: string) => {
        router.push(`/mentorship/group-session/${sessionId}`);
    };

    // Extract dynamic dropdown options safely
    const mentorOptions = useMemo(() => {
        const names = Array.from(mentorMap.values()).map(m => `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim()).filter(Boolean);
        return ["All", ...Array.from(new Set(names))];
    }, [mentorMap]);

    const topics = useMemo(() => {
        const topicList = sessions.map(s => s.topic || s.category).filter(Boolean) as string[];
        const unique = Array.from(new Set(topicList));
        return ["All", ...unique];
    }, [sessions]);

    // Apply Client-Side Filtering
    const filteredSessions = useMemo(() => {
        return sessions.filter(session => {
            const m = mentorMap.get(session.mentorId);
            const mName = m ? `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.toLowerCase() : "";
            const mRole = m?.experience?.currentRole?.toLowerCase() || m?.headline?.toLowerCase() || "";
            const sTitle = session.title?.toLowerCase() || "";
            const sDesc = session.description?.toLowerCase() || "";
            const sessionDate = new Date(session.scheduledAt);

            // Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matched = sTitle.includes(query) || sDesc.includes(query) || mName.includes(query) || mRole.includes(query);
                if (!matched) return false;
            }

            // Mentor Filter
            if (selectedMentor !== "All" && mName !== selectedMentor.toLowerCase()) return false;

            // Topic Filter
            if (selectedTopic !== "All") {
                const sTopic = session.topic || session.category || "";
                if (sTopic !== selectedTopic) return false;
            }

            // Date Filter
            if (selectedDate !== "All") {
                const dist = sessionDate.getTime() - Date.now();
                const days = dist / (1000 * 60 * 60 * 24);
                if (selectedDate === "Today" && days > 1) return false;
                if (selectedDate === "This Week" && days > 7) return false;
                if (selectedDate === "This Month" && days > 30) return false;
            }

            // Time Filter
            if (selectedTime !== "All") {
                const hour = sessionDate.getHours();
                if (selectedTime === "Morning (6AM - 12PM)" && (hour < 6 || hour >= 12)) return false;
                if (selectedTime === "Afternoon (12PM - 5PM)" && (hour < 12 || hour >= 17)) return false;
                if (selectedTime === "Evening (5PM - 9PM)" && (hour < 17 || hour >= 21)) return false;
                if (selectedTime === "Night (9PM+)" && (hour >= 6 && hour < 21)) return false;
            }

            // Duration Filter
            if (selectedDuration !== "All") {
                if (selectedDuration === "≤ 30 min" && session.duration > 30) return false;
                if (selectedDuration === "30–60 min" && (session.duration <= 30 || session.duration > 60)) return false;
                if (selectedDuration === "60–90 min" && (session.duration <= 60 || session.duration > 90)) return false;
                if (selectedDuration === "90+ min" && session.duration <= 90) return false;
            }

            // Price Filter
            if (selectedPrice !== "All") {
                const price = session.pricing?.pricePerPerson ?? 0;
                if (selectedPrice === "Free" && price > 0) return false;
                if (selectedPrice === "Under ₹500" && (price === 0 || price >= 500)) return false;
                if (selectedPrice === "₹500–₹1000" && (price < 500 || price > 1000)) return false;
                if (selectedPrice === "₹1000+" && price <= 1000) return false;
            }

            // Availability Filter
            if (selectedAvailability !== "All") {
                const currentP = session.currentParticipants || session.participants?.length || 0;
                const maxP = session.maxParticipants || 0;
                const isAvailable = maxP === 0 || maxP > currentP;
                if (selectedAvailability === "Available Only" && !isAvailable) return false;
            }

            return true;
        }).sort((a, b) => {
            const dateA = new Date(a.scheduledAt).getTime();
            const dateB = new Date(b.scheduledAt).getTime();

            if (sortBy === "Soonest") return dateA - dateB;
            if (sortBy === "Price: Low → High") return (a.pricing?.pricePerPerson ?? 0) - (b.pricing?.pricePerPerson ?? 0);
            if (sortBy === "Price: High → Low") return (b.pricing?.pricePerPerson ?? 0) - (a.pricing?.pricePerPerson ?? 0);
            return 0;
        });
    }, [sessions, mentorMap, searchQuery, selectedMentor, selectedTopic, selectedDate, selectedTime, selectedDuration, selectedPrice, selectedAvailability, sortBy]);

    const resetFilters = () => {
        setSearchQuery("");
        setSelectedMentor("All");
        setSelectedTopic("All");
        setSelectedDate("All");
        setSelectedTime("All");
        setSelectedDuration("All");
        setSelectedPrice("All");
        setSelectedAvailability("Available Only");
        setSortBy("Soonest");
    };

    return (
        <main className="min-h-screen bg-[#f9f8f6] font-sans pb-20">
            {/* Header Section */}
            <div className="bg-[#2d2116] text-[#fdfbf9] py-8 px-6 md:px-12 rounded-b-[32px] mb-8 overflow-hidden relative">
                {/* Decorative bg */}
                <div className="absolute top-0 right-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col items-center text-center pt-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fdfbf9]/10 rounded-full text-[#e2d5c8] text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm border border-[#e2d5c8]/20">
                        <Users className="w-3.5 h-3.5" />
                        Live Sessions
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3 leading-tight">
                        Live Group Sessions
                    </h1>
                    <p className="text-[#c3b6a9] text-sm md:text-base max-w-2xl font-medium">
                        Join expert-led interactive classes, workshops, and open Q&As with peers covering specialized topics.
                    </p>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-8">
                
                {/* Filters Sidebar */}
                <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-[#ece7e2] shadow-sm mb-2">
                    <span className="font-bold text-[#2d2116]">Filters & Search</span>
                    <button 
                        onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                        className="px-4 py-2 bg-[#f4ece1] text-[#8b7355] rounded-xl font-bold text-sm"
                    >
                        {showFiltersMobile ? "Close" : "Open Filters"}
                    </button>
                </div>

                <aside className={`w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6 ${showFiltersMobile ? 'flex' : 'hidden lg:flex'}`}>
                    
                    {/* Search Bar */}
                    <div className="bg-white rounded-[32px] border border-[#ece7e2] shadow-sm p-6">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Search topic or mentor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-[#2d2116] placeholder:text-[#aaa] focus:outline-none focus:border-[#8b7355] transition-colors"
                            />
                            <Search className="w-4 h-4 text-[#4f46e5] absolute left-3.5 top-3.5" />
                        </div>
                    </div>

                    {/* Filters Block */}
                    <div className="bg-white rounded-[32px] border border-[#ece7e2] shadow-sm p-6 flex flex-col gap-5">
                        <div className="flex items-center justify-between pb-4 border-b border-[#ece7e2]">
                            <div className="flex items-center gap-2 text-[#2d2116] font-black">
                                <Filter className="w-4 h-4" />
                                Filters
                            </div>
                            <button onClick={resetFilters} className="text-xs font-bold text-[#8b7355] hover:underline">Reset</button>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Mentor</label>
                            <select 
                                value={selectedMentor} 
                                onChange={(e) => setSelectedMentor(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#8b7355]"
                            >
                                {mentorOptions.map(opt => <option key={opt}>{opt}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Topic</label>
                            <select 
                                value={selectedTopic} 
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#8b7355] capitalize"
                            >
                                {topics.map(opt => <option key={opt}>{opt}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Date</label>
                            <select 
                                value={selectedDate} 
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#8b7355]"
                            >
                                <option>All</option>
                                <option>Today</option>
                                <option>This Week</option>
                                <option>This Month</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Time of Day</label>
                            <select 
                                value={selectedTime} 
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#8b7355]"
                            >
                                <option>All</option>
                                <option>Morning (6AM - 12PM)</option>
                                <option>Afternoon (12PM - 5PM)</option>
                                <option>Evening (5PM - 9PM)</option>
                                <option>Night (9PM+)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Price</label>
                            <select 
                                value={selectedPrice} 
                                onChange={(e) => setSelectedPrice(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#8b7355]"
                            >
                                <option>All</option>
                                <option>Free</option>
                                <option>Under ₹500</option>
                                <option>₹500–₹1000</option>
                                <option>₹1000+</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Availability</label>
                            <select 
                                value={selectedAvailability} 
                                onChange={(e) => setSelectedAvailability(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#8b7355]"
                            >
                                <option>All</option>
                                <option>Available Only</option>
                            </select>
                        </div>

                        <div className="mt-2 pt-5 border-t border-[#ece7e2]">
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Sort By</label>
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#8b7355]"
                            >
                                <option>Soonest</option>
                                <option>Price: Low → High</option>
                                <option>Price: High → Low</option>
                            </select>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 w-full">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="flex flex-col bg-white rounded-[32px] border border-[#ece7e2] shadow-sm animate-pulse min-h-[420px]">
                                    <div className="w-full h-[180px] bg-[#f4ece1] rounded-t-[32px]"></div>
                                    <div className="p-6 flex-grow">
                                        <div className="w-32 h-8 bg-[#f4ece1] rounded-full mb-4"></div>
                                        <div className="w-full h-6 bg-[#f4ece1] rounded-md mb-2"></div>
                                        <div className="w-2/3 h-6 bg-[#f4ece1] rounded-md mb-6"></div>
                                        <div className="w-full h-12 bg-[#f4ece1] rounded-xl mt-auto"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredSessions.length > 0 ? (
                        <>
                            <div className="mb-6 flex items-center justify-between">
                                <span className="text-[#8e847c] font-bold text-sm">{filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'} available</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredSessions.map((session, index) => {
                                    const hostData = mentorMap.get(session.mentorId);
                                    const hostName = hostData 
                                        ? `${hostData.user?.firstName || ''} ${hostData.user?.lastName || ''}`.trim()
                                        : "Mentor";
                                    const hostPic = hostData?.profilePic || hostData?.user?.profilePic || "";

                                    return (
                                        <div 
                                            key={session.sessionId || session._id || session.id || index}
                                            className="group flex flex-col bg-white rounded-[32px] overflow-hidden border border-[#ece7e2] shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 h-full min-h-[420px]"
                                            onClick={() => handleSessionClick(session.sessionId || session._id || session.id as string)}
                                        >
                                            {/* Top Image Area */}
                                            <div className="relative w-full h-[180px] bg-gradient-to-br from-[#f4ece1] to-[#e2d5c8] overflow-hidden flex-shrink-0">
                                                {session.thumbnailImage || session.thumbnail ? (
                                                    <img 
                                                        src={session.thumbnailImage || session.thumbnail} 
                                                        alt={session.title || "Group Session"}
                                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 bg-[#f4ece1] flex items-center justify-center p-8">
                                                        <div className="w-full h-full border border-[#e2d5c8] rounded-2xl bg-gradient-to-tr from-[#f4ece1] to-white opacity-50"></div>
                                                    </div>
                                                )}
                                                
                                                <div className="absolute top-4 left-4 bg-[#8b7355]/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm z-10">
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                                        {session.topic || session.category || 'Session'}
                                                    </span>
                                                </div>
                                                
                                                {session.maxParticipants && (
                                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm z-10">
                                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                                            {session.maxParticipants} Seats
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content Area */}
                                            <div className="flex flex-col p-6 flex-grow">
                                                <div className="flex items-center gap-3 mb-4">
                                                    {hostPic ? (
                                                        <img 
                                                            src={hostPic} 
                                                            alt={hostName} 
                                                            className="w-8 h-8 rounded-full object-cover border border-[#ece7e2]"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-[#f4ece1] text-[#8b7355] flex items-center justify-center font-bold border border-[#ece7e2] text-xs">
                                                            {hostName ? hostName.charAt(0).toUpperCase() : "M"}
                                                        </div>
                                                    )}
                                                    <span className="text-sm font-bold text-[#2d2116] leading-tight flex-grow">
                                                        {hostName}
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-black text-[#2d2116] leading-tight mb-3 group-hover:text-[#8b7355] transition-colors line-clamp-2">
                                                    {session.title}
                                                </h3>
                                                
                                                <p className="text-sm text-[#8e847c] line-clamp-2 mb-6">
                                                    {session.description || "Interactive group session led by an expert mentor."}
                                                </p>

                                                {/* Details Row */}
                                                <div className="flex flex-wrap items-center gap-4 mb-5 mt-auto">
                                                    <div className="flex items-center gap-1.5 min-w-fit">
                                                        <Calendar className="w-4 h-4 text-[#8b7355]" />
                                                        <span className="text-[11px] font-bold text-[#2d2116]">
                                                            {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'TBA'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 min-w-fit">
                                                        <Clock className="w-4 h-4 text-[#8b7355]" />
                                                        <span className="text-[11px] font-bold text-[#2d2116]">
                                                            {session.scheduledAt ? new Date(session.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBA'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Footer (Price & Button) */}
                                                <div className="mt-auto flex items-center justify-between border-t border-[#ece7e2] pt-5">
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
                                                        Reserve Seat
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="w-full bg-white rounded-[32px] border border-[#ece7e2] shadow-sm p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                            <div className="w-16 h-16 bg-[#f4ece1] rounded-full flex items-center justify-center mb-6">
                                <Search className="w-6 h-6 text-[#8b7355]" />
                            </div>
                            <h3 className="text-2xl font-black text-[#2d2116] mb-2">No matching sessions</h3>
                            <p className="text-[#8e847c] mb-6 max-w-md">We couldn't find any upcoming group sessions that match your current filters. Try adjusting your search criteria.</p>
                            <button 
                                onClick={resetFilters}
                                className="px-6 py-3 bg-[#2d2116] text-[#fdfbf9] font-bold text-sm rounded-xl hover:bg-[#8b7355] transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}
