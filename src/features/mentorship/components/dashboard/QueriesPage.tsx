// mentorDashboard/components/QueriesPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  X,
  MessageSquareReply,
} from "lucide-react";
import QueryService, { QueryItem } from "@/lib/api/query.service";
import ProfileService from "@/lib/api/profile.service";

interface QueriesPageProps {
  mentorData: any;
}

// The backend doesn't guarantee mentee enrichment on the mentor-side list yet
// (only the mentee-side response is confirmed to enrich `mentor`) — this
// type documents that `mentee` is a best-effort field, same spirit as
// BookingsPage's fallback chain for menteeName.
type MentorQueryItem = QueryItem & {
  mentee?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    profilePhotoId?: string | null;
  };
};

type QueryTab = "all" | "pending" | "answered" | "expired";

const tabMeta: Record<QueryTab, { label: string; icon: React.ElementType }> = {
  all: { label: "All", icon: HelpCircle },
  pending: { label: "Pending", icon: Clock },
  answered: { label: "Answered", icon: CheckCircle2 },
  expired: { label: "Expired", icon: XCircle },
};

const statPalette: Record<string, { bg: string; fg: string }> = {
  amber: { bg: "#fef3c7", fg: "#b45309" },
  green: { bg: "#dcfce7", fg: "#15803d" },
  gray: { bg: "#f3ece4", fg: "#7a5c3e" },
  blue: { bg: "#dbeafe", fg: "#1d4ed8" },
};

const statusBadge: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#fef3c7", fg: "#b45309", label: "Pending" },
  answered: { bg: "#dcfce7", fg: "#15803d", label: "Answered" },
  expired: { bg: "#f3ece4", fg: "#8a7a6a", label: "Expired" },
};

export default function QueriesPage({ mentorData }: QueriesPageProps) {
  const [queryTab, setQueryTab] = useState<QueryTab>("all");
  const [queries, setQueries] = useState<MentorQueryItem[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Answer modal — shared for both a fresh query and a follow-up answer
  const [answerTarget, setAnswerTarget] = useState<{ queryId: string; isFollowUp: boolean } | null>(null);
  const [answerText, setAnswerText] = useState("");

  const fetchQueries = () => {
    setLoadingData(true);
    return QueryService.getAllQueries({ role: "mentor", limit: 50 })
      .then((res) => {
        setQueries((res.data ?? []) as MentorQueryItem[]);
      })
      .catch((err) => {
        console.error("Failed to fetch queries:", err);
        setQueries([]);
      })
      .finally(() => setLoadingData(false));
  };

  useEffect(() => {
    fetchQueries();
  }, [mentorData?.mentorId]);

  useEffect(() => {
    const mappings = queries
      .filter((q) => q.menteeId && q.mentee?.profilePhotoId && !photoUrls[q.menteeId])
      .map((q) => ({ menteeId: q.menteeId, photoId: q.mentee!.profilePhotoId as string }));

    const uniqueMappings = Array.from(new Map(mappings.map((m) => [m.menteeId, m])).values());

    if (uniqueMappings.length > 0) {
      Promise.all(
        uniqueMappings.map((m) =>
          ProfileService.getProfilePhotoById(m.photoId)
            .then((res: any) => ({ id: m.menteeId, url: res?.data?.photo?.cloudinarySecureUrl }))
            .catch(() => ({ id: m.menteeId, url: null }))
        )
      ).then((results) => {
        setPhotoUrls((prev) => {
          const newMap = { ...prev };
          results.forEach(({ id, url }) => {
            if (url) newMap[id] = url;
          });
          return newMap;
        });
      });
    }
  }, [queries]);

  const menteeName = (q: MentorQueryItem) => {
    if (q.mentee?.fullName) return q.mentee.fullName;
    const combined = `${q.mentee?.firstName ?? ""} ${q.mentee?.lastName ?? ""}`.trim();
    return combined || "Student";
  };

  const pendingQueries = queries.filter((q) => q.status === "pending");
  const answeredQueries = queries.filter((q) => q.status === "answered");
  const expiredQueries = queries.filter((q) => q.status === "expired");

  const getCurrentQueries = () => {
    switch (queryTab) {
      case "pending": return pendingQueries;
      case "answered": return answeredQueries;
      case "expired": return expiredQueries;
      default: return queries;
    }
  };

  const currentQueries = useMemo(() => {
    const base = getCurrentQueries();
    if (!searchQuery.trim()) return base;
    const q = searchQuery.trim().toLowerCase();
    return base.filter(
      (item) =>
        menteeName(item).toLowerCase().includes(q) ||
        item.question?.toLowerCase().includes(q)
    );
  }, [queryTab, queries, searchQuery]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const openAnswerModal = (queryId: string, isFollowUp: boolean) => {
    setAnswerTarget({ queryId, isFollowUp });
    setAnswerText("");
  };

  const closeAnswerModal = () => {
    setAnswerTarget(null);
    setAnswerText("");
  };

  const handleAnswerSubmit = async () => {
    if (!answerTarget || !answerText.trim()) return;
    setActionLoading(answerTarget.queryId);
    try {
      if (answerTarget.isFollowUp) {
        await QueryService.answerFollowUp(answerTarget.queryId, answerText.trim());
      } else {
        await QueryService.answerQuery(answerTarget.queryId, answerText.trim());
      }
      closeAnswerModal();
      await fetchQueries();
      setQueryTab("answered");
    } catch (err: any) {
      alert(err.message || "Failed to submit answer.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#4a3728" }}>
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#4a3728" }}>Queries</h2>
            <p style={{ color: "#8a7a6a" }} className="text-sm">Text questions from your mentees</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {showSearch && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
              <Search className="w-4 h-4" style={{ color: "#8a7a6a" }} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or question..."
                className="bg-transparent outline-none text-sm w-48"
                style={{ color: "#4a3728" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-3.5 h-3.5" style={{ color: "#8a7a6a" }} />
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => { setShowSearch((v) => !v); if (showSearch) setSearchQuery(""); }}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors hover:bg-[#f3ece4]"
            style={{ backgroundColor: showSearch ? "#f3ece4" : "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: pendingQueries.length, icon: Clock, palette: "amber" },
          { label: "Answered", value: answeredQueries.length, icon: CheckCircle2, palette: "green" },
          { label: "Expired", value: expiredQueries.length, icon: XCircle, palette: "gray" },
          { label: "Total", value: queries.length, icon: HelpCircle, palette: "blue" },
        ].map((stat, idx) => {
          const c = statPalette[stat.palette];
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl" style={{ border: "1px solid #e0d8cf" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: c.bg }}>
                <stat.icon className="w-4.5 h-4.5" style={{ color: c.fg }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: "#4a3728" }}>{stat.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "#8a7a6a" }}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white p-1.5 rounded-2xl overflow-x-auto" style={{ border: "1px solid #e0d8cf" }}>
        <div className="flex gap-1.5 min-w-max">
          {(["all", "pending", "answered", "expired"] as const).map((tab) => {
            const count = tab === "all" ? queries.length :
              tab === "pending" ? pendingQueries.length :
                tab === "answered" ? answeredQueries.length : expiredQueries.length;
            const { label, icon: Icon } = tabMeta[tab];
            const isActive = queryTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setQueryTab(tab)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150"
                style={{ backgroundColor: isActive ? "#4a3728" : "transparent", color: isActive ? "#fff" : "#7a5c3e" }}
              >
                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "#f3ece4", color: isActive ? "#fff" : "#7a5c3e" }}
                  >
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #e0d8cf" }}>
        {loadingData ? (
          <div className="flex items-center justify-center py-16" style={{ color: "#8a7a6a" }}>
            <Clock className="w-5 h-5 animate-spin mr-3" />
            <span className="text-sm font-semibold">Loading queries...</span>
          </div>
        ) : currentQueries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: "#8a7a6a" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#f3ece4" }}>
              <HelpCircle className="w-6 h-6" style={{ color: "#a08070" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "#4a3728" }}>
              {searchQuery ? "No matching queries" : `No ${queryTab === "all" ? "" : queryTab} queries yet`}
            </p>
            <p className="text-xs mt-1">{searchQuery ? "Try a different search" : "Queries from mentees will show up here"}</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#f0ebe4" }}>
            {currentQueries.map((q) => {
              const resolvedPhoto = q.menteeId ? photoUrls[q.menteeId] : null;
              const sb = statusBadge[q.status] ?? statusBadge.pending;
              const needsFollowUpAnswer = q.status === "answered" && q.followUp?.askedAt && !q.followUp?.answeredAt;

              return (
                <div key={q.queryId} className="p-5 flex gap-4 transition-colors hover:bg-[#fbf7f3]">
                  {resolvedPhoto ? (
                    <img src={resolvedPhoto} alt={menteeName(q)} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: "#4a3728" }}
                    >
                      {menteeName(q)[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <span className="text-sm font-semibold" style={{ color: "#4a3728" }}>{menteeName(q)}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: sb.bg, color: sb.fg }}
                        >
                          {sb.label}
                        </span>
                        <span className="text-xs" style={{ color: "#8a7a6a" }}>{formatDate(q.createdAt)}</span>
                      </div>
                    </div>

                    <p className="text-sm mb-2" style={{ color: "#5c4a3a" }}>{q.question}</p>
                    {q.context && (
                      <p className="text-xs mb-2 italic" style={{ color: "#8a7a6a" }}>Context: {q.context}</p>
                    )}

                    {q.answer && (
                      <div className="rounded-xl p-3 mb-2" style={{ backgroundColor: "#fbf7f3", border: "1px solid #e0d8cf" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "#15803d" }}>Your answer</p>
                        <p className="text-sm" style={{ color: "#4a3728" }}>{q.answer}</p>
                      </div>
                    )}

                    {q.followUp?.question && (
                      <div className="rounded-xl p-3 mb-2" style={{ backgroundColor: "#f3ece4" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "#7a5c3e" }}>Follow-up question</p>
                        <p className="text-sm mb-2" style={{ color: "#4a3728" }}>{q.followUp.question}</p>
                        {q.followUp.answer && (
                          <>
                            <p className="text-xs font-semibold mb-1" style={{ color: "#15803d" }}>Your answer</p>
                            <p className="text-sm" style={{ color: "#4a3728" }}>{q.followUp.answer}</p>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      {q.status === "pending" && (
                        <button
                          onClick={() => openAnswerModal(q.queryId, false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: "#4a3728" }}
                        >
                          <MessageSquareReply className="w-3.5 h-3.5" /> Answer
                        </button>
                      )}
                      {needsFollowUpAnswer && (
                        <button
                          onClick={() => openAnswerModal(q.queryId, true)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: "#7a5c3e" }}
                        >
                          <MessageSquareReply className="w-3.5 h-3.5" /> Answer Follow-up
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Answer Modal */}
      {answerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4" style={{ border: "1px solid #e0d8cf" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#4a3728" }}>
              {answerTarget.isFollowUp ? "Answer Follow-up" : "Answer Query"}
            </h3>
            <textarea
              autoFocus
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer..."
              rows={5}
              className="w-full rounded-lg p-3 outline-none text-sm resize-vertical"
              style={{ border: "1px solid #e0d8cf", backgroundColor: "#fbf7f3", color: "#4a3728" }}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: "#fbf7f3", color: "#7a5c3e", border: "1px solid #e0d8cf" }}
                onClick={closeAnswerModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: "#4a3728" }}
                onClick={handleAnswerSubmit}
                disabled={!answerText.trim() || actionLoading === answerTarget.queryId}
              >
                {actionLoading === answerTarget.queryId ? "Submitting..." : "Submit Answer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}