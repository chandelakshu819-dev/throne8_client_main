// src/app/mentorship/[userid]/services/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import SessionService from "@/lib/api/session.service";
import MentorService from "@/lib/api/mentorship.service";
import { ArrowLeft, User, Calendar, SlidersHorizontal, X } from "lucide-react";
import { GlobalStyles, Navigation } from "@/features/index";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function MentorServicesPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const mentorId = params.userid as string;

    const [services, setServices] = useState<any[]>([]);
    const [mentorData, setMentorData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [typeFilter, setTypeFilter] = useState<string>("All");
    const [durationFilter, setDurationFilter] = useState<string>("All");
    const [priceFilter, setPriceFilter] = useState<string>("All");
    const [sortBy, setSortBy] = useState<string>("Recommended");

    useEffect(() => {
        if (!mentorId) return;

        // Fetch Mentor Profile for Header
        MentorService.getMyMentorProfile(mentorId)
            .then((res: any) => setMentorData(res?.data || res?.mentor || res))
            .catch(() => {});

        // Fetch 1-to-1 Services
        SessionService.getAllSessionsFromDB({ limit: 100 })
            .then((res: any) => {
                const allSessions = res?.data ?? [];
                const mentorSessions = allSessions.filter(
                    (s: any) => s.mentorId === mentorId && s.sessionType !== "group_session"
                );
                setServices(mentorSessions);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [mentorId]);

    const handleServiceClick = (serviceId: string) => {
        router.push(`/mentorship/service/${serviceId}`);
    };

    // --- Dynamic Options Generation ---
    const sessionTypeOptions = useMemo(() => {
        const types = new Set(services.map((s) => s.category || s.sessionType?.replace(/_/g, " ")));
        const cleanTypes = Array.from(types).filter(Boolean);
        return ["All", ...cleanTypes.map(t => typeof t === 'string' ? t : 'Session')];
    }, [services]);

    // --- Filtering Logic ---
    const filteredAndSortedServices = useMemo(() => {
        let result = [...services];

        // 1. Session Type Filter
        if (typeFilter !== "All") {
            result = result.filter(s => {
                const sType = s.category || s.sessionType?.replace(/_/g, " ");
                return sType?.toLowerCase() === typeFilter.toLowerCase();
            });
        }

        // 2. Duration Filter
        if (durationFilter !== "All") {
            result = result.filter(s => {
                const duration = Number(s.duration) || 0;
                if (durationFilter === "≤ 30 min") return duration <= 30;
                if (durationFilter === "30–60 min") return duration > 30 && duration <= 60;
                if (durationFilter === "60+ min") return duration > 60;
                return true;
            });
        }

        // 3. Price Filter
        if (priceFilter !== "All") {
            result = result.filter(s => {
                const price = Number(s.pricing?.basePrice) || 0;
                if (priceFilter === "Free") return price === 0;
                if (priceFilter === "Under ₹500") return price > 0 && price < 500;
                if (priceFilter === "₹500–₹1000") return price >= 500 && price <= 1000;
                if (priceFilter === "₹1000+") return price > 1000;
                return true;
            });
        }

        // 4. Sorting
        result.sort((a, b) => {
            const priceA = Number(a.pricing?.basePrice) || 0;
            const priceB = Number(b.pricing?.basePrice) || 0;
            const durA = Number(a.duration) || 0;
            const durB = Number(b.duration) || 0;

            if (sortBy === "Price: Low → High") return priceA - priceB;
            if (sortBy === "Price: High → Low") return priceB - priceA;
            if (sortBy === "Duration: Short → Long") return durA - durB;
            if (sortBy === "Duration: Long → Short") return durB - durA;
            return 0; // Recommended (original order)
        });

        return result;
    }, [services, typeFilter, durationFilter, priceFilter, sortBy]);

    const activeFiltersCount = 
        (typeFilter !== "All" ? 1 : 0) + 
        (durationFilter !== "All" ? 1 : 0) + 
        (priceFilter !== "All" ? 1 : 0) + 
        (sortBy !== "Recommended" ? 1 : 0);

    const clearFilters = () => {
        setTypeFilter("All");
        setDurationFilter("All");
        setPriceFilter("All");
        setSortBy("Recommended");
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#4a3728] font-sans selection:bg-[#4a3728] selection:text-white pb-24">
            <GlobalStyles />
            <Navigation currentUserId={user?.userId} activeTimezone="IST (UTC+5:30)" />

            <main className="max-w-[1400px] mx-auto px-4 md:px-6 pt-24">
                
                {/* Back Link */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#8b7355] transition-colors mb-8 font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Mentor Profile
                </button>

                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end mb-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f4ece1] rounded-full text-[#8b7355] text-xs font-bold uppercase tracking-wider mb-4">
                            <User className="w-3.5 h-3.5" />
                            1-to-1 Mentorship
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-[#2d2116] leading-tight mb-2">
                            Find the right session
                        </h1>
                        {mentorData && (
                            <div className="flex items-center gap-3">
                                <span className="text-slate-500">with</span>
                                {mentorData.profilePic || mentorData.user?.profilePic ? (
                                    <img 
                                        src={mentorData.profilePic || mentorData.user?.profilePic} 
                                        alt="Mentor" 
                                        className="w-8 h-8 rounded-full border border-[#e2d5c8] object-cover" 
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

                    {/* Session Type */}
                    <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Session Type</span>
                        <select 
                            value={typeFilter} 
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-[#fdfcfb] border border-[#ece7e2] rounded-lg px-3 py-2 text-sm font-semibold text-[#2d2116] focus:outline-none focus:border-[#8b7355] cursor-pointer"
                        >
                            {sessionTypeOptions.map(opt => (
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
                            className="bg-[#fdfcfb] border border-[#ece7e2] rounded-lg px-3 py-2 text-sm font-semibold text-[#2d2116] focus:outline-none focus:border-[#8b7355] cursor-pointer"
                        >
                            <option value="All">All</option>
                            <option value="≤ 30 min">≤ 30 min</option>
                            <option value="30–60 min">30–60 min</option>
                            <option value="60+ min">60+ min</option>
                        </select>
                    </div>

                    {/* Price */}
                    <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Price</span>
                        <select 
                            value={priceFilter} 
                            onChange={(e) => setPriceFilter(e.target.value)}
                            className="bg-[#fdfcfb] border border-[#ece7e2] rounded-lg px-3 py-2 text-sm font-semibold text-[#2d2116] focus:outline-none focus:border-[#8b7355] cursor-pointer"
                        >
                            <option value="All">All</option>
                            <option value="Free">Free</option>
                            <option value="Under ₹500">Under ₹500</option>
                            <option value="₹500–₹1000">₹500–₹1000</option>
                            <option value="₹1000+">₹1000+</option>
                        </select>
                    </div>

                    <div className="h-6 w-px bg-[#ece7e2] mx-2 shrink-0"></div>

                    {/* Sort */}
                    <div className="shrink-0 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Sort</span>
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-[#fdfcfb] border border-[#ece7e2] rounded-lg px-3 py-2 text-sm font-semibold text-[#2d2116] focus:outline-none focus:border-[#8b7355] cursor-pointer appearance-none pr-8"
                        >
                            <option value="Recommended">Recommended</option>
                            <option value="Price: Low → High">Price: Low → High</option>
                            <option value="Price: High → Low">Price: High → Low</option>
                            <option value="Duration: Short → Long">Duration: Short → Long</option>
                            <option value="Duration: Long → Short">Duration: Long → Short</option>
                        </select>
                    </div>

                    {/* Clear Filters (Only show if active) */}
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
                <div className="mb-6 font-medium text-sm text-slate-500">
                    {loading ? "Loading..." : `${filteredAndSortedServices.length} session${filteredAndSortedServices.length !== 1 ? 's' : ''} available`}
                </div>

                {/* ─── Cards Grid ─── */}
                {!loading && filteredAndSortedServices.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-[#ece7e2] p-16 text-center shadow-sm">
                        <div className="w-16 h-16 bg-[#f4ece1] rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-[#8b7355]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#2d2116] mb-2">No matching sessions</h3>
                        <p className="text-slate-500 mb-6">We couldn't find any 1-to-1 services matching your selected filters.</p>
                        {activeFiltersCount > 0 && (
                            <button 
                                onClick={clearFilters}
                                className="px-6 py-2.5 bg-[#4a3728] text-white font-bold rounded-xl text-sm"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedServices.map((service, index) => {
                            const serviceId = service.sessionId || service._id || service.id;
                            const categoryName = (service.category || service.sessionType?.replace(/_/g, " ") || "").toUpperCase();
                            const mentorName = mentorData ? `${mentorData.user?.firstName || ""} ${mentorData.user?.lastName || ""}`.trim() : "Mentor";
                            const mentorRole = mentorData?.headline || mentorData?.experience?.currentRole || "";
                            
                            return (
                                <div 
                                    key={serviceId || index}
                                    className="group flex flex-col bg-white rounded-[32px] overflow-hidden border border-[#ece7e2] shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 h-full"
                                    onClick={() => handleServiceClick(serviceId)}
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
                                                {categoryName || 'CAREER PLANNING'}
                                            </span>
                                        </div>

                                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm z-10">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{service.duration} MINS</span>
                                        </div>
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
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-[#2d2116] leading-tight">
                                                    {mentorName}
                                                </span>
                                                {mentorRole && (
                                                    <span className="text-[11px] text-[#8e847c] font-bold mt-0.5 leading-tight line-clamp-1">
                                                        {mentorRole}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-black text-[#2d2116] leading-tight mb-3 group-hover:text-[#8b7355] transition-colors line-clamp-2">
                                            {service.title}
                                        </h3>
                                        
                                        <p className="text-sm text-[#8e847c] line-clamp-2 mb-6">
                                            {service.description || "A personalized 1-to-1 session."}
                                        </p>

                                        <div className="flex items-center justify-between mb-5 mt-auto">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4 text-[#8b7355]" />
                                                <span className="text-xs font-bold text-[#2d2116]">{service.duration} mins</span>
                                            </div>
                                            <span className="text-sm font-black text-[#2d2116]">
                                                {service.pricing?.basePrice === 0 ? "Free" : `₹${service.pricing?.basePrice}`}
                                            </span>
                                        </div>

                                        <div className="border-t border-[#ece7e2] pt-5">
                                            <div className="w-full px-5 py-2.5 bg-transparent border border-[#ece7e2] hover:bg-[#f9f5f0] text-[#8b7355] text-xs font-bold rounded-xl transition-colors duration-300 flex items-center justify-center gap-2">
                                                Book Session →
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
