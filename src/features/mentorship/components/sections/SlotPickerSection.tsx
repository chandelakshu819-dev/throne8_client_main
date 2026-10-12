"use client";
//src/features/mentorship/components/sections/SlotPickerSection.tsx
import React, { useEffect, useState } from "react";

interface SlotPickerSectionProps {
    selectedDate: number;
    setSelectedDate: (index: number) => void;
    onJoinWaitlist?: () => void;
}

interface DayItem {
    day: string;
    date: string;
    month: string;
}

const TIME_SLOTS = ["12:30 PM", "02:00 PM", "06:00 PM", "07:30 PM"];

export default function SlotPickerSection({
    selectedDate,
    setSelectedDate,
    onJoinWaitlist,
}: SlotPickerSectionProps) {
    const [days, setDays] = useState<DayItem[]>([]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Aaj se agle 7 din (client par compute hota hai, taaki hydration mismatch na ho)
    useEffect(() => {
        const now = new Date();
        const list: DayItem[] = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
            return {
                day: d.toLocaleDateString("en-US", { weekday: "short" }),
                date: String(d.getDate()).padStart(2, "0"),
                month: d.toLocaleDateString("en-US", { month: "short" }),
            };
        });
        setDays(list);
    }, []);

    const handleFindMentors = () => {
        document.getElementById("top-mentors")?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section className="px-6 py-12">
            <div className="max-w-6xl mx-auto bg-gradient-to-br from-[#fdfcfb] to-[#f4f1ee] rounded-[48px] p-10 md:p-16 border border-white shadow-sm reveal-on-scroll flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1">
                    <span className="text-[#8b7355] font-black text-[10px] uppercase tracking-[5px] mb-6 block">
                        Easy Scheduling
                    </span>
                    <h3 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 leading-tight">
                        PICK A TIME. <br />
                        <span className="text-[#8b7355] italic uppercase">Zero Friction.</span>
                    </h3>
                    <p className="text-slate-500 text-base font-medium max-w-lg">
                        No calendars, just simplicity. Choose a day, then pick a mentor and book in a few clicks.
                    </p>
                </div>

                <div className="w-full lg:w-[420px] bg-white rounded-[40px] p-8 shadow-2xl border border-[#ece7e2]">
                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-8 min-h-[104px]">
                        {days.map((d, i) => (
                            <button
                                key={`${d.month}-${d.date}`}
                                type="button"
                                onClick={() => setSelectedDate(i)}
                                className={`flex-shrink-0 w-16 h-20 rounded-3xl flex flex-col items-center justify-center transition-all ${
                                    selectedDate === i
                                        ? "bg-[#4a3728] text-white shadow-xl scale-105"
                                        : "bg-[#f8f6f4] text-slate-500 hover:bg-[#ece7e2]"
                                }`}
                            >
                                <span className="text-[9px] font-black uppercase mb-1">{d.day}</span>
                                <span className="text-base font-black">{d.date}</span>
                                <span className="text-[8px] font-bold uppercase opacity-70">{d.month}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {TIME_SLOTS.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setSelectedTime(t)}
                                className={`py-3.5 rounded-2xl border text-xs font-black transition-all ${
                                    selectedTime === t
                                        ? "bg-[#4a3728] text-white border-[#4a3728]"
                                        : "border-[#ece7e2] hover:bg-[#4a3728] hover:text-white"
                                }`}
                            >
                                {t}
                            </button>
                        ))}

                        {onJoinWaitlist && (
                            <button
                                type="button"
                                onClick={onJoinWaitlist}
                                className="py-3.5 rounded-2xl bg-[#8b7355]/10 text-[#8b7355] text-xs font-black col-span-2 hover:bg-[#8b7355] hover:text-white transition-all cursor-pointer"
                            >
                                Join Waitlist
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleFindMentors}
                        className="w-full mt-8 py-4 bg-[#4a3728] text-white rounded-2xl font-black text-[11px] uppercase tracking-[4px] shadow-2xl hover:bg-[#8b7355] transition-all"
                    >
                        Find Mentors
                    </button>
                </div>
            </div>
        </section>
    );
}