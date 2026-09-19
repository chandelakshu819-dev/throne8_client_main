import React from "react";
import type { SeniorMentorApplication } from "@/lib/api/seniorMentorApplication.service";

export default function SeniorMentorServicesPage({ seniorData }: { seniorData: SeniorMentorApplication }) {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-black text-[#4a3728] tracking-tight">Services</h2>
          <p className="text-[#8a7a6a] font-medium mt-1">
            Manage your senior mentor offerings and pricing.
          </p>
        </div>
        <button className="px-6 py-2.5 bg-[#4a3728] hover:bg-[#7a5c3e] text-white rounded-xl font-bold transition shadow-sm">
          Create Service
        </button>
      </div>

      <div className="p-12 text-center border-2 border-dashed border-[#e0d8cf] rounded-3xl bg-[#fbf7f3]">
        <h3 className="text-xl font-black text-[#4a3728] mb-2">No Services Found</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          You haven't set up any mentoring services yet. Create one to get started!
        </p>
      </div>
    </div>
  );
}
