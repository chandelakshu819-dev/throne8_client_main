"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react";

import { useAppDispatch } from "@/core/store/store.hooks";
import {
  joinGroupThunk,
  validateInviteCodeThunk,
} from "@/hooks/studyGroup/features/groups/group.thunks";

/**
 * Invite landing page: /invite/:code
 * A valid invite lets the user join a (private) study group directly,
 * without waiting for the leader's approval.
 */
export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [status, setStatus] = useState<"checking" | "valid" | "joining" | "joined" | "error">(
    "checking"
  );
  const [groupId, setGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!code) return;
    dispatch(validateInviteCodeThunk(code))
      .unwrap()
      .then((res: any) => {
        setGroupId(res.groupId);
        setStatus("valid");
      })
      .catch((err: any) => {
        setError(typeof err === "string" ? err : err?.message || "Invalid invite link");
        setStatus("error");
      });
  }, [code, dispatch]);

  const handleJoin = async () => {
    if (!groupId || !code) return;
    setStatus("joining");
    setError("");
    try {
      await dispatch(joinGroupThunk({ groupId, inviteCode: code })).unwrap();
      setStatus("joined");
      setTimeout(() => router.push("/study/my-groups"), 1200);
    } catch (err: any) {
      const msg = typeof err === "string" ? err : err?.message || "Failed to join group";
      setError(msg);
      setStatus(msg.toLowerCase().includes("already") ? "joined" : "valid");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f3ee] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-[#e0d8cf] w-full max-w-md p-8 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-[#8b7355] to-[#6b5847] flex items-center justify-center">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-bold text-[#4a3728]">Study Group Invitation</h1>

        {status === "checking" && (
          <div className="flex items-center justify-center gap-2 text-[#8b7355]">
            <Loader2 className="w-5 h-5 animate-spin" /> Checking invite…
          </div>
        )}

        {(status === "valid" || status === "joining") && (
          <>
            <p className="text-sm text-[#6b5847]">
              You&apos;ve been invited to join a study group. Accepting this invite lets you in
              right away — no approval needed.
            </p>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={status === "joining"}
              className="w-full bg-gradient-to-r from-[#8b7355] to-[#6b5847] hover:from-[#6b5847] hover:to-[#4a3728] disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm shadow-lg transition-all"
            >
              {status === "joining" ? "Joining…" : "Join Group"}
            </button>
            {error.toLowerCase().includes("session expired") && (
              <Link href="/login" className="block text-sm text-[#8b7355] underline">
                Log in to continue
              </Link>
            )}
          </>
        )}

        {status === "joined" && (
          <div className="space-y-2">
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
            <p className="text-[#4a3728] font-semibold">You&apos;re in! Redirecting to your groups…</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm text-red-600">{error}</p>
            <Link href="/study" className="block text-sm text-[#8b7355] underline">
              Browse study groups
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
