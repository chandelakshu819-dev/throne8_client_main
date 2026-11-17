import React from "react";

interface SlotPickerProps {
  selectedDate: number;
  setSelectedDate: (index: number) => void;
  next7Days: { day: string; date: string }[];
}

export default function SlotPicker({
  selectedDate,
  setSelectedDate,
  next7Days,
}: SlotPickerProps) {
  return (
    <section className="px-3 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-stretch gap-8 rounded-[28px] border border-white bg-gradient-to-br from-[#fdfcfb] to-[#f4f1ee] p-5 shadow-sm sm:rounded-[40px] sm:p-10 lg:flex-row lg:items-center lg:gap-16 lg:rounded-[48px] lg:p-16">
        <div className="min-w-0 flex-1">
          <span className="mb-4 block text-[10px] font-black uppercase tracking-[3px] text-[#8b7355] sm:mb-6 sm:tracking-[5px]">
            Scheduling v2.0
          </span>
          <h3 className="mb-4 text-2xl font-black leading-tight tracking-tighter sm:mb-6 sm:text-3xl md:text-5xl">
            PICK A TIME. <br />
            <span className="italic uppercase text-[#8b7355]">Zero Friction.</span>
          </h3>
          <p className="mb-6 max-w-lg text-sm font-medium text-slate-500 sm:mb-10 sm:text-base">
            No calendars, just simplicity. Choose your date and get started.
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-9 w-9 overflow-hidden rounded-full border-2 border-white bg-slate-300 sm:h-10 sm:w-10"
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

        <div className="w-full min-w-0 rounded-3xl border border-[#ece7e2] bg-white p-4 shadow-2xl sm:rounded-[40px] sm:p-8 lg:w-[420px] lg:shrink-0">
          <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-3 sm:mb-8 sm:gap-3 sm:pb-4">
            {next7Days.map((d, i) => (
              <button
                key={i}
                onClick={() => setSelectedDate(i)}
                className={`flex h-[72px] w-14 flex-shrink-0 flex-col items-center justify-center rounded-2xl transition-all sm:h-20 sm:w-16 sm:rounded-3xl ${
                  selectedDate === i
                    ? "scale-105 bg-[#4a3728] text-white shadow-xl"
                    : "bg-[#f8f6f4] text-slate-500 hover:bg-[#ece7e2]"
                }`}
              >
                <span className="mb-1 text-[9px] font-black uppercase">{d.day}</span>
                <span className="text-base font-black">{d.date.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {["12:30 PM", "02:00 PM", "06:00 PM", "07:30 PM"].map((t) => (
                <button
                  key={t}
                  className="rounded-2xl border border-[#ece7e2] py-3.5 text-xs font-black transition-all hover:bg-[#4a3728] hover:text-white"
                >
                  {t}
                </button>
              ))}
              <button className="col-span-2 rounded-2xl bg-[#8b7355]/10 py-3.5 text-xs font-black text-[#8b7355] transition-all hover:bg-[#8b7355] hover:text-white">
                Join Waitlist
              </button>
            </div>
          </div>

          <button className="mt-6 w-full rounded-2xl bg-[#4a3728] py-4 text-[11px] font-black uppercase tracking-[3px] text-white shadow-2xl transition-all hover:bg-[#8b7355] sm:mt-8 sm:tracking-[4px]">
            Confirm Booking
          </button>
        </div>
      </div>
    </section>
  );
}