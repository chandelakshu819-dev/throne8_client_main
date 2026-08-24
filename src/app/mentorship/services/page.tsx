"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Calendar, ArrowRight, User, GraduationCap, Clock, IndianRupee } from "lucide-react";
import SessionService from "@/lib/api/session.service";
import MentorService from "@/lib/api/mentorship.service";

// Define basic interface for services to avoid any
interface Service {
    sessionId?: string;
    _id?: string;
    id?: string;
    mentorId: string;
    title: string;
    description?: string;
    sessionType?: string;
    category?: string;
    duration: number;
    pricing?: { basePrice: number; };
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

export default function GlobalServicesMarketplace() {
    const router = useRouter();

    const [services, setServices] = useState<Service[]>([]);
    const [mentorMap, setMentorMap] = useState<Map<string, Mentor>>(new Map());
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMentor, setSelectedMentor] = useState("All");
    const [selectedType, setSelectedType] = useState("All");
    const [selectedDuration, setSelectedDuration] = useState("All");
    const [selectedPrice, setSelectedPrice] = useState("All");
    const [selectedDomain, setSelectedDomain] = useState("All");
    const [sortBy, setSortBy] = useState("Recommended");
    const [showFiltersMobile, setShowFiltersMobile] = useState(false);

    useEffect(() => {
        const fetchGlobalMarketplace = async () => {
            try {
                // Fetch all sessions natively
                const sessionRes = await SessionService.getAllSessionsFromDB({ limit: 500 });
                const allSessions = sessionRes?.data ?? [];
                
                // Exclude group sessions
                const validServices = allSessions.filter((s: any) => s.sessionType !== 'group_session');
                setServices(validServices);

                const uniqueMentorIds = Array.from(new Set(validServices.map((s: any) => s.mentorId))).filter(Boolean) as string[];
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
                console.error("Failed to load global services marketplace", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalMarketplace();
    }, []);

    const handleServiceClick = (serviceId: string) => {
        router.push(`/mentorship/service/${serviceId}`);
    };

    // Extract dynamic dropdown options safely
    const mentorOptions = useMemo(() => {
        const names = Array.from(mentorMap.values()).map(m => `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim()).filter(Boolean);
        return ["All", ...Array.from(new Set(names))];
    }, [mentorMap]);

    const sessionTypes = useMemo(() => {
        const types = services.map(s => s.sessionType || s.category).filter(Boolean) as string[];
        const unique = Array.from(new Set(types)).map(t => t.replace(/_/g, ' '));
        return ["All", ...unique];
    }, [services]);

    const domainOptions = useMemo(() => {
        const allDomains = Array.from(mentorMap.values()).flatMap(m => m.domains || []);
        return ["All", ...Array.from(new Set(allDomains)).filter(Boolean)];
    }, [mentorMap]);

    // Apply Client-Side Filtering
    const filteredServices = useMemo(() => {
        return services.filter(service => {
            const m = mentorMap.get(service.mentorId);
            const mName = m ? `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.toLowerCase() : "";
            const mRole = m?.experience?.currentRole?.toLowerCase() || m?.headline?.toLowerCase() || "";
            const sTitle = service.title?.toLowerCase() || "";
            const sDesc = service.description?.toLowerCase() || "";

            // Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matched = sTitle.includes(query) || sDesc.includes(query) || mName.includes(query) || mRole.includes(query);
                if (!matched) return false;
            }

            // Mentor Filter
            if (selectedMentor !== "All" && mName !== selectedMentor.toLowerCase()) return false;

            // Type Filter
            if (selectedType !== "All") {
                const sType = service.sessionType?.replace(/_/g, ' ') || service.category || "";
                if (sType.toLowerCase() !== selectedType.toLowerCase()) return false;
            }

            // Duration Filter
            if (selectedDuration !== "All") {
                if (selectedDuration === "≤ 30 min" && service.duration > 30) return false;
                if (selectedDuration === "30–60 min" && (service.duration <= 30 || service.duration > 60)) return false;
                if (selectedDuration === "60–90 min" && (service.duration <= 60 || service.duration > 90)) return false;
                if (selectedDuration === "90+ min" && service.duration <= 90) return false;
            }

            // Price Filter
            if (selectedPrice !== "All") {
                const price = service.pricing?.basePrice ?? 0;
                if (selectedPrice === "Free" && price > 0) return false;
                if (selectedPrice === "Under ₹500" && (price === 0 || price >= 500)) return false;
                if (selectedPrice === "₹500–₹1000" && (price < 500 || price > 1000)) return false;
                if (selectedPrice === "₹1000+" && price <= 1000) return false;
            }

            // Domain Filter
            if (selectedDomain !== "All") {
                if (!m?.domains?.includes(selectedDomain)) return false;
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === "Price: Low → High") return (a.pricing?.basePrice ?? 0) - (b.pricing?.basePrice ?? 0);
            if (sortBy === "Price: High → Low") return (b.pricing?.basePrice ?? 0) - (a.pricing?.basePrice ?? 0);
            if (sortBy === "Duration: Short → Long") return a.duration - b.duration;
            if (sortBy === "Duration: Long → Short") return b.duration - a.duration;
            return 0; // "Recommended" (default backend order)
        });
    }, [services, mentorMap, searchQuery, selectedMentor, selectedType, selectedDuration, selectedPrice, selectedDomain, sortBy]);

    const resetFilters = () => {
        setSearchQuery("");
        setSelectedMentor("All");
        setSelectedType("All");
        setSelectedDuration("All");
        setSelectedPrice("All");
        setSelectedDomain("All");
        setSortBy("Recommended");
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
                        <GraduationCap className="w-3.5 h-3.5" />
                        Marketplace
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3 leading-tight">
                        Explore 1-to-1 Mentorship
                    </h1>
                    <p className="text-[#c3b6a9] text-sm md:text-base max-w-2xl font-medium">
                        Find the right session, mentor, and expertise for your goals. Browse curated sessions built by industry leaders.
                    </p>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-8">
                
                {/* Filters Sidebar */}
                {/* Mobile Filter Toggle */}
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
                                placeholder="Search mentors, skills..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-[#2d2116] placeholder:text-[#aaa] focus:outline-none focus:border-[#8b7355] transition-colors"
                            />
                            <Search className="w-4 h-4 text-[#8b7355] absolute left-3.5 top-3.5" />
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
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Session Type</label>
                            <select 
                                value={selectedType} 
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#8b7355] capitalize"
                            >
                                {sessionTypes.map(opt => <option key={opt}>{opt}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Domain / Expertise</label>
                            <select 
                                value={selectedDomain} 
                                onChange={(e) => setSelectedDomain(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#8b7355]"
                            >
                                {domainOptions.map(opt => <option key={opt}>{opt}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Duration</label>
                            <select 
                                value={selectedDuration} 
                                onChange={(e) => setSelectedDuration(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#8b7355]"
                            >
                                <option>All</option>
                                <option>≤ 30 min</option>
                                <option>30–60 min</option>
                                <option>60–90 min</option>
                                <option>90+ min</option>
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

                        <div className="mt-2 pt-5 border-t border-[#ece7e2]">
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Sort By</label>
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#8b7355]"
                            >
                                <option>Recommended</option>
                                <option>Price: Low → High</option>
                                <option>Price: High → Low</option>
                                <option>Duration: Short → Long</option>
                                <option>Duration: Long → Short</option>
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
                    ) : filteredServices.length > 0 ? (
                        <>
                            <div className="mb-6 flex items-center justify-between">
                                <span className="text-[#8e847c] font-bold text-sm">{filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} available</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredServices.map((service, index) => {
                                    const hostData = mentorMap.get(service.mentorId);
                                    const hostName = hostData 
                                        ? `${hostData.user?.firstName || ''} ${hostData.user?.lastName || ''}`.trim()
                                        : "Mentor";
                                    const hostRole = hostData?.experience?.currentRole || hostData?.headline || "Mentor";
                                    const hostPic = hostData?.profilePic || hostData?.user?.profilePic || "";

                                    return (
                                        <div 
                                            key={service.sessionId || service._id || service.id || index}
                                            className="group flex flex-col bg-white rounded-[32px] overflow-hidden border border-[#ece7e2] shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 h-full min-h-[420px]"
                                            onClick={() => handleServiceClick(service.sessionId || service._id || service.id as string)}
                                        >
                                            <div className="relative w-full h-[180px] bg-gradient-to-br from-[#f4ece1] to-[#e2d5c8] overflow-hidden flex-shrink-0">
                                                {service.thumbnailImage || service.thumbnail ? (
                                                    <img 
                                                        src={service.thumbnailImage || service.thumbnail} 
                                                        alt={service.title}
                                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 bg-[#f4ece1] flex items-center justify-center p-8">
                                                        <div className="w-full h-full border border-[#e2d5c8] rounded-2xl bg-gradient-to-tr from-[#f4ece1] to-white opacity-50"></div>
                                                    </div>
                                                )}
                                                
                                                <div className="absolute top-4 left-4 bg-[#8b7355]/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm z-10">
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                                        {service.category || service.sessionType?.replace(/_/g, ' ') || 'CAREER PLANNING'}
                                                    </span>
                                                </div>

                                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm z-10">
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{service.duration} MINS</span>
                                                </div>
                                            </div>

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
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-[#2d2116] leading-tight">
                                                            {hostName}
                                                        </span>
                                                        {hostRole && (
                                                            <span className="text-[11px] text-[#8e847c] font-bold mt-0.5 leading-tight line-clamp-1">
                                                                {hostRole}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <h3 className="text-lg font-black text-[#2d2116] leading-tight mb-3 group-hover:text-[#8b7355] transition-colors line-clamp-2">
                                                    {service.title}
                                                </h3>
                                                
                                                <p className="text-sm text-[#8e847c] line-clamp-2 mb-6">
                                                    {service.description || "A personalized 1-to-1 session designed to help you achieve your specific goals."}
                                                </p>

                                                <div className="flex items-center justify-between mb-5 mt-auto">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4 text-[#8b7355]" />
                                                        <span className="text-xs font-bold text-[#2d2116]">{service.duration} mins</span>
                                                    </div>
                                                    <span className="text-sm font-black text-[#2d2116]">
                                                        {service.pricing?.basePrice === 0 ? "Free" : `₹${service.pricing?.basePrice}`}
                                                    </span>
                                                </div>

                                                <div className="mt-auto border-t border-[#ece7e2] pt-5">
                                                    <div className="w-full px-5 py-2.5 bg-transparent border border-[#ece7e2] hover:bg-[#f9f5f0] text-[#8b7355] text-xs font-bold rounded-xl transition-colors duration-300 flex items-center justify-center gap-2">
                                                        Book Session
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
                            <h3 className="text-2xl font-black text-[#2d2116] mb-2">No matching services</h3>
                            <p className="text-[#8e847c] mb-6 max-w-md">We couldn't find any active 1-to-1 services that match your current filters. Try adjusting your search criteria.</p>
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
