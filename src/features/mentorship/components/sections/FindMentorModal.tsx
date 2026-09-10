"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MentorItem {
    id: string;
    name: string;
    role: string;
    company: string;
    rating: number;
    sessions: number;
    price: number;
    tags: string[];
    image: string;
    exp?: string;
    expTotal?: number;
}

interface FindMentorModalProps {
    isOpen: boolean;
    onClose: () => void;
    mentors?: MentorItem[];
    loading?: boolean;
}

type FilterType = "all" | "free" | "paid";

// ─── Quick Filters ─────────────────────────────────────────────────────────────
const quickFilters: string[] = [
    "Get Job Referral", "Resume Review", "Mock Interview", "Switch Careers",
    "LinkedIn Optimization", "Startup Guidance", "Tech Interview Prep",
    "Portfolio Review", "Salary Negotiation", "Side Business Ideas",
];

const INITIAL_SHOW = 6;

// ─── Icons ────────────────────────────────────────────────────────────────────
const StarIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#7a5c3e" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

const BadgeIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a7a6a" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="6" />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
    </svg>
);

const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);

const ChevronDown = ({ flip }: { flip?: boolean }) => (
    <svg
        width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: flip ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
    >
        <path d="M6 9l6 6 6-6" />
    </svg>
);

// ─── Avatar Fallback ──────────────────────────────────────────────────────────
function Avatar({ src, name, featured }: { src: string; name: string; featured: boolean }) {
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                }}
            />
        );
    }

    return (
        <div
            className="w-full h-full flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: featured ? "#7a5c3e" : "#d8cec4", color: featured ? "#f6ede8" : "#4a3728" }}
        >
            {initials || "M"}
        </div>
    );
}

// ─── Mentor Card ──────────────────────────────────────────────────────────────
function MentorCard({ mentor, featured }: { mentor: MentorItem; featured: boolean }) {
    const isPaid = mentor.price > 0;

    return (
        <div
            className="relative flex flex-col items-center text-center rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            style={{
                backgroundColor: "#fbf7f3",
                border: featured ? "2px solid #7a5c3e" : "1.5px solid #e0d8cf",
                boxShadow: featured ? "0 6px 28px rgba(74,55,40,0.12)" : "0 2px 10px rgba(74,55,40,0.06)",
            }}
        >
            {/* Paid / Free badge */}
            <div
                className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                    backgroundColor: isPaid ? "#4a372810" : "#2d7a4f14",
                    color: isPaid ? "#7a5c3e" : "#2d7a4f",
                    border: `1px solid ${isPaid ? "#d8cec4" : "#a8d5b8"}`,
                }}
            >
                {isPaid ? "Paid" : "Free"}
            </div>

            {/* Avatar */}
            <div
                className="w-16 h-16 rounded-full overflow-hidden mb-3"
                style={{ border: featured ? "3px solid #7a5c3e" : "2px solid #d8cec4" }}
            >
                <Avatar src={mentor.image} name={mentor.name} featured={featured} />
            </div>

            <h3 className="text-base font-bold mb-0.5" style={{ color: featured ? "#7a5c3e" : "#4a3728" }}>
                {mentor.name || "—"}
            </h3>
            <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#7a5c3e" }}>
                {mentor.role}{mentor.company ? ` @ ${mentor.company}` : ""}
            </p>

            <div className="w-full h-px mb-3" style={{ backgroundColor: "#e0d8cf" }} />

            <div className="flex items-center gap-1.5 mb-0.5">
                <StarIcon />
                <span className="text-sm font-bold" style={{ color: "#4a3728" }}>
                    {mentor.rating > 0 ? mentor.rating.toFixed(1) : "New"}
                </span>
                {mentor.sessions > 0 && (
                    <span className="text-xs" style={{ color: "#8a7a6a" }}>
                        ({mentor.sessions.toLocaleString()} sessions)
                    </span>
                )}
            </div>

            {/* Price */}
            <p className="text-xs mb-3 font-semibold" style={{ color: isPaid ? "#7a5c3e" : "#2d7a4f" }}>
                {isPaid ? `₹${mentor.price} / session` : "Free Session"}
            </p>

            {/* Tags */}
            {mentor.tags && mentor.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                    {mentor.tags.map((tag) => (
                        <span
                            key={tag}
                            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: "#f6ede8", color: "#4a3728", border: "1px solid #e0d8cf" }}
                        >
                            {tag.toUpperCase()}
                        </span>
                    ))}
                </div>
            )}

            {/* Experience */}
            {mentor.exp && (
                <div className="flex items-center gap-1.5 mb-4">
                    <BadgeIcon />
                    <span className="text-xs" style={{ color: "#8a7a6a" }}>{mentor.exp} Experience</span>
                </div>
            )}

            <button
                className="w-full py-2 rounded-xl text-xs font-bold tracking-wide transition-all hover:opacity-90 active:scale-95 mt-auto"
                style={{ backgroundColor: "#4a3728", color: "#f6ede8" }}
            >
                Book Session
            </button>
        </div>
    );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div
            className="flex flex-col items-center rounded-2xl p-5 animate-pulse"
            style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #e0d8cf" }}
        >
            <div className="w-16 h-16 rounded-full mb-3" style={{ backgroundColor: "#e0d8cf" }} />
            <div className="h-4 w-28 rounded mb-2" style={{ backgroundColor: "#e0d8cf" }} />
            <div className="h-3 w-20 rounded mb-4" style={{ backgroundColor: "#ece7e2" }} />
            <div className="w-full h-px mb-3" style={{ backgroundColor: "#e0d8cf" }} />
            <div className="h-3 w-24 rounded mb-2" style={{ backgroundColor: "#e0d8cf" }} />
            <div className="h-3 w-16 rounded mb-4" style={{ backgroundColor: "#ece7e2" }} />
            <div className="flex gap-2 mb-4">
                <div className="h-5 w-14 rounded-full" style={{ backgroundColor: "#e0d8cf" }} />
                <div className="h-5 w-14 rounded-full" style={{ backgroundColor: "#e0d8cf" }} />
            </div>
            <div className="h-8 w-full rounded-xl" style={{ backgroundColor: "#d8cec4" }} />
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function FindMentorModal({
    isOpen,
    onClose,
    mentors = [],
    loading = false,
}: FindMentorModalProps) {
    const [query, setQuery] = useState<string>("");
    const [activeFilter, setActiveFilter] = useState<FilterType>("all");
    const [activeQuick, setActiveQuick] = useState<string | null>(null);
    const [showAll, setShowAll] = useState<boolean>(false);

    if (!isOpen) return null;

    const filtered = mentors.filter((m) => {
        const matchFilter =
            activeFilter === "all" ||
            (activeFilter === "free" && m.price === 0) ||
            (activeFilter === "paid" && m.price > 0);
        const matchQuery =
            query === "" ||
            m.name?.toLowerCase().includes(query.toLowerCase()) ||
            m.role?.toLowerCase().includes(query.toLowerCase()) ||
            m.company?.toLowerCase().includes(query.toLowerCase()) ||
            m.tags?.some((t: string) => t.toLowerCase().includes(query.toLowerCase()));
        return matchFilter && matchQuery;
    });

    const visible = showAll ? filtered : filtered.slice(0, INITIAL_SHOW);
    const hasMore = filtered.length > INITIAL_SHOW;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(74,55,40,0.45)", backdropFilter: "blur(6px)" }}
            onClick={onClose}
        >
                        {/* Modal Box — scroll ab isme nahi hoga */}
                        <div
                className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden"
                style={{ backgroundColor: "#f6ede8", boxShadow: "0 24px 60px rgba(74,55,40,0.22)" }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Close Button — ab yeh static rahega, scroll nahi hoga */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl flex items-center justify-center text-sm border transition-all hover:opacity-70"
                    style={{ backgroundColor: "#fbf7f3", borderColor: "#e0d8cf", color: "#7a5c3e" }}
                >
                    ✕
                </button>

                {/* Naya scrollable wrapper — sirf yeh andar wala content scroll karega */}
                <div className="px-4 py-8 md:px-8 overflow-y-auto max-h-[90vh]">

                    

                    {/* ── Search Box ── */}
                    <div
                        className="rounded-2xl p-7 mb-8"
                        style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #e0d8cf", boxShadow: "0 4px 20px rgba(74,55,40,0.08)" }}
                    >
                        <div className="text-center mb-5">
                            <h1 className="text-2xl md:text-3xl font-bold leading-snug tracking-tight mb-1" style={{ color: "#4a3728" }}>
                                Find the Right Expert.{" "}
                                <span style={{ color: "#7a5c3e" }}>Instantly.</span>
                            </h1>
                            <p className="text-sm" style={{ color: "#8a7a6a" }}>
                                Tell us what you need — our AI finds the right consultant, coach, or creator for you.
                            </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative flex items-center max-w-xl mx-auto mb-5">
                            <input
                                value={query}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                                placeholder='Describe your requirements... (e.g. "Resume review for product role")'
                                className="w-full rounded-xl py-3 pl-4 pr-12 text-sm outline-none"
                                style={{ backgroundColor: "#f6ede8", border: "1.5px solid #d8cec4", color: "#4a3728" }}
                            />
                            <button
                                className="absolute right-2 rounded-lg p-2 transition-all hover:scale-105 active:scale-95"
                                style={{ backgroundColor: "#4a3728", color: "#f6ede8" }}
                            >
                                <ArrowIcon />
                            </button>
                        </div>

                        {/* Quick Filters */}
                        <div className="flex flex-wrap justify-center gap-2">
                            {quickFilters.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setActiveQuick(activeQuick === f ? null : f)}
                                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                                    style={{
                                        borderColor: activeQuick === f ? "#7a5c3e" : "#d8cec4",
                                        backgroundColor: activeQuick === f ? "#7a5c3e18" : "#f6ede8",
                                        color: activeQuick === f ? "#4a3728" : "#8a7a6a",
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Top Mentors ── */}
                    <div>
                        {/* Header + filter row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                            <div>
                                <h2 className="text-xl font-bold" style={{ color: "#4a3728" }}>Top Mentors</h2>
                                <p className="text-xs mt-0.5" style={{ color: "#8a7a6a" }}>
                                    {loading
                                        ? "Loading experts..."
                                        : `${filtered.length} expert${filtered.length !== 1 ? "s" : ""} available`}
                                </p>
                            </div>

                            {/* Free / Paid toggle */}
                            <div
                                className="flex items-center rounded-xl p-1 gap-1 self-start sm:self-auto"
                                style={{ backgroundColor: "#e0d8cf" }}
                            >
                                {(["all", "free", "paid"] as FilterType[]).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => { setActiveFilter(type); setShowAll(false); }}
                                        className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                        style={{
                                            backgroundColor: activeFilter === type ? "#4a3728" : "transparent",
                                            color: activeFilter === type ? "#f6ede8" : "#7a5c3e",
                                        }}
                                    >
                                        {type === "all" ? "All" : type === "free" ? "Free" : "Paid"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cards */}
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : visible.length === 0 ? (
                            <div className="text-center py-20" style={{ color: "#8a7a6a" }}>
                                <p className="font-medium">No mentors found</p>
                                <p className="text-sm mt-1">Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {visible.map((mentor, i) => (
                                    <MentorCard
                                        key={mentor.id ?? i}
                                        mentor={mentor}
                                        featured={i === 0 && activeFilter === "all" && query === ""}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Show More / Less */}
                        {!loading && hasMore && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={() => setShowAll((p) => !p)}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-95"
                                    style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #d8cec4", color: "#4a3728" }}
                                >
                                    {showAll ? "Show Less" : `Show More (${filtered.length - INITIAL_SHOW} more)`}
                                    <ChevronDown flip={showAll} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}









// "use client";

// import { useState } from "react";

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface Mentor {
//     id: number;
//     name: string;
//     role: string;
//     company: string;
//     rating: number;
//     sessions: number;
//     attendance: number;
//     tags: string[];
//     experience: number;
//     isPaid: boolean;
//     avatar: string;
//     color: boolean;
// }

// interface FindMentorModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     mentors?: any[];
//     loading?: boolean;
// }

// type FilterType = "all" | "free" | "paid";

// // ─── Data ─────────────────────────────────────────────────────────────────────
// const mentors: Mentor[] = [
//     { id: 1, name: "Sarah Chen", role: "Product Lead", company: "Google", rating: 4.9, sessions: 1240, attendance: 95, tags: ["STRATEGY", "PM"], experience: 8, isPaid: true, avatar: "https://i.pravatar.cc/150?img=47", color: true },
//     { id: 2, name: "David Miller", role: "Staff Engineer", company: "Netflix", rating: 5.0, sessions: 850, attendance: 95, tags: ["BACKEND", "SYSTEMS"], experience: 12, isPaid: true, avatar: "https://i.pravatar.cc/150?img=12", color: false },
//     { id: 3, name: "Arjun Mehta", role: "SDE-3", company: "Amazon", rating: 4.8, sessions: 2100, attendance: 95, tags: ["DSA", "JAVA"], experience: 5, isPaid: false, avatar: "https://i.pravatar.cc/150?img=33", color: false },
//     { id: 4, name: "Priya Sharma", role: "Design Lead", company: "Figma", rating: 4.7, sessions: 980, attendance: 92, tags: ["UI/UX", "DESIGN"], experience: 7, isPaid: false, avatar: "https://i.pravatar.cc/150?img=44", color: true },
//     { id: 5, name: "James Park", role: "ML Engineer", company: "OpenAI", rating: 4.9, sessions: 560, attendance: 97, tags: ["AI/ML", "PYTHON"], experience: 6, isPaid: true, avatar: "https://i.pravatar.cc/150?img=18", color: false },
//     { id: 6, name: "Anika Roy", role: "Startup Founder", company: "YC W23", rating: 5.0, sessions: 430, attendance: 98, tags: ["STARTUP", "GTM"], experience: 9, isPaid: false, avatar: "https://i.pravatar.cc/150?img=56", color: true },
//     { id: 7, name: "Rahul Gupta", role: "Senior PM", company: "Microsoft", rating: 4.6, sessions: 710, attendance: 91, tags: ["PRODUCT", "AGILE"], experience: 10, isPaid: true, avatar: "https://i.pravatar.cc/150?img=22", color: false },
//     { id: 8, name: "Meera Nair", role: "Data Scientist", company: "Meta", rating: 4.8, sessions: 330, attendance: 96, tags: ["DATA", "SQL"], experience: 4, isPaid: false, avatar: "https://i.pravatar.cc/150?img=60", color: true },
//     { id: 9, name: "Chris Wang", role: "iOS Engineer", company: "Apple", rating: 4.9, sessions: 890, attendance: 94, tags: ["SWIFT", "iOS"], experience: 8, isPaid: true, avatar: "https://i.pravatar.cc/150?img=15", color: false },
// ];

// const quickFilters: string[] = [
//     "Get Job Referral", "Resume Review", "Mock Interview", "Switch Careers",
//     "LinkedIn Optimization", "Startup Guidance", "Tech Interview Prep",
//     "Portfolio Review", "Salary Negotiation", "Side Business Ideas",
// ];

// const INITIAL_SHOW = 6;

// // ─── Icons ────────────────────────────────────────────────────────────────────
// const StarIcon = () => (
//     <svg width="15" height="15" viewBox="0 0 24 24" fill="#7a5c3e" xmlns="http://www.w3.org/2000/svg">
//         <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
//     </svg>
// );

// const BadgeIcon = () => (
//     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a7a6a" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
//         <circle cx="12" cy="8" r="6" />
//         <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
//     </svg>
// );

// const ArrowIcon = () => (
//     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M5 12h14M12 5l7 7-7 7" />
//     </svg>
// );

// const ChevronDown = ({ flip }: { flip?: boolean }) => (
//     <svg
//         width="15" height="15" viewBox="0 0 24 24" fill="none"
//         stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
//         style={{ transform: flip ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
//     >
//         <path d="M6 9l6 6 6-6" />
//     </svg>
// );

// // ─── Mentor Card ──────────────────────────────────────────────────────────────
// function MentorCard({ mentor, featured }: { mentor: Mentor; featured: boolean }) {
//     return (
//         <div
//             className="relative flex flex-col items-center text-center rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
//             style={{
//                 backgroundColor: "#fbf7f3",
//                 border: featured ? "2px solid #7a5c3e" : "1.5px solid #e0d8cf",
//                 boxShadow: featured ? "0 6px 28px rgba(74,55,40,0.12)" : "0 2px 10px rgba(74,55,40,0.06)",
//             }}
//         >
//             {/* Paid / Free badge */}
//             <div
//                 className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full"
//                 style={{
//                     backgroundColor: mentor.isPaid ? "#4a372810" : "#2d7a4f14",
//                     color: mentor.isPaid ? "#7a5c3e" : "#2d7a4f",
//                     border: `1px solid ${mentor.isPaid ? "#d8cec4" : "#a8d5b8"}`,
//                 }}
//             >
//                 {mentor.isPaid ? "💎 Paid" : "🎁 Free"}
//             </div>

//             {/* Avatar */}
//             <div
//                 className="w-16 h-16 rounded-full overflow-hidden mb-3"
//                 style={{ border: featured ? "3px solid #7a5c3e" : "2px solid #d8cec4" }}
//             >
//                 <img
//                     src={mentor.avatar}
//                     alt={mentor.name}
//                     className="w-full h-full object-cover"
//                     style={{ filter: mentor.color ? "none" : "grayscale(100%)" }}
//                 />
//             </div>

//             <h3 className="text-base font-bold mb-0.5" style={{ color: featured ? "#7a5c3e" : "#4a3728" }}>
//                 {mentor.name}
//             </h3>
//             <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#7a5c3e" }}>
//                 {mentor.role} @ {mentor.company}
//             </p>

//             <div className="w-full h-px mb-3" style={{ backgroundColor: "#e0d8cf" }} />

//             <div className="flex items-center gap-1.5 mb-0.5">
//                 <StarIcon />
//                 <span className="text-sm font-bold" style={{ color: "#4a3728" }}>{mentor.rating.toFixed(1)}</span>
//                 <span className="text-xs" style={{ color: "#8a7a6a" }}>({mentor.sessions.toLocaleString()} sessions)</span>
//             </div>

//             <p className="text-xs mb-3" style={{ color: "#8a7a6a" }}>{mentor.attendance}% Attendance</p>

//             <div className="w-full rounded-full h-1 mb-3" style={{ backgroundColor: "#d8cec4" }}>
//                 <div className="h-1 rounded-full" style={{ width: `${mentor.attendance}%`, backgroundColor: "#7a5c3e" }} />
//             </div>

//             <div className="flex flex-wrap justify-center gap-1.5 mb-3">
//                 {mentor.tags.map((tag) => (
//                     <span
//                         key={tag}
//                         className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
//                         style={{ backgroundColor: "#f6ede8", color: "#4a3728", border: "1px solid #e0d8cf" }}
//                     >
//                         {tag}
//                     </span>
//                 ))}
//             </div>

//             <div className="flex items-center gap-1.5 mb-4">
//                 <BadgeIcon />
//                 <span className="text-xs" style={{ color: "#8a7a6a" }}>{mentor.experience} Yrs Experience</span>
//             </div>

//             <button
//                 className="w-full py-2 rounded-xl text-xs font-bold tracking-wide transition-all hover:opacity-90 active:scale-95"
//                 style={{ backgroundColor: "#4a3728", color: "#f6ede8" }}
//             >
//                 Book Session
//             </button>
//         </div>
//     );
// }

// // ─── Main Modal ───────────────────────────────────────────────────────────────
// export default function FindMentorModal({ isOpen, onClose, mentors = [], loading = false }: FindMentorModalProps) {
//     const [query, setQuery] = useState<string>("");
//     const [activeFilter, setActiveFilter] = useState<FilterType>("all");
//     const [activeQuick, setActiveQuick] = useState<string | null>(null);
//     const [showAll, setShowAll] = useState<boolean>(false);

//     if (!isOpen) return null;

//     const filtered = mentors.filter((m) => {
//         const matchFilter =
//             activeFilter === "all" ||
//             (activeFilter === "free" && m.price === 0) ||   // isPaid → price
//             (activeFilter === "paid" && m.price > 0);
//         const matchQuery =
//             query === "" ||
//             m.name?.toLowerCase().includes(query.toLowerCase()) ||
//             m.role?.toLowerCase().includes(query.toLowerCase()) ||
//             m.company?.toLowerCase().includes(query.toLowerCase()) ||
//             m.tags?.some((t: string) => t.toLowerCase().includes(query.toLowerCase()));
//         return matchFilter && matchQuery;
//     });

//     const visible = showAll ? filtered : filtered.slice(0, INITIAL_SHOW);
//     const hasMore = filtered.length > INITIAL_SHOW;

//     return (
//         // Backdrop
//         <div
//             className="fixed inset-0 z-[200] flex items-center justify-center p-4"

//             style={{ backgroundColor: "rgba(74,55,40,0.45)", backdropFilter: "blur(6px)" }}
//             onClick={onClose}
//         >
//             {/* Modal Box */}
//             <div
//                 className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl"
//                 style={{ backgroundColor: "#f6ede8", boxShadow: "0 24px 60px rgba(74,55,40,0.22)" }}
//                 onClick={(e: React.MouseEvent) => e.stopPropagation()}
//             >
//                 {/* Close Button */}
//                 <button
//                     onClick={onClose}
//                     className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl flex items-center justify-center text-sm border transition-all hover:opacity-70"
//                     style={{ backgroundColor: "#fbf7f3", borderColor: "#e0d8cf", color: "#7a5c3e" }}
//                 >
//                     ✕
//                 </button>

//                 <div className="px-4 py-8 md:px-8">

//                     {/* ── Search Box ── */}
//                     <div
//                         className="rounded-2xl p-7 mb-8"
//                         style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #e0d8cf", boxShadow: "0 4px 20px rgba(74,55,40,0.08)" }}
//                     >
//                         <div className="text-center mb-5">
//                             <h1 className="text-2xl md:text-3xl font-bold leading-snug tracking-tight mb-1" style={{ color: "#4a3728" }}>
//                                 Find the Right Expert.{" "}
//                                 <span style={{ color: "#7a5c3e" }}>Instantly.</span>
//                             </h1>
//                             <p className="text-sm" style={{ color: "#8a7a6a" }}>
//                                 Tell us what you need — our AI finds the right consultant, coach, or creator for you.
//                             </p>
//                         </div>

//                         {/* Search Input */}
//                         <div className="relative flex items-center max-w-xl mx-auto mb-5">
//                             <input
//                                 value={query}
//                                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
//                                 placeholder='Describe your requirements... (e.g. "Resume review for product role")'
//                                 className="w-full rounded-xl py-3 pl-4 pr-12 text-sm outline-none"
//                                 style={{ backgroundColor: "#f6ede8", border: "1.5px solid #d8cec4", color: "#4a3728" }}
//                             />
//                             <button
//                                 className="absolute right-2 rounded-lg p-2 transition-all hover:scale-105 active:scale-95"
//                                 style={{ backgroundColor: "#4a3728", color: "#f6ede8" }}
//                             >
//                                 <ArrowIcon />
//                             </button>
//                         </div>

//                         {/* Quick Filters */}
//                         <div className="flex flex-wrap justify-center gap-2">
//                             {quickFilters.map((f) => (
//                                 <button
//                                     key={f}
//                                     onClick={() => setActiveQuick(activeQuick === f ? null : f)}
//                                     className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
//                                     style={{
//                                         borderColor: activeQuick === f ? "#7a5c3e" : "#d8cec4",
//                                         backgroundColor: activeQuick === f ? "#7a5c3e18" : "#f6ede8",
//                                         color: activeQuick === f ? "#4a3728" : "#8a7a6a",
//                                     }}
//                                 >
//                                     {f}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     {/* ── Top Mentors ── */}
//                     <div>
//                         {/* Header + filter row */}
//                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
//                             <div>
//                                 <h2 className="text-xl font-bold" style={{ color: "#4a3728" }}>Top Mentors</h2>
//                                 <p className="text-xs mt-0.5" style={{ color: "#8a7a6a" }}>
//                                     {filtered.length} expert{filtered.length !== 1 ? "s" : ""} available
//                                 </p>
//                             </div>

//                             {/* Free / Paid toggle */}
//                             <div
//                                 className="flex items-center rounded-xl p-1 gap-1 self-start sm:self-auto"
//                                 style={{ backgroundColor: "#e0d8cf" }}
//                             >
//                                 {(["all", "free", "paid"] as FilterType[]).map((type) => (
//                                     <button
//                                         key={type}
//                                         onClick={() => { setActiveFilter(type); setShowAll(false); }}
//                                         className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
//                                         style={{
//                                             backgroundColor: activeFilter === type ? "#4a3728" : "transparent",
//                                             color: activeFilter === type ? "#f6ede8" : "#7a5c3e",
//                                         }}
//                                     >
//                                         {type === "all" ? "All" : type === "free" ? "🎁 Free" : "💎 Paid"}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>

//                         {/* Cards */}
//                         {visible.length === 0 ? (
//                             <div className="text-center py-20" style={{ color: "#8a7a6a" }}>
//                                 <p className="font-medium">No mentors found</p>
//                                 <p className="text-sm mt-1">Try adjusting your search or filters</p>
//                             </div>
//                         ) : (
//                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//                                 {visible.map((mentor, i) => (
//                                     <MentorCard
//                                         key={mentor.id}
//                                         mentor={mentor}
//                                         featured={i === 0 && activeFilter === "all" && query === ""}
//                                     />
//                                 ))}
//                             </div>
//                         )}

//                         {/* Show More / Less */}
//                         {hasMore && (
//                             <div className="flex justify-center mt-8">
//                                 <button
//                                     onClick={() => setShowAll((p) => !p)}
//                                     className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-95"
//                                     style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #d8cec4", color: "#4a3728" }}
//                                 >
//                                     {showAll ? "Show Less" : `Show More (${filtered.length - INITIAL_SHOW} more)`}
//                                     <ChevronDown flip={showAll} />
//                                 </button>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }