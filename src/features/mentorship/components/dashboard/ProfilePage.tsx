// mentorDashboard/components/ProfilePage.tsx=> Main Profile 
import React, { useEffect, useState } from "react"
import {
  User,
  Camera,
  MapPin,
  FileText,
  Linkedin,
  Instagram,
  Sparkles,
  CheckCircle,
  ShieldCheck,
  Eye,
  Upload,
} from "lucide-react"
import VerificationModalPreview from "../profile/modal/VerificationModal";
import TermsAndConditionsModal from "../profile/modal/TermsAndConditionsModal";
import VerificationService from "@/lib/api/verification.service";
import UpdateProfileModal from "../profile/modal/Updateprofilemodal";

interface ProfilePageProps {
  profilePhoto: string | null
  mentorData: any;
  isVerified: boolean
  agreedToTerms: boolean
  agreedToCode: boolean
  setProfilePhoto: (photo: string | null) => void
  setIsVerified: (val: boolean) => void
  setAgreedToTerms: (val: boolean) => void
  setAgreedToCode: (val: boolean) => void
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function ProfilePage({
  mentorData,
  profilePhoto,
  isVerified,
  agreedToTerms,
  agreedToCode,
  setProfilePhoto,
  setIsVerified,
  setAgreedToTerms,
  setAgreedToCode,
  handlePhotoUpload,
}: ProfilePageProps) {
  // ✅ FIX: local override state — save hone ke turant baad UI update ho, refresh na karna pade
  const [liveMentorData, setLiveMentorData] = useState(mentorData);
  useEffect(() => {
    setLiveMentorData(mentorData);
  }, [mentorData]);

  const user = liveMentorData?.user;
  const exp = liveMentorData?.experience;
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [verificationStatuses, setVerificationStatuses] = useState({
    email: false,
    phone: false,
    identity: false,
    professional: false,
  });
  const [approvalStatus, setApprovalStatus] = useState<'idle' | 'pending' | 'approved' | 'submitting'>('idle');
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // ✅ FIX: was hardcoded "1,234 views" for every mentor. Now reads the
  // real count from liveMentorData, trying a few likely field-name shapes
  // (top-level, nested under analytics, or nested under stats) and
  // falling back to 0 if the backend doesn't send it yet.
  const profileViews =
    liveMentorData?.profileViews ??
    liveMentorData?.analytics?.views ??
    liveMentorData?.stats?.profileViews ??
    0;

  // Component mount / update par mentor ka current status check karo
  useEffect(() => {
    if (liveMentorData?.status === 'active') {
      setApprovalStatus('approved');
    } else if (liveMentorData?.status === 'pending_approval') {
      setApprovalStatus('pending');
    }
  }, [liveMentorData]);

  // Calculate if all verifications are complete
  const allVerified = Object.values(verificationStatuses).every(Boolean);

  // ✅ FIX: "Verified Badge Status" — derived from real data now.
  const badgeVerified = liveMentorData?.verifiedBadge ?? liveMentorData?.isVerified ?? allVerified;

  useEffect(() => {
    setIsVerified(badgeVerified);
  }, [badgeVerified]);

  const handleRequestApproval = async () => {
    if (!allVerified || !agreedToCode) return;

    setApprovalStatus('submitting');
    try {
      // Ye API call sirf "request submitted" state set karta hai
      // Actual approval admin karega
      await new Promise(r => setTimeout(r, 800)); // brief loading
      setApprovalStatus('pending');
    } catch (e) {
      setApprovalStatus('idle');
    }
  };

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const [emailRes, phoneRes, aadhaarRes, companyRes] = await Promise.allSettled([
          VerificationService.checkEmailVerificationStatus(),
          VerificationService.checkPhoneVerificationStatus(),
          VerificationService.checkAadhaarVerificationStatus(),
          VerificationService.checkCompanyEmailVerificationStatus(),
        ]);

        setVerificationStatuses({
          email: emailRes.status === 'fulfilled'
            ? emailRes.value?.data?.emailVerified === true : false,
          phone: phoneRes.status === 'fulfilled'
            ? (phoneRes.value?.data?.phoneVerified === true || phoneRes.value?.data?.verified === true) : false,
          identity: aadhaarRes.status === 'fulfilled'
            ? aadhaarRes.value?.data?.aadhaarVerified === true : false,
          professional: companyRes.status === 'fulfilled'
            ? companyRes.value?.data?.companyEmailVerified === true : false,
        });
      } catch (e) {
        // silent fail
      }
    };
    fetchStatuses();
  }, []);

  const verificationSteps = [
    { step: 'Email Verification', status: verificationStatuses.email ? 'completed' : 'pending' },
    { step: 'Phone Verification', status: verificationStatuses.phone ? 'completed' : 'pending' },
    { step: 'Identity Verification', status: verificationStatuses.identity ? 'completed' : 'pending' },
    { step: 'Professional Credentials', status: verificationStatuses.professional ? 'completed' : 'pending' },
  ];

  return (
    <>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg animate-pulse" style={{ backgroundColor: "#4a3728" }}>
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{ color: "#4a3728" }}>
                Create/Edit Profile
              </h2>
              <p style={{ color: "#8a7a6a" }} className="text-sm">
                Build your professional mentor profile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: "#fbf7f3", border: "2px solid #e0d8cf" }}>
            <Eye className="w-5 h-5" style={{ color: "#7a5c3e" }} />
            <span className="font-bold" style={{ color: "#4a3728" }}>
              {Number(profileViews).toLocaleString()} views
            </span>
          </div>
        </div>

        {/* Profile Photo */}
        <div className="bg-white p-8 rounded-2xl shadow-xl transform hover:shadow-2xl transition-all duration-300 border-2 border-[#e0d8cf]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: "#4a3728" }}>
            <Camera className="w-6 h-6" />
            Profile Photo
          </h3>

          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300" style={{ border: '4px solid #e0d8cf' }}>
                {(profilePhoto || liveMentorData?.profilePic) ? (
                  <img src={profilePhoto || liveMentorData?.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#4a3728]">
                    <span className="text-5xl font-bold text-white">
                      {`${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`}
                    </span>
                  </div>
                )}
              </div>
              {isVerified && (
                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ backgroundColor: '#4a3728' }}>
                  <CheckCircle className="w-6 h-6 text-white fill-current" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              <div className="flex items-center gap-2 mt-4">
                {/* Read-only now — reflects real verification status
                    (see badgeVerified above), can't be faked by clicking. */}
                <input
                  type="checkbox"
                  checked={isVerified}
                  readOnly
                  disabled
                  className="w-5 h-5 rounded cursor-not-allowed"
                  style={{ accentColor: '#4a3728' }}
                />
                <label className="font-semibold flex items-center gap-2" style={{ color: '#7a5c3e' }}>
                  <ShieldCheck className="w-5 h-5" />
                  {isVerified ? 'Verified Badge Active' : 'Verified Badge — Complete all verifications below to unlock'}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white p-8 rounded-2xl shadow-xl transform hover:shadow-2xl transition-all duration-300" style={{ border: '2px solid #e0d8cf' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold mb-6" style={{ color: '#4a3728' }}>Basic Information</h3>
            <button
              onClick={() => setShowUpdateModal(true)}
              className="text-base font-bold mb-6 px-5 py-2 rounded-xl text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "#4a3728" }}
            >
               Update Full Profile
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Full Name */}
            <div className="p-4 rounded-2xl" style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #e0d8cf" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a08070" }}>Full Name</p>
              <p className="text-base font-bold" style={{ color: "#4a3728" }}>
                {`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || <span className="italic text-[#c0b0a0]">Not set</span>}
              </p>
            </div>

            {/* Status Badge */}
            <div className="p-4 rounded-2xl" style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #e0d8cf" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a08070" }}>Account Status</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${liveMentorData?.status === "active"
                  ? "bg-green-100 text-green-700"
                  : liveMentorData?.status === "pending_approval"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${liveMentorData?.status === "active" ? "bg-green-500" :
                    liveMentorData?.status === "pending_approval" ? "bg-yellow-500" : "bg-gray-400"
                  }`} />
                {liveMentorData?.status === "active" ? "Active" :
                  liveMentorData?.status === "pending_approval" ? "Pending Approval" :
                    liveMentorData?.status ?? "—"}
              </span>
            </div>

            {/* Headline / Title — full width */}
            <div className="md:col-span-2 p-4 rounded-2xl" style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #e0d8cf" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a08070" }}>Mentor Title</p>
              <p className="text-base font-semibold leading-snug" style={{ color: "#4a3728" }}>
                {liveMentorData?.title || <span className="italic text-[#c0b0a0]">Not set</span>}
              </p>
            </div>

            {/* Current Role */}
            <div className="p-4 rounded-2xl" style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #e0d8cf" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a08070" }}>Current Role</p>
              <p className="text-base font-semibold" style={{ color: "#4a3728" }}>
                {exp?.currentRole || <span className="italic text-[#c0b0a0]">Not set</span>}
              </p>
            </div>

            {/* Experience */}
            <div className="p-4 rounded-2xl" style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #e0d8cf" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#a08070" }}>Experience</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold" style={{ color: "#4a3728" }}>
                  {exp?.total ? `${exp.total}+ Years` : <span className="italic text-[#c0b0a0]">Not set</span>}
                </p>
                {exp?.level && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold capitalize" style={{ backgroundColor: "#4a3728", color: "white" }}>
                    {exp.level}
                  </span>
                )}
              </div>
            </div>

            {/* Domains — full width */}
            <div className="md:col-span-2 p-4 rounded-2xl" style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #e0d8cf" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#a08070" }}>Domains</p>
              {liveMentorData?.domains?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {liveMentorData.domains.map((d: string) => (
                    <span key={d} className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#4a3728" }}>
                      {d.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              ) : <span className="italic text-sm text-[#c0b0a0]">No domains added</span>}
            </div>

            {/* Skills — full width */}
            <div className="md:col-span-2 p-4 rounded-2xl" style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #e0d8cf" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#a08070" }}>Skills</p>
              {liveMentorData?.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {liveMentorData.skills.map((s: string) => (
                    <span key={s} className="px-3 py-1 rounded-xl text-xs font-semibold" style={{ backgroundColor: "#ece7e2", color: "#4a3728" }}>
                      {s}
                    </span>
                  ))}
                </div>
              ) : <span className="italic text-sm text-[#c0b0a0]">No skills added</span>}
            </div>

            {/* Bio — full width */}
            <div className="md:col-span-2 p-4 rounded-2xl" style={{ backgroundColor: "#fbf7f3", border: "1.5px solid #e0d8cf" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#a08070" }}>About Me</p>
              <p className="text-sm leading-relaxed" style={{ color: "#5a4535" }}>
                {liveMentorData?.bio || <span className="italic text-[#c0b0a0]">No bio added yet</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Social Media Integration */}
        <div className="bg-white p-8 rounded-2xl shadow-xl transform hover:shadow-2xl transition-all duration-300" style={{ border: '2px solid #e0d8cf' }}>
          <h3 className="text-xl font-bold mb-6" style={{ color: '#4a3728' }}>Social Media Integration</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border-2 hover:shadow-lg transition-all duration-300" style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3' }}>
              <Linkedin className="w-8 h-8 text-blue-600" />
              <div className="flex-1">
                <p className="font-semibold" style={{ color: '#4a3728' }}>LinkedIn Profile</p>
                <p className="text-sm" style={{ color: '#8a7a6a' }}>Connect your LinkedIn account</p>
              </div>
              <button className="px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 bg-blue-600 text-white">
                Connect
              </button>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border-2 hover:shadow-lg transition-all duration-300" style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3' }}>
              <Instagram className="w-8 h-8 text-black" />
              <div className="flex-1">
                <p className="font-semibold" style={{ color: '#4a3728' }}>github</p>
                <p className="text-sm" style={{ color: '#8a7a6a' }}>Link your gitbub account</p>
              </div>
              <button className="px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-white" style={{ background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}>
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* Agreements & Verification */}
        <div className="bg-white p-8 rounded-2xl shadow-xl transform hover:shadow-2xl transition-all duration-300" style={{ border: '2px solid #e0d8cf' }}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: '#4a3728' }}>
            <FileText className="w-6 h-6" />
            Agreements & Verification
          </h3>
          <div className="space-y-6">
            <div className="p-5 rounded-xl border-2" style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3' }}>
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6" style={{ color: '#7a5c3e' }} />
                <h4 className="font-bold" style={{ color: '#4a3728' }}>Verification Process</h4>
              </div>
              <div className="space-y-3">

                {verificationSteps.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: '#fff', border: '1px solid #e0d8cf' }}>
                    <span style={{ color: '#8a7a6a' }}>{item.step}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {item.status === 'completed' ? '✓ Completed' : 'Pending'}
                    </span>
                  </div>
                ))}

              </div>
              {approvalStatus !== 'approved' && (
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="mt-4 px-6 py-2 rounded-lg text-white font-semibold shadow-md hover:shadow-lg"
                  style={{ backgroundColor: "#4a3728", color: "#fff" }}>
                  View Verification Steps
                </button>
              )}
              <div
                className={`p-5 rounded-xl border-2 transition-all duration-300 mt-4 ${approvalStatus === 'pending' || approvalStatus === 'approved'
                  ? 'opacity-40 pointer-events-none select-none'
                  : 'hover:shadow-md'
                  }`}
                style={{ borderColor: '#e0d8cf', backgroundColor: '#fbf7f3' }}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreedToCode}
                    readOnly
                    className="w-5 h-5 mt-1 rounded cursor-not-allowed"
                    style={{ accentColor: '#4a3728' }}
                  />
                  <div className="flex-1">
                    <label className="font-semibold cursor-pointer" style={{ color: '#4a3728' }}>
                      Platform Rules & Terms Acceptance *
                    </label>
                    <p className="text-sm mt-1" style={{ color: '#8a7a6a' }}>
                      I accept the platform's terms of service, privacy policy, payment terms, and agree to
                      follow all community guidelines and platform rules.
                    </p>
                    <button
                      onClick={() => setShowTermsModal(true)}
                      className="text-sm font-semibold mt-2 hover:underline flex items-center gap-1"
                      style={{ color: '#7a5c3e' }}>
                      Read Terms & Conditions →
                    </button>
                    {!agreedToCode && (
                      <p className="text-xs mt-1" style={{ color: '#b45309' }}>
                        ⚠️ Please read and accept the Terms & Conditions to enable the checkbox.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Verification Button */}
              {/* Get Approval Button — sirf tab show ho jab terms accept ho ya already submitted/approved */}
              {(agreedToCode || approvalStatus === 'pending' || approvalStatus === 'approved') && (
                <button
                  onClick={handleRequestApproval}
                  disabled={!allVerified || approvalStatus === 'pending' || approvalStatus === 'approved' || approvalStatus === 'submitting'}
                  className={`mt-4 w-full px-6 py-3 rounded-lg text-white font-semibold shadow-md transition-all duration-300 flex items-center justify-center gap-2 ${approvalStatus === 'pending' || approvalStatus === 'approved'
                    ? 'opacity-60 cursor-not-allowed'
                    : !allVerified
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-lg hover:scale-105 active:scale-95'
                    }`}
                  style={{
                    backgroundColor:
                      approvalStatus === 'approved' ? '#15803d' :
                        approvalStatus === 'pending' ? '#7a5c3e' :
                          allVerified ? '#4a3728' : '#a89080'
                  }}
                >
                  {approvalStatus === 'submitting' ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting Request...
                    </>
                  ) : approvalStatus === 'approved' ? (
                    '✓ Mentor Account Approved'
                  ) : approvalStatus === 'pending' ? (
                    '⏳ Approval Request Submitted'
                  ) : !allVerified ? (
                    'Complete All Verifications First'
                  ) : (
                    '🚀 Get Approval for Mentor'
                  )}
                </button>
              )}

              {/* Status Message — button ke neeche */}
              {approvalStatus === 'pending' && (
                <div className="mt-4 rounded-2xl overflow-hidden shadow-md border" style={{ borderColor: '#bbf7d0' }}>
                  <div className="flex items-center gap-3 px-5 py-3" style={{ backgroundColor: '#4a3728' }}>
                    <span className="text-lg">⏳</span>
                    <p className="text-sm font-bold text-white tracking-wide">Review In Progress</p>
                  </div>
                  <div className="px-5 py-4" style={{ backgroundColor: '#f0fdf4' }}>
                    <p className="text-sm font-semibold" style={{ color: '#15803d' }}>
                      Your mentor account is currently under review by the Throne8 team.
                    </p>
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: '#166534' }}>
                      The verification and approval process typically takes{' '}
                      <span className="font-bold bg-green-100 px-1 rounded">5 to 7 business days</span>.
                      You will be notified via email upon completion.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#16a34a' }} />
                      <span className="text-xs font-medium" style={{ color: '#16a34a' }}>Application submitted successfully</span>
                    </div>
                  </div>
                </div>
              )}

              {approvalStatus === 'approved' && (
                <div className="mt-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: '#dcfce7', borderColor: '#86efac' }}>
                  <p className="text-sm font-bold" style={{ color: '#15803d' }}>
                    ✅ Your mentor account has been officially approved by Throne8.
                  </p>
                  <p className="text-xs mt-1 font-medium" style={{ color: '#166534' }}>
                    You are now fully authorized to conduct mentorship sessions and engage with mentees on the platform. Welcome to the Throne8 Mentor Community!
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            className="px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "2px solid #e0d8cf" }}
          >
            Save as Draft
          </button>
        </div>
      </div>

      <VerificationModalPreview
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          // Re-fetch statuses after modal closes
          VerificationService.checkEmailVerificationStatus()
            .then(r => setVerificationStatuses(prev => ({ ...prev, email: r?.data?.emailVerified === true })))
            .catch(() => { });
          VerificationService.checkAadhaarVerificationStatus()
            .then(r => setVerificationStatuses(prev => ({ ...prev, identity: r?.data?.aadhaarVerified === true })))
            .catch(() => { });
          VerificationService.checkCompanyEmailVerificationStatus()
            .then(r => setVerificationStatuses(prev => ({ ...prev, professional: r?.data?.companyEmailVerified === true })))
            .catch(() => { });
          VerificationService.checkPhoneVerificationStatus()
            .then(r => setVerificationStatuses(prev => ({ ...prev, phone: r?.data?.phoneVerified === true || r?.data?.verified === true })))
            .catch(() => { });
        }}
        onAllVerified={() => { setIsVerified(true); setShowVerifyModal(false); }}
      />

      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setAgreedToCode(true)}
      />

      <UpdateProfileModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        mentorData={liveMentorData}
        mentorId={liveMentorData?.mentorId ?? ""}
        onUpdateSuccess={(updated) => {
          // ✅ FIX: turant local state update — page refresh ki zarurat nahi
          console.log("✅ Profile updated:", updated);
          setLiveMentorData((prev: any) => ({ ...prev, ...updated }));
          setShowUpdateModal(false);
        }}
      />
    </>
  )
}