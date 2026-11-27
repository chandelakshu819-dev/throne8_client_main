import React from "react";

export default function StudyRouteLoading() {
  return (
    <div className="min-h-full w-full bg-[#f7f3ee] p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-xl bg-[#e0d8cf]" />
          <div className="h-4 w-80 max-w-full rounded-lg bg-[#e8e0d7]" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-white/80 border border-[#e0d8cf]"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-52 rounded-2xl bg-white/80 border border-[#e0d8cf] p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#e0d8cf]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-[#e0d8cf]" />
                  <div className="h-3 w-1/3 rounded bg-[#e8e0d7]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-[#e8e0d7]" />
                <div className="h-3 w-4/5 rounded bg-[#e8e0d7]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
