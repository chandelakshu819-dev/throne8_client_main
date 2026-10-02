"use client";

import React from "react";

interface SlotPickerSectionProps {
    selectedDate: number;
    setSelectedDate: (index: number) => void;
    onJoinWaitlist?: () => void;
}

export default function SlotPickerSection({
    selectedDate,
    setSelectedDate,
    onJoinWaitlist,
}: SlotPickerSectionProps) {
    const next7Days = [
        { day: "Mon", date: "06 Jan" },
        { day: "Tue", date: "07 Jan" },
        { day: "Wed", date: "08 Jan" },
        { day: "Thu", date: "09 Jan" },
        { day: "Fri", date: "10 Jan" },
        { day: "Sat", date: "11 Jan" },
        { day: "Sun", date: "12 Jan" },
    ];

    return (
        <section className="px-6 py-12">
            <div className="max-w-6xl mx-auto bg-gradient-to-br from-[#fdfcfb] to-[#f4f1ee] rounded-[48px] p-10 md:p-16 border border-white shadow-sm reveal-on-scroll flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1">
                    <span className="text-[#8b7355] font-black text-[10px] uppercase tracking-[5px] mb-6 block">
                        Scheduling v2.0
                    </span>
                    <h3 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 leading-tight">
                        PICK A TIME. <br />
                        <span className="text-[#8b7355] italic uppercase">Zero Friction.</span>
                    </h3>
                    <p className="text-slate-500 text-base font-medium mb-10 max-w-lg">
                        No calendars, just simplicity. Choose your date and get started.
                    </p>
                    <div className="flex items-center gap-6">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-full border-2 border-white bg-slate-300 overflow-hidden"
                                >
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="" />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs font-bold text-[#4a3728]">
                            Joined by 200+ mentees today
                        </p>
                    </div>
                </div>

                <div className="w-full lg:w-[420px] bg-white rounded-[40px] p-8 shadow-2xl border border-[#ece7e2]">
                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-8">
                        {next7Days.map((d, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(i)}
                                className={`flex-shrink-0 w-16 h-20 rounded-3xl flex flex-col items-center justify-center transition-all ${selectedDate === i
                                        ? "bg-[#4a3728] text-white shadow-xl scale-105"
                                        : "bg-[#f8f6f4] text-slate-500 hover:bg-[#ece7e2]"
                                    }`}
                            >
                                <span className="text-[9px] font-black uppercase mb-1">{d.day}</span>
                                <span className="text-base font-black">{d.date.split(" ")[0]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {["12:30 PM", "02:00 PM", "06:00 PM", "07:30 PM"].map((t) => (
                                <button
                                    key={t}
                                    className="py-3.5 rounded-2xl border border-[#ece7e2] text-xs font-black hover:bg-[#4a3728] hover:text-white transition-all"
                                >
                                    {t}
                                </button>
                            ))}
                            <button
                                onClick={onJoinWaitlist}
                                className="py-3.5 rounded-2xl bg-[#8b7355]/10 text-[#8b7355] text-xs font-black col-span-2 hover:bg-[#8b7355] hover:text-white transition-all cursor-pointer"
                            >
                                Join Waitlist
                            </button>
                        </div>
                    </div>
                    <button className="w-full mt-8 py-4 bg-[#4a3728] text-white rounded-2xl font-black text-[11px] uppercase tracking-[4px] shadow-2xl hover:bg-[#8b7355] transition-all">
                        Confirm Booking
                    </button>
                </div>
            </div>
        </section>
    );
}