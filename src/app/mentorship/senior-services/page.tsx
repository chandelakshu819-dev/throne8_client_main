"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Calendar, ArrowRight, User, GraduationCap, Clock } from "lucide-react";
import SeniorSessionService from "@/lib/api/seniorSession.service";
import MentorService from "@/lib/api/mentorship.service";

export default function SeniorServicesMarketplace() {
    const router = useRouter();

    const [services, setServices] = useState<any[]>([]);
    const [mentorMap, setMentorMap] = useState<Map<string, any>>(new Map());
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMentor, setSelectedMentor] = useState("All Senior Mentors");
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [selectedDuration, setSelectedDuration] = useState("All Durations");
    const [selectedPrice, setSelectedPrice] = useState("All Prices");
    const [sortBy, setSortBy] = useState("Recommended");
    const [showFiltersMobile, setShowFiltersMobile] = useState(false);

    useEffect(() => {
        const fetchGlobalMarketplace = async () => {
            try {
                const sessionRes = await SeniorSessionService.getAllDiscoverySessions();
                const validServices = Array.isArray(sessionRes?.data) ? sessionRes.data : [];
                setServices(validServices);

                const uniqueMentorIds = Array.from(new Set(validServices.map((s: any) => s.mentorId))).filter(Boolean) as string[];
                const map = new Map<string, any>();

                if (uniqueMentorIds.length > 0) {
                    let page = 1;
                    let hasMore = true;

                    while (hasMore && page <= 5) {
                        const mRes = await MentorService.getAllMentors({ page, limit: 50 });
                        const list = Array.isArray(mRes.data) ? mRes.data : (mRes.data?.mentors || []);
                        
                        if (!list || list.length === 0) {
                            hasMore = false;
                        } else {
                            list.forEach((m: any) => {
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
                console.error("Failed to load senior services empty marketplace", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalMarketplace();
    }, []);

    const handleServiceClick = (serviceId: string) => {
        router.push(`/mentorship/senior-service/${serviceId}`);
    };

    // Extract dynamic dropdown options safely
    const mentorOptions = useMemo(() => {
        const names = Array.from(mentorMap.values()).map(m => `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim()).filter(Boolean);
        return ["All Senior Mentors", ...Array.from(new Set(names))];
    }, [mentorMap]);

    const categoryOptions = useMemo(() => {
        const types = services.map(s => s.category || s.sessionType).filter(Boolean) as string[];
        const unique = Array.from(new Set(types)).map(t => t.replace(/_/g, ' '));
        return ["All Categories", ...unique];
    }, [services]);

    const durationOptions = useMemo(() => {
        const durations = services.map(s => s.duration).filter(d => typeof d === 'number') as number[];
        const unique = Array.from(new Set(durations)).sort((a, b) => a - b);
        return ["All Durations", ...unique.map(d => `${d} mins`)];
    }, [services]);

    const hasAnyPricingData = useMemo(() => {
        return services.some(s => s.pricing && typeof s.pricing.basePrice === 'number');
    }, [services]);

    // Apply Client-Side Filtering
    const filteredServices = useMemo(() => {
        return services.filter(service => {
            const m = mentorMap.get(service.mentorId);
            const mName = m ? `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.toLowerCase() : "";
            const mRole = m?.experience?.currentRole?.toLowerCase() || m?.headline?.toLowerCase() || "";
            const sTitle = service.title?.toLowerCase() || "";
            const sDesc = service.description?.toLowerCase() || "";
            const categoryTag = (service.category || service.sessionType || "").replace(/_/g, ' ');

            // Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matched = sTitle.includes(query) || sDesc.includes(query) || mName.includes(query) || mRole.includes(query) || categoryTag.toLowerCase().includes(query);
                if (!matched) return false;
            }

            // Mentor Filter
            if (selectedMentor !== "All Senior Mentors" && mName !== selectedMentor.toLowerCase()) return false;

            // Category Filter
            if (selectedCategory !== "All Categories") {
                if (categoryTag.toLowerCase() !== selectedCategory.toLowerCase()) return false;
            }

            // Duration Filter
            if (selectedDuration !== "All Durations") {
                const durMatch = parseInt(selectedDuration);
                if (service.duration !== durMatch) return false;
            }

            // Price Filter
            if (selectedPrice !== "All Prices" && hasAnyPricingData) {
                const price = service.pricing?.basePrice ?? 0;
                if (selectedPrice === "Free" && price > 0) return false;
                if (selectedPrice === "Under ₹500" && (price === 0 || price >= 500)) return false;
                if (selectedPrice === "₹500 - ₹1000" && (price < 500 || price > 1000)) return false;
                if (selectedPrice === "₹1000+" && price <= 1000) return false;
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === "Price: Low to High") return (a.pricing?.basePrice ?? 0) - (b.pricing?.basePrice ?? 0);
            if (sortBy === "Price: High to Low") return (b.pricing?.basePrice ?? 0) - (a.pricing?.basePrice ?? 0);
            if (sortBy === "Duration: Short to Long") return (a.duration || 0) - (b.duration || 0);
            if (sortBy === "Duration: Long to Short") return (b.duration || 0) - (a.duration || 0);
            if (sortBy === "Newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            return 0; // "Recommended"
        });
    }, [services, mentorMap, searchQuery, selectedMentor, selectedCategory, selectedDuration, selectedPrice, sortBy, hasAnyPricingData]);

    const resetFilters = () => {
        setSearchQuery("");
        setSelectedMentor("All Senior Mentors");
        setSelectedCategory("All Categories");
        setSelectedDuration("All Durations");
        setSelectedPrice("All Prices");
        setSortBy("Recommended");
    };

    return (
        <main className="min-h-screen bg-[#f9f8f6] font-sans pb-20">
            {/* Header Section */}
            <div className="bg-[#1b2b3a] text-[#fdfbf9] py-8 px-6 md:px-12 rounded-b-[32px] mb-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col items-center text-center pt-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fdfbf9]/10 rounded-full text-[#e4ebf1] text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm border border-[#e4ebf1]/20">
                        <GraduationCap className="w-3.5 h-3.5" />
                        SENIOR MENTORSHIP
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3 leading-tight">
                        Senior Mentor Sessions
                    </h1>
                    <p className="text-[#a6b6c4] text-sm md:text-base max-w-2xl font-medium">
                        Learn directly from experienced professionals. Browse focused 1-to-1 sessions with industry leaders.
                    </p>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-8">
                
                {/* Mobile Filter Toggle */}
                <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-[#ece7e2] shadow-sm mb-2">
                    <span className="font-bold text-[#2d2116]">Filters & Search</span>
                    <button 
                        onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                        className="px-4 py-2 bg-[#eef1f6] text-[#3a5266] rounded-xl font-bold text-sm"
                    >
                        {showFiltersMobile ? "Close" : "Open Filters"}
                    </button>
                </div>

                <aside className={`w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6 ${showFiltersMobile ? 'flex' : 'hidden lg:flex'}`}>
                    
                    <div className="bg-white rounded-[32px] border border-[#ece7e2] shadow-sm p-6">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Search senior mentors or sessions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-[#2d2116] placeholder:text-[#aaa] focus:outline-none focus:border-[#3a5266] transition-colors"
                            />
                            <Search className="w-4 h-4 text-[#3a5266] absolute left-3.5 top-3.5" />
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] border border-[#ece7e2] shadow-sm p-6 flex flex-col gap-5">
                        <div className="flex items-center justify-between pb-4 border-b border-[#ece7e2]">
                            <div className="flex items-center gap-2 text-[#2d2116] font-black">
                                <Filter className="w-4 h-4" />
                                Filters
                            </div>
                            <button onClick={resetFilters} className="text-xs font-bold text-[#3a5266] hover:underline">Clear Filters</button>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Mentor</label>
                            <select 
                                value={selectedMentor} 
                                onChange={(e) => setSelectedMentor(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#3a5266]"
                            >
                                {mentorOptions.map(opt => <option key={opt}>{opt}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Category</label>
                            <select 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#3a5266] capitalize"
                            >
                                {categoryOptions.map(opt => <option key={opt}>{opt}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Duration</label>
                            <select 
                                value={selectedDuration} 
                                onChange={(e) => setSelectedDuration(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#3a5266]"
                            >
                                {durationOptions.map(opt => <option key={opt}>{opt}</option>)}
                            </select>
                        </div>

                        {hasAnyPricingData && (
                            <div>
                                <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Price</label>
                                <select 
                                    value={selectedPrice} 
                                    onChange={(e) => setSelectedPrice(e.target.value)}
                                    className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#3a5266]"
                                >
                                    <option>All Prices</option>
                                    <option>Free</option>
                                    <option>Under ₹500</option>
                                    <option>₹500 - ₹1000</option>
                                    <option>₹1000+</option>
                                </select>
                            </div>
                        )}

                        <div className="mt-2 pt-5 border-t border-[#ece7e2]">
                            <label className="block text-xs font-bold text-[#8e847c] uppercase tracking-wider mb-2">Sort By</label>
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-[#fdfbf9] border border-[#ece7e2] rounded-xl px-3 py-2.5 text-sm font-bold text-[#2d2116] focus:outline-none focus:border-[#3a5266]"
                            >
                                <option>Recommended</option>
                                <option>Newest</option>
                                {hasAnyPricingData && (
                                    <>
                                        <option>Price: Low to High</option>
                                        <option>Price: High to Low</option>
                                    </>
                                )}
                                <option>Duration: Short to Long</option>
                                <option>Duration: Long to Short</option>
                            </select>
                        </div>
                    </div>
                </aside>

                <div className="flex-1 w-full">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="flex flex-col bg-white rounded-[32px] border border-[#ece7e2] shadow-sm animate-pulse min-h-[420px]">
                                    <div className="w-full h-[180px] bg-[#eef1f6] rounded-t-[32px]"></div>
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
                                <span className="text-[#8e847c] font-bold text-sm">
                                    {filteredServices.length} {filteredServices.length === 1 ? 'senior mentor service' : 'senior mentor services'} available
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredServices.map((service, index) => {
                                    const hostData = mentorMap.get(service.mentorId);
                                    const hostName = hostData 
                                        ? `${hostData.user?.firstName || ''} ${hostData.user?.lastName || ''}`.trim()
                                        : "Senior Mentor";
                                    const hostRole = hostData?.experience?.currentRole || hostData?.headline || "Senior Professional";
                                    const hostPic = hostData?.profilePic || hostData?.user?.profilePic || "";
                                    const categoryTag = (service.category || service.sessionType || "CAREER PLANNING").replace(/_/g, ' ').toUpperCase();

                                    return (
                                        <div 
                                            key={service.sessionId || service._id || service.id || index}
                                            className="group flex flex-col bg-white rounded-[32px] overflow-hidden border border-[#ece7e2] shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1.5 h-full min-h-[400px]"
                                            onClick={() => handleServiceClick(service.sessionId || service._id || service.id as string)}
                                        >
                                            <div className="relative w-full h-[160px] bg-gradient-to-br from-[#eef1f6] to-[#d5dde2] overflow-hidden flex-shrink-0">
                                                {service.thumbnailImage || service.thumbnail ? (
                                                    <img 
                                                        src={service.thumbnailImage || service.thumbnail} 
                                                        alt={service.title}
                                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 bg-[#f4ece1] flex items-center justify-center p-8">
                                                        <div className="w-full h-full border border-[#d5dde2] rounded-2xl bg-gradient-to-tr from-[#f4ece1] to-white opacity-50"></div>
                                                    </div>
                                                )}
                                                
                                                <div className="absolute top-4 left-4 bg-[#1b2b3a]/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm z-10">
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                                        {categoryTag}
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
                                                        <div className="w-8 h-8 rounded-full bg-[#f4ece1] text-[#3a5266] flex items-center justify-center font-bold border border-[#ece7e2] text-xs">
                                                            {hostName ? hostName.charAt(0).toUpperCase() : "S"}
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

                                                <h3 className="text-lg font-black text-[#1b2b3a] leading-tight mb-3 group-hover:text-[#2d4766] transition-colors line-clamp-2">
                                                    {service.title}
                                                </h3>
                                                
                                                <p className="text-sm text-[#8e847c] line-clamp-2 mb-6">
                                                    {service.description || "A personalized 1-to-1 session designed to help you achieve your specific goals."}
                                                </p>

                                                <div className="flex items-center justify-between mb-5 mt-auto">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4 text-[#3a5266]" />
                                                        <span className="text-xs font-bold text-[#2d2116]">{service.duration} mins</span>
                                                    </div>
                                                    <span className="text-sm font-black text-[#2d2116]">
                                                        {service.pricing?.basePrice === 0 || !service.pricing?.basePrice ? "Free" : `₹${service.pricing?.basePrice}`}
                                                    </span>
                                                </div>

                                                <div className="mt-auto border-t border-[#ece7e2] pt-5">
                                                    <div className="w-full px-5 py-2.5 bg-transparent border border-[#ece7e2] hover:bg-[#eef1f6] text-[#3a5266] text-xs font-bold rounded-xl transition-colors duration-300 flex items-center justify-center gap-2">
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
                                <Search className="w-6 h-6 text-[#3a5266]" />
                            </div>
                            <h3 className="text-2xl font-black text-[#2d2116] mb-2">No senior mentor sessions found</h3>
                            <p className="text-[#8e847c] mb-6 max-w-md">Try changing your filters or search for another topic.</p>
                            <button 
                                onClick={resetFilters}
                                className="px-6 py-3 bg-[#1b2b3a] text-white font-bold text-sm rounded-xl hover:bg-[#111c26] transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
