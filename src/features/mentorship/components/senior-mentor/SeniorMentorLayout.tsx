"use client";
import React, { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import SeniorMentorApplicationService, { SeniorMentorApplication } from "@/lib/api/seniorMentorApplication.service";
import MentorService from "@/lib/api/mentorship.service";
import SeniorMentorSidebar from "./SeniorMentorSidebar";
import SeniorProfilePage from "./SeniorProfilePage";
import SeniorMentorServicesPage from "./SeniorMentorServicesPage";
import AvailabilityPage from "../dashboard/AvailabilityPage";
import { useRouter } from "next/navigation";

export default function SeniorMentorLayout({ userId, activeTab = 'profile' }: { userId: string, activeTab?: 'profile' | 'services' | 'availability' }) {
  const router = useRouter();
  const [application, setApplication] = useState<SeniorMentorApplication | null>(null);
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!userId) return;
    
    Promise.all([
      SeniorMentorApplicationService.getMyApplication(),
      MentorService.getMentorByUserId(userId).catch(err => {
        // Specifically catch and log, as not all users might have a provisioned Mentor profile yet
        console.warn("Mentor profile fetch warning:", err);
        return null;
      })
    ])
      .then(([appRes, mentorRes]) => {
        if (appRes) {
          setApplication(appRes);
        } else {
          setErrorMsg("Profile not found or access denied.");
        }
        
        if (mentorRes && mentorRes.data) {
          setMentorProfile(mentorRes.data);
        }
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || err?.message || 'Unknown network error';
        setErrorMsg(`Error loading profile: ${msg}`);
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-[#f6ede8] items-center justify-center font-sans">
        <Loader2 className="w-12 h-12 text-[#4a3728] animate-spin mb-4" />
        <p className="text-[#4a3728] font-bold">Loading Profile...</p>
      </div>
    );
  }

  if (errorMsg || !application) {
    return (
      <div className="flex flex-col h-screen bg-[#f6ede8] font-sans">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-black text-[#4a3728] mb-2">Error Loading Profile</h2>
          <p className="text-slate-600 font-medium mb-6">{errorMsg || "An unknown error occurred."}</p>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="px-6 py-2.5 bg-[#4a3728] text-white rounded-xl font-bold shadow hover:bg-[#7a5c3e] transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Ensure Availability hasn't been accessed if Mentor profile isn't provisioned yet
  const showAvailabilityError = activeTab === 'availability' && !mentorProfile;

  return (
    <div className="flex flex-col h-screen bg-[#f6ede8] font-sans">
      <div className="h-20 shrink-0" aria-hidden="true" />
      
      <div className="flex flex-1 min-h-0">
        <SeniorMentorSidebar application={application} activeTab={activeTab} />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6 py-8 max-w-[1600px] mx-auto">
            {activeTab === 'profile' && <SeniorProfilePage seniorData={application} />}
            {activeTab === 'services' && <SeniorMentorServicesPage seniorData={application} />}
            {activeTab === 'availability' && !showAvailabilityError && <AvailabilityPage mentorData={mentorProfile} />}
            {showAvailabilityError && (
              <div className="flex flex-col items-center justify-center p-6 text-center mt-20">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-black text-[#4a3728] mb-2">Profile Not Fully Provisioned</h2>
                <p className="text-slate-600 font-medium max-w-lg mx-auto">
                  Your Senior Mentor application is approved, but the standard Mentor availability system has not been fully provisioned by an admin yet. Please contact support.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
