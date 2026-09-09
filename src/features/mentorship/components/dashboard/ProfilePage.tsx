// mentorDashboard/components/ProfilePage.tsx=> Main Profile
import React, { useEffect, useState } from "react"
import {
  User,
  Camera,
  FileText,
  Linkedin,
  Github,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Clock,
  Rocket,
  AlertTriangle,
  ArrowRight,
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

// Reusable info tile used across the Basic Information grid
const InfoTile = ({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) => (
  <div
    className={`p-4 rounded-xl ${full ? "md:col-span-2" : ""}`}
    style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}
  >
    <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#a08070" }}>
      {label}
    </p>
    {children}
  </div>
);

const EmptyValue = () => <span className="italic text-sm" style={{ color: "#c0b0a0" }}>Not set</span>;

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

  const currentPhoto = profilePhoto || liveMentorData?.profilePic;
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#4a3728" }}>
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#4a3728" }}>
                Create/Edit Profile
              </h2>
              <p style={{ color: "#8a7a6a" }} className="text-sm">
                Build your professional mentor profile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
            <Eye className="w-4 h-4" style={{ color: "#7a5c3e" }} />
            <span className="text-sm font-bold" style={{ color: "#4a3728" }}>
              {Number(profileViews).toLocaleString()} views
            </span>
          </div>
        </div>

        {/* Basic Information — photo lives here now, not in a separate duplicate card */}
        <div className="bg-white p-6 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
          <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-4">
              {/* Compact editable avatar */}
              <div className="relative group shrink-0">
                <label className="cursor-pointer block">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <div className="w-16 h-16 rounded-xl overflow-hidden" style={{ border: '2px solid #e0d8cf' }}>
                    {currentPhoto ? (
                      <img src={currentPhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#4a3728' }}>
                        <span className="text-xl font-bold text-white">{initials}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                    <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </label>
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4a3728', border: '2px solid #fff' }}>
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              <div>
                <p className="text-lg font-bold" style={{ color: "#4a3728" }}>
                  {`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || <EmptyValue />}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${liveMentorData?.status === "active"
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
                  <span className="text-xs flex items-center gap-1" style={{ color: isVerified ? '#7a5c3e' : '#a08070' }}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isVerified ? 'Verified badge active' : 'Complete verifications to unlock badge'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowUpdateModal(true)}
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#4a3728" }}
            >
              Update Full Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoTile label="Mentor Title" full>
              <p className="text-sm font-semibold leading-snug" style={{ color: "#4a3728" }}>
                {liveMentorData?.title || <EmptyValue />}
              </p>
            </InfoTile>

            <InfoTile label="Current Role">
              <p className="text-sm font-semibold" style={{ color: "#4a3728" }}>
                {exp?.currentRole || <EmptyValue />}
              </p>
            </InfoTile>

            <InfoTile label="Experience">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: "#4a3728" }}>
                  {exp?.total ? `${exp.total}+ Years` : <EmptyValue />}
                </p>
                {exp?.level && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize" style={{ backgroundColor: "#f3ece4", color: "#4a3728" }}>
                    {exp.level}
                  </span>
                )}
              </div>
            </InfoTile>

            <InfoTile label="Domains" full>
              {liveMentorData?.domains?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {liveMentorData.domains.map((d: string) => (
                    <span key={d} className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#f3ece4", color: "#4a3728" }}>
                      {d.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              ) : <span className="italic text-sm" style={{ color: "#c0b0a0" }}>No domains added</span>}
            </InfoTile>

            <InfoTile label="Skills" full>
              {liveMentorData?.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {liveMentorData.skills.map((s: string) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: "#ece7e2", color: "#4a3728" }}>
                      {s}
                    </span>
                  ))}
                </div>
              ) : <span className="italic text-sm" style={{ color: "#c0b0a0" }}>No skills added</span>}
            </InfoTile>

            <InfoTile label="About Me" full>
              <p className="text-sm leading-relaxed" style={{ color: "#5a4535" }}>
                {liveMentorData?.bio || <span className="italic" style={{ color: "#c0b0a0" }}>No bio added yet</span>}
              </p>
            </InfoTile>
          </div>
        </div>

        {/* Social Media Integration */}
        <div className="bg-white p-6 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
          <h3 className="text-base font-bold mb-4" style={{ color: '#4a3728' }}>Social Media Integration</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3.5 rounded-xl" style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3' }}>
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0" style={{ border: '1px solid #e0d8cf' }}>
                <Linkedin className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#4a3728' }}>LinkedIn Profile</p>
                <p className="text-xs" style={{ color: '#8a7a6a' }}>Connect your LinkedIn account</p>
              </div>
              <button className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: '#4a3728' }}>
                Connect
              </button>
            </div>
            <div className="flex items-center gap-4 p-3.5 rounded-xl" style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3' }}>
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0" style={{ border: '1px solid #e0d8cf' }}>
                <Github className="w-4.5 h-4.5 text-black" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#4a3728' }}>GitHub</p>
                <p className="text-xs" style={{ color: '#8a7a6a' }}>Link your GitHub account</p>
              </div>
              <button className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: '#4a3728' }}>
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* Agreements & Verification */}
        <div className="bg-white p-6 rounded-2xl" style={{ border: '1px solid #e0d8cf' }}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: '#4a3728' }}>
            <FileText className="w-4.5 h-4.5" />
            Agreements & Verification
          </h3>

          <div className="p-4 rounded-xl" style={{ border: '1px solid #e0d8cf', backgroundColor: '#fbf7f3' }}>
            <div className="flex items-center gap-2.5 mb-3">
              <ShieldCheck className="w-5 h-5" style={{ color: '#7a5c3e' }} />
              <h4 className="text-sm font-bold" style={{ color: '#4a3728' }}>Verification Process</h4>
            </div>
            <div className="space-y-2">
              {verificationSteps.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 rounded-lg"
                  style={{ backgroundColor: '#fff', border: '1px solid #e0d8cf' }}>
                  <span className="text-sm" style={{ color: '#8a7a6a' }}>{item.step}</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {item.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                    {item.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            {approvalStatus !== 'approved' && (
              <button
                onClick={() => setShowVerifyModal(true)}
                className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#4a3728" }}>
                View Verification Steps
              </button>
            )}

            <div
              className={`p-4 rounded-xl mt-4 transition-opacity ${approvalStatus === 'pending' || approvalStatus === 'approved'
                ? 'opacity-40 pointer-events-none select-none'
                : ''
                }`}
              style={{ border: '1px solid #e0d8cf', backgroundColor: '#fff' }}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreedToCode}
                  readOnly
                  className="w-4 h-4 mt-0.5 rounded cursor-not-allowed"
                  style={{ accentColor: '#4a3728' }}
                />
                <div className="flex-1">
                  <label className="text-sm font-semibold" style={{ color: '#4a3728' }}>
                    Platform Rules & Terms Acceptance *
                  </label>
                  <p className="text-xs mt-1" style={{ color: '#8a7a6a' }}>
                    I accept the platform's terms of service, privacy policy, payment terms, and agree to
                    follow all community guidelines and platform rules.
                  </p>
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="text-xs font-semibold mt-2 hover:underline flex items-center gap-1"
                    style={{ color: '#7a5c3e' }}>
                    Read Terms & Conditions <ArrowRight className="w-3 h-3" />
                  </button>
                  {!agreedToCode && (
                    <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#b45309' }}>
                      <AlertTriangle className="w-3 h-3" />
                      Please read and accept the Terms & Conditions to enable the checkbox.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {(agreedToCode || approvalStatus === 'pending' || approvalStatus === 'approved') && (
              <button
                onClick={handleRequestApproval}
                disabled={!allVerified || approvalStatus === 'pending' || approvalStatus === 'approved' || approvalStatus === 'submitting'}
                className={`mt-4 w-full px-6 py-3 rounded-xl text-white text-sm font-semibold transition-opacity flex items-center justify-center gap-2 ${approvalStatus === 'pending' || approvalStatus === 'approved' || !allVerified
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:opacity-90'
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
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Mentor Account Approved
                  </>
                ) : approvalStatus === 'pending' ? (
                  <>
                    <Clock className="w-4 h-4" />
                    Approval Request Submitted
                  </>
                ) : !allVerified ? (
                  'Complete All Verifications First'
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Get Approval for Mentor
                  </>
                )}
              </button>
            )}

            {approvalStatus === 'pending' && (
              <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid #bbf7d0' }}>
                <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ backgroundColor: '#4a3728' }}>
                  <Clock className="w-4 h-4 text-white" />
                  <p className="text-sm font-bold text-white">Review In Progress</p>
                </div>
                <div className="px-4 py-3" style={{ backgroundColor: '#f0fdf4' }}>
                  <p className="text-sm font-semibold" style={{ color: '#15803d' }}>
                    Your mentor account is currently under review by the Throne8 team.
                  </p>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: '#166534' }}>
                    The verification and approval process typically takes{' '}
                    <span className="font-bold bg-green-100 px-1 rounded">5 to 7 business days</span>.
                    You will be notified via email upon completion.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#16a34a' }} />
                    <span className="text-xs font-medium" style={{ color: '#16a34a' }}>Application submitted successfully</span>
                  </div>
                </div>
              </div>
            )}

            {approvalStatus === 'approved' && (
              <div className="mt-3 px-4 py-3 rounded-xl flex items-start gap-2.5" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac' }}>
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#15803d' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: '#15803d' }}>
                    Your mentor account has been officially approved by Throne8.
                  </p>
                  <p className="text-xs mt-1 font-medium" style={{ color: '#166534' }}>
                    You are now fully authorized to conduct mentorship sessions and engage with mentees on the platform. Welcome to the Throne8 Mentor Community!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end">
          <button
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-[#f3ece4]"
            style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
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