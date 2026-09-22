"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight,
  Star,
  MessageCircle,
  Video,
  XCircle,
} from "lucide-react";

import SessionService from "@/lib/api/session.service";
import MentorService from "@/lib/api/mentorship.service";
import QueryModal from "./QueryModal";
import WaitlistModal from "./WaitlistModal";
import { Service } from "@/features/mentorship/types/mentorship.types";

interface ServicesSectionProps {
  onServiceClick: (service: Service) => void;
  mentorId: string;
  bookedSessionIds: string[];
  currentUserId: string;
}

const SESSION_LABELS: Record<string, string> = {
  "1-on-1": "1-on-1 Session",
  one_on_one: "1-on-1 Session",
  individual: "1-on-1 Session",
  group: "Group Session",
};

const SESSION_FILTERS = [
  "All",
  "1-on-1 Session",
  "Group Session",
];

const HIGHLIGHTS = [
  "Personalized guidance",
  "Real-world industry insights",
  "Actionable feedback",
  "Career-focused mentorship",
];

const PREP_POINTS = [
  "Keep your questions ready",
  "Share relevant context beforehand",
  "Be open to feedback",
  "Take notes during the session",
];

const btnPrimary: React.CSSProperties = {
  border: "none",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
};

const btnSecondary: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#111827",
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
};

const getGroupId = (group: any): string => {
  return String(
    group?.sessionId ||
      group?._id ||
      group?.id ||
      ""
  );
};

const getRequestStatus = (
  request: any
): "none" | "pending" | "accepted" | "rejected" => {
  const status =
    request?.status ||
    request?.request?.status ||
    request?.data?.status ||
    request?.data?.request?.status;

  if (
    status === "pending" ||
    status === "accepted" ||
    status === "rejected"
  ) {
    return status;
  }

  return "none";
};

const getSessionStartTime = (group: any): number | null => {
  const value =
    group?.scheduledAt ||
    group?.startTime ||
    group?.scheduledFor ||
    group?.startDate;

  if (!value) return null;

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) return null;

  return time;
};

const isGroupSessionJoinable = (group: any): boolean => {
  const status = String(
    group?.status || ""
  ).toLowerCase();

  if (
    status === "started" ||
    status === "live" ||
    status === "in_progress"
  ) {
    return true;
  }

  if (
    group?.isStarted === true ||
    group?.isLive === true
  ) {
    return true;
  }

  /*
   * If backend does not expose started/live status,
   * don't show Join Session before the scheduled time.
   *
   * A small 15-minute window is allowed before start.
   */
  const startTime = getSessionStartTime(group);

  if (!startTime) {
    return false;
  }

  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;

  return (
    now >= startTime - fifteenMinutes
  );
};

const getGroupMeetingUrl = (group: any): string | null => {
  return (
    group?.meetingUrl ||
    group?.meeting?.meetingUrl ||
    group?.roomUrl ||
    group?.room?.url ||
    null
  );
};

export default function ServicesSection({
  onServiceClick,
  mentorId,
  bookedSessionIds,
  currentUserId,
}: ServicesSectionProps) {
  const router = useRouter();

  const [activeFilter, setActiveFilter] =
    useState<string>("All");

  const [sessions, setSessions] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [groupSessions, setGroupSessions] =
    useState<any[]>([]);

  const [groupLoading, setGroupLoading] =
    useState(true);

  const [joiningId, setJoiningId] =
    useState<string | null>(null);

  const [joinError, setJoinError] =
    useState<string | null>(null);

  /*
   * Group join request status:
   *
   * none
   * pending
   * accepted
   * rejected
   */
  const [groupRequestStatus, setGroupRequestStatus] =
    useState<
      Record<
        string,
        "none" | "pending" | "accepted" | "rejected"
      >
    >({});

  const [queryModalOpen, setQueryModalOpen] =
    useState(false);

  const [waitlistModalOpen, setWaitlistModalOpen] =
    useState(false);

  const [selectedService, setSelectedService] =
    useState<any>(null);

  const [selectedGroup, setSelectedGroup] =
    useState<any>(null);

  const [mentor, setMentor] =
    useState<any>(null);

  /*
   * Fetch normal sessions
   */
  useEffect(() => {
    let mounted = true;

    const fetchSessions = async () => {
      setLoading(true);

      try {
        const response =
          await SessionService.getAllSessionsFromDB({
            limit: 50,
          });

        if (!mounted) return;

        const list = Array.isArray(response)
          ? response
          : response?.data ||
            response?.sessions ||
            response?.results ||
            [];

        const mentorSessions = list.filter(
          (session: any) => {
            const sessionMentorId =
              session?.mentorId ||
              session?.mentor?._id ||
              session?.mentor?.id;

            return (
              String(sessionMentorId || "") ===
              String(mentorId)
            );
          }
        );

        setSessions(mentorSessions);
      } catch (error) {
        if (mounted) {
          setSessions([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      mounted = false;
    };
  }, [mentorId]);

  /*
   * Fetch group sessions
   */
  useEffect(() => {
    let mounted = true;

    const fetchGroupSessions = async () => {
      setGroupLoading(true);
      setJoinError(null);

      try {
        const response =
          await MentorService.getAllGroupSessions({
            mentorId,
            limit: 50,
          });

        if (!mounted) return;

        const list = Array.isArray(response)
          ? response
          : response?.data ||
            response?.sessions ||
            response?.results ||
            [];

        const normalizedGroups =
          list.filter((group: any) => {
            const status = String(
              group?.status || ""
            ).toLowerCase();

            return (
              status === "open" ||
              status === "" ||
              group?.status === undefined
            );
          });

        setGroupSessions(normalizedGroups);

        /*
         * Fetch current user's request status
         * for every group session.
         */
        const requestStatuses: Record<
          string,
          "none" | "pending" | "accepted" | "rejected"
        > = {};

        await Promise.all(
          normalizedGroups.map(
            async (group: any) => {
              const groupId =
                getGroupId(group);

              if (!groupId) return;

              /*
               * First check participant data.
               * Accepted users may already be present
               * in participants.
               */
              const participant =
                Array.isArray(
                  group?.participants
                )
                  ? group.participants.find(
                      (participant: any) =>
                        String(
                          participant?.menteeId ||
                            participant?.userId ||
                            participant?.user?._id ||
                            participant?.user?.id ||
                            participant?.id ||
                            ""
                        ) ===
                        String(currentUserId)
                    )
                  : null;

              if (participant) {
                requestStatuses[groupId] =
                  "accepted";

                return;
              }

              try {
                const request =
                  await MentorService.getMyGroupJoinRequest(
                    groupId
                  );

                if (!request) {
                  requestStatuses[groupId] =
                    "none";

                  return;
                }

                requestStatuses[groupId] =
                  getRequestStatus(request);
              } catch {
                requestStatuses[groupId] =
                  "none";
              }
            }
          )
        );

        if (mounted) {
          setGroupRequestStatus(
            requestStatuses
          );
        }
      } catch (error: any) {
        if (mounted) {
          setGroupSessions([]);
          setJoinError(
            error?.message ||
              "Failed to load group sessions."
          );
        }
      } finally {
        if (mounted) {
          setGroupLoading(false);
        }
      }
    };

    fetchGroupSessions();

    return () => {
      mounted = false;
    };
  }, [mentorId, currentUserId]);

  /*
   * Fetch mentor profile
   */
  useEffect(() => {
    let mounted = true;

    const fetchMentor = async () => {
      try {
        const response =
          await MentorService.getMyMentorProfile(
            mentorId
          );

        if (mounted) {
          setMentor(response);
        }
      } catch {
        if (mounted) {
          setMentor(null);
        }
      }
    };

    if (mentorId) {
      fetchMentor();
    }

    return () => {
      mounted = false;
    };
  }, [mentorId]);

  /*
   * Join Group Request
   *
   * IMPORTANT:
   * This sends a request to mentor.
   * It does NOT directly join the group.
   */
  const handleJoinGroupSession = async (
    groupId: string
  ) => {
    if (!groupId) return;

    const currentStatus =
      groupRequestStatus[groupId];

    /*
     * Don't send duplicate requests.
     */
    if (currentStatus === "pending") {
      return;
    }

    if (currentStatus === "accepted") {
      return;
    }

    setJoinError(null);
    setJoiningId(groupId);

    try {
      await MentorService.requestToJoinGroupSession(
        groupId
      );

      /*
       * Immediately show Request Pending.
       */
      setGroupRequestStatus((prev) => ({
        ...prev,
        [groupId]: "pending",
      }));
    } catch (error: any) {
      setJoinError(
        error?.message ||
          "Failed to send join request."
      );
    } finally {
      setJoiningId(null);
    }
  };

  /*
   * Open group session room
   */
  const handleJoinSession = (
    group: any
  ) => {
    const groupId =
      getGroupId(group);

    if (!groupId) return;

    /*
     * If backend provides a direct meeting URL,
     * use it.
     */
    const meetingUrl =
      getGroupMeetingUrl(group);

    if (meetingUrl) {
      window.open(
        meetingUrl,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    /*
     * Otherwise use Throne8 session room.
     */
    router.push(
      `/mentorship/session-room/${groupId}`
    );
  };

  /*
   * Normal session click
   */
  const handleNormalSessionClick = (
    session: any
  ) => {
    onServiceClick(session as Service);
  };

  /*
   * Waitlist
   */
  const handleWaitlist = (
    service: any
  ) => {
    setSelectedService(service);
    setWaitlistModalOpen(true);
  };

  /*
   * Filter normal sessions
   */
  const filteredSessions = useMemo(() => {
    if (activeFilter === "All") {
      return sessions;
    }

    return sessions.filter(
      (session: any) => {
        const rawType =
          session?.sessionType ||
          session?.type ||
          session?.serviceType ||
          "";

        const normalized =
          SESSION_LABELS[rawType] ||
          rawType;

        return (
          normalized === activeFilter
        );
      }
    );
  }, [sessions, activeFilter]);

  const isBooked = (
    session: any
  ) => {
    const sessionId =
      session?.sessionId ||
      session?._id ||
      session?.id;

    return bookedSessionIds.includes(
      String(sessionId)
    );
  };

  return (
    <section
      style={{
        width: "100%",
        padding: "0 0 60px",
      }}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "20px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "8px",
            }}
          >
            Mentorship Services
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "28px",
              lineHeight: 1.2,
              fontWeight: 750,
              color: "#111827",
            }}
          >
            Learn directly from
            industry experience
          </h2>

          <p
            style={{
              margin: "8px 0 0",
              maxWidth: "650px",
              fontSize: "14px",
              lineHeight: 1.6,
              color: "#6b7280",
            }}
          >
            Choose a mentorship format that
            fits your goals and get practical,
            actionable guidance.
          </p>
        </div>

        <button
          onClick={() =>
            setQueryModalOpen(true)
          }
          style={{
            ...btnSecondary,
            padding: "10px 16px",
            borderRadius: "10px",
            fontSize: "13px",
          }}
        >
          <MessageCircle size={15} />
          Ask a Query
        </button>
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "28px",
        }}
      >
        {SESSION_FILTERS.map(
          (filter) => {
            const active =
              activeFilter === filter;

            return (
              <button
                key={filter}
                onClick={() =>
                  setActiveFilter(filter)
                }
                style={{
                  border: active
                    ? "1px solid #111827"
                    : "1px solid #e5e7eb",
                  background: active
                    ? "#111827"
                    : "#ffffff",
                  color: active
                    ? "#ffffff"
                    : "#4b5563",
                  padding:
                    "8px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {filter}
              </button>
            );
          }
        )}
      </div>

      {/* =====================================================
          GROUP SESSIONS
      ====================================================== */}

      {(activeFilter === "All" ||
        activeFilter ===
          "Group Session") && (
        <div
          style={{
            marginBottom: "42px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Group Sessions
              </h3>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Learn and interact with
                multiple mentees in a
                focused session.
              </p>
            </div>
          </div>

          {joinError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 14px",
                marginBottom: "14px",
                borderRadius: "10px",
                background: "#fef2f2",
                border:
                  "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "13px",
              }}
            >
              <XCircle size={15} />
              {joinError}
            </div>
          )}

          {groupLoading ? (
            <div
              style={{
                padding: "40px 20px",
                border:
                  "1px solid #e5e7eb",
                borderRadius: "16px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Loading group sessions...
            </div>
          ) : groupSessions.length ===
            0 ? (
            <div
              style={{
                padding: "40px 20px",
                border:
                  "1px solid #e5e7eb",
                borderRadius: "16px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              No group sessions available
              right now.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "18px",
              }}
            >
              {groupSessions.map(
                (group: any) => {
                  const groupId =
                    getGroupId(group);

                  const seatsLeft =
                    Math.max(
                      0,
                      (group?.maxParticipants ??
                        0) -
                        (group?.currentParticipants ??
                          group?.participants
                            ?.length ??
                          0)
                    );

                  const requestStatus =
                    groupRequestStatus[
                      groupId
                    ] || "none";

                  const isJoining =
                    joiningId === groupId;

                  const isPending =
                    requestStatus ===
                    "pending";

                  const isAccepted =
                    requestStatus ===
                    "accepted";

                  const isRejected =
                    requestStatus ===
                    "rejected";

                  const sessionJoinable =
                    isGroupSessionJoinable(
                      group
                    );

                  const pricePerPerson =
                    group?.pricing
                      ?.pricePerPerson ??
                    group?.pricePerPerson ??
                    0;

                  const scheduledAt =
                    group?.scheduledAt ||
                    group?.startTime ||
                    group?.scheduledFor;

                  return (
                    <div
                      key={groupId}
                      style={{
                        border:
                          "1px solid #e5e7eb",
                        borderRadius: "16px",
                        background:
                          "#ffffff",
                        overflow: "hidden",
                        boxShadow:
                          "0 4px 16px rgba(0,0,0,0.04)",
                      }}
                    >
                      {/* IMAGE */}

                      {group?.thumbnailImage ||
                      group?.thumbnail ||
                      group?.image ? (
                        <img
                          src={
                            group?.thumbnailImage ||
                            group?.thumbnail ||
                            group?.image
                          }
                          alt={
                            group?.title ||
                            "Group Session"
                          }
                          style={{
                            width: "100%",
                            height: "170px",
                            objectFit:
                              "cover",
                            display:
                              "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "170px",
                            background:
                              "#f3f4f6",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            color: "#9ca3af",
                          }}
                        >
                          <Users
                            size={42}
                          />
                        </div>
                      )}

                      <div
                        style={{
                          padding:
                            "18px",
                        }}
                      >
                        {/* TITLE */}

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "flex-start",
                            justifyContent:
                              "space-between",
                            gap: "10px",
                            marginBottom:
                              "8px",
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              fontSize:
                                "17px",
                              lineHeight:
                                1.35,
                              fontWeight:
                                700,
                              color:
                                "#111827",
                            }}
                          >
                            {group?.title ||
                              "Group Session"}
                          </h4>

                          <div
                            style={{
                              flexShrink: 0,
                              fontSize:
                                "11px",
                              fontWeight:
                                700,
                              padding:
                                "5px 8px",
                              borderRadius:
                                "999px",
                              background:
                                "#f3f4f6",
                              color:
                                "#374151",
                            }}
                          >
                            Group
                          </div>
                        </div>

                        {/* DESCRIPTION */}

                        <p
                          style={{
                            margin:
                              "0 0 14px",
                            fontSize:
                              "13px",
                            lineHeight:
                              1.55,
                            color:
                              "#6b7280",
                            display:
                              "-webkit-box",
                            WebkitLineClamp:
                              3,
                            WebkitBoxOrient:
                              "vertical",
                            overflow:
                              "hidden",
                          }}
                        >
                          {group?.description ||
                            group?.topic ||
                            "Interactive group mentorship session."}
                        </p>

                        {/* META */}

                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "1fr 1fr",
                            gap: "9px",
                            marginBottom:
                              "16px",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "7px",
                              fontSize:
                                "12px",
                              color:
                                "#6b7280",
                            }}
                          >
                            <Calendar
                              size={
                                14
                              }
                            />

                            <span>
                              {scheduledAt
                                ? new Date(
                                    scheduledAt
                                  ).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month:
                                        "short",
                                      year:
                                        "numeric",
                                    }
                                  )
                                : "Date TBD"}
                            </span>
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "7px",
                              fontSize:
                                "12px",
                              color:
                                "#6b7280",
                            }}
                          >
                            <Clock
                              size={
                                14
                              }
                            />

                            <span>
                              {scheduledAt
                                ? new Date(
                                    scheduledAt
                                  ).toLocaleTimeString(
                                    "en-IN",
                                    {
                                      hour:
                                        "2-digit",
                                      minute:
                                        "2-digit",
                                    }
                                  )
                                : "Time TBD"}
                            </span>
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "7px",
                              fontSize:
                                "12px",
                              color:
                                "#6b7280",
                            }}
                          >
                            <Users
                              size={
                                14
                              }
                            />

                            <span>
                              {seatsLeft}{" "}
                              seat
                              {seatsLeft ===
                              1
                                ? ""
                                : "s"}{" "}
                              left
                            </span>
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "7px",
                              fontSize:
                                "12px",
                              color:
                                "#6b7280",
                            }}
                          >
                            <Clock
                              size={
                                14
                              }
                            />

                            <span>
                              {group?.duration
                                ? `${group.duration} min`
                                : "Duration TBD"}
                            </span>
                          </div>
                        </div>

                        {/* PRICE */}

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                            marginBottom:
                              "15px",
                            paddingBottom:
                              "15px",
                            borderBottom:
                              "1px solid #f3f4f6",
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                "12px",
                              color:
                                "#6b7280",
                            }}
                          >
                            Price per person
                          </span>

                          <span
                            style={{
                              fontSize:
                                "17px",
                              fontWeight:
                                750,
                              color:
                                "#111827",
                            }}
                          >
                            {pricePerPerson >
                            0
                              ? `₹${pricePerPerson}`
                              : "Free"}
                          </span>
                        </div>

                        {/* STATUS */}

                        {isPending && (
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "8px",
                              padding:
                                "9px 11px",
                              marginBottom:
                                "12px",
                              borderRadius:
                                "10px",
                              background:
                                "#fffbeb",
                              border:
                                "1px solid #fde68a",
                              color:
                                "#92400e",
                              fontSize:
                                "12px",
                              fontWeight:
                                600,
                            }}
                          >
                            <Clock
                              size={
                                14
                              }
                            />
                            Your join request
                            is pending mentor
                            approval.
                          </div>
                        )}

                        {isAccepted &&
                          !sessionJoinable && (
                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "8px",
                                padding:
                                  "9px 11px",
                                marginBottom:
                                  "12px",
                                borderRadius:
                                  "10px",
                                background:
                                  "#ecfdf5",
                                border:
                                  "1px solid #a7f3d0",
                                color:
                                  "#047857",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  600,
                              }}
                            >
                              <CheckCircle2
                                size={
                                  14
                                }
                              />
                              You have joined
                              this group
                              session.
                            </div>
                          )}

                        {isRejected && (
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "8px",
                              padding:
                                "9px 11px",
                              marginBottom:
                                "12px",
                              borderRadius:
                                "10px",
                              background:
                                "#fef2f2",
                              border:
                                "1px solid #fecaca",
                              color:
                                "#b91c1c",
                              fontSize:
                                "12px",
                              fontWeight:
                                600,
                            }}
                          >
                            <XCircle
                              size={
                                14
                              }
                            />
                            Your previous
                            request was
                            rejected. You can
                            request again.
                          </div>
                        )}

                        {/* BUTTON */}

                        {isPending ? (
                          <button
                            disabled
                            style={{
                              width: "100%",
                              ...btnPrimary,
                              padding:
                                "10px 16px",
                              borderRadius:
                                "10px",
                              fontSize:
                                "13px",
                              opacity:
                                0.55,
                              cursor:
                                "not-allowed",
                            }}
                          >
                            <Clock
                              size={
                                15
                              }
                            />
                            Request Pending
                          </button>
                        ) : isAccepted ? (
                          sessionJoinable ? (
                            <button
                              onClick={() =>
                                handleJoinSession(
                                  group
                                )
                              }
                              style={{
                                width:
                                  "100%",
                                ...btnPrimary,
                                padding:
                                  "10px 16px",
                                borderRadius:
                                  "10px",
                                fontSize:
                                  "13px",
                              }}
                            >
                              <Video
                                size={
                                  15
                                }
                              />
                              Join Session
                              <ArrowRight
                                size={
                                  14
                                }
                              />
                            </button>
                          ) : (
                            <button
                              disabled
                              style={{
                                width:
                                  "100%",
                                ...btnSecondary,
                                padding:
                                  "10px 16px",
                                borderRadius:
                                  "10px",
                                fontSize:
                                  "13px",
                                cursor:
                                  "default",
                                opacity:
                                  0.75,
                              }}
                            >
                              <CheckCircle2
                                size={
                                  15
                                }
                              />
                              Joined
                            </button>
                          )
                        ) : seatsLeft <=
                          0 ? (
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
                              gap: "10px",
                            }}
                          >
                            <span
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#6b7280",
                                fontWeight:
                                  600,
                              }}
                            >
                              This session
                              is full.
                            </span>

                            <button
                              onClick={() =>
                                handleWaitlist(
                                  group
                                )
                              }
                              style={{
                                ...btnSecondary,
                                padding:
                                  "8px 12px",
                                borderRadius:
                                  "9px",
                                fontSize:
                                  "12px",
                              }}
                            >
                              Join Waitlist
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              handleJoinGroupSession(
                                groupId
                              )
                            }
                            disabled={
                              isJoining
                            }
                            style={{
                              width:
                                "100%",
                              ...btnPrimary,
                              padding:
                                "10px 16px",
                              borderRadius:
                                "10px",
                              fontSize:
                                "13px",
                              opacity:
                                isJoining
                                  ? 0.6
                                  : 1,
                              cursor:
                                isJoining
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {isJoining ? (
                              <>
                                <Clock
                                  size={
                                    15
                                  }
                                />
                                Sending
                                Request...
                              </>
                            ) : (
                              <>
                                <Users
                                  size={
                                    15
                                  }
                                />
                                Join Group
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          NORMAL SESSIONS
      ====================================================== */}

      {(activeFilter === "All" ||
        activeFilter ===
          "1-on-1 Session") && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                1-on-1 Sessions
              </h3>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Focused one-to-one
                mentorship based on your
                goals.
              </p>
            </div>
          </div>

          {loading ? (
            <div
              style={{
                padding: "40px 20px",
                border:
                  "1px solid #e5e7eb",
                borderRadius: "16px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Loading sessions...
            </div>
          ) : filteredSessions.length ===
            0 ? (
            <div
              style={{
                padding: "40px 20px",
                border:
                  "1px solid #e5e7eb",
                borderRadius: "16px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              No 1-on-1 sessions available
              right now.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "18px",
              }}
            >
              {filteredSessions.map(
                (session: any) => {
                  const sessionId =
                    session?.sessionId ||
                    session?._id ||
                    session?.id;

                  const booked =
                    isBooked(session);

                  const title =
                    session?.title ||
                    session?.serviceTitle ||
                    session?.name ||
                    "Mentorship Session";

                  const description =
                    session?.description ||
                    session?.shortDescription ||
                    "Personalized one-on-one mentorship session.";

                  const duration =
                    session?.duration ||
                    session?.durationMinutes;

                  const price =
                    session?.price ||
                    session?.pricing
                      ?.amount ||
                    session?.pricePerSession ||
                    0;

                  return (
                    <div
                      key={String(
                        sessionId
                      )}
                      style={{
                        border:
                          "1px solid #e5e7eb",
                        borderRadius: "16px",
                        background:
                          "#ffffff",
                        padding: "18px",
                        boxShadow:
                          "0 4px 16px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "flex-start",
                          justifyContent:
                            "space-between",
                          gap: "12px",
                          marginBottom:
                            "10px",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize:
                              "17px",
                            lineHeight:
                              1.35,
                            fontWeight:
                              700,
                            color:
                              "#111827",
                          }}
                        >
                          {title}
                        </h4>

                        <div
                          style={{
                            flexShrink: 0,
                            fontSize:
                              "11px",
                            fontWeight:
                              700,
                            padding:
                              "5px 8px",
                            borderRadius:
                              "999px",
                            background:
                              "#f3f4f6",
                            color:
                              "#374151",
                          }}
                        >
                          1-on-1
                        </div>
                      </div>

                      <p
                        style={{
                          margin:
                            "0 0 16px",
                          fontSize:
                            "13px",
                          lineHeight:
                            1.55,
                          color:
                            "#6b7280",
                          display:
                            "-webkit-box",
                          WebkitLineClamp:
                            3,
                          WebkitBoxOrient:
                            "vertical",
                          overflow:
                            "hidden",
                        }}
                      >
                        {description}
                      </p>

                      <div
                        style={{
                          display:
                            "flex",
                          flexDirection:
                            "column",
                          gap: "9px",
                          marginBottom:
                            "17px",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                            fontSize:
                              "12px",
                            color:
                              "#6b7280",
                          }}
                        >
                          <Clock
                            size={14}
                          />
                          {duration
                            ? `${duration} minutes`
                            : "Flexible duration"}
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                            fontSize:
                              "12px",
                            color:
                              "#6b7280",
                          }}
                        >
                          <Star
                            size={14}
                          />
                          Personalized
                          mentorship
                        </div>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          marginBottom:
                            "15px",
                          paddingBottom:
                            "15px",
                          borderBottom:
                            "1px solid #f3f4f6",
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#6b7280",
                          }}
                        >
                          Session price
                        </span>

                        <span
                          style={{
                            fontSize:
                              "17px",
                            fontWeight:
                              750,
                            color:
                              "#111827",
                          }}
                        >
                          {price > 0
                            ? `₹${price}`
                            : "Free"}
                        </span>
                      </div>

                      {booked ? (
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            gap: "7px",
                            width:
                              "100%",
                            padding:
                              "10px 16px",
                            borderRadius:
                              "10px",
                            background:
                              "#ecfdf5",
                            border:
                              "1px solid #a7f3d0",
                            color:
                              "#047857",
                            fontSize:
                              "13px",
                            fontWeight:
                              650,
                          }}
                        >
                          <CheckCircle2
                            size={
                              15
                            }
                          />
                          Already Booked
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            handleNormalSessionClick(
                              session
                            )
                          }
                          style={{
                            width:
                              "100%",
                            ...btnPrimary,
                            padding:
                              "10px 16px",
                            borderRadius:
                              "10px",
                            fontSize:
                              "13px",
                          }}
                        >
                          Book Session
                          <ArrowRight
                            size={
                              14
                            }
                          />
                        </button>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          HIGHLIGHTS
      ====================================================== */}

      <div
        style={{
          marginTop: "42px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {HIGHLIGHTS.map(
          (highlight) => (
            <div
              key={highlight}
              style={{
                padding:
                  "14px 16px",
                border:
                  "1px solid #e5e7eb",
                borderRadius:
                  "12px",
                background:
                  "#ffffff",
                fontSize:
                  "13px",
                fontWeight:
                  600,
                color:
                  "#374151",
              }}
            >
              <CheckCircle2
                size={15}
                style={{
                  verticalAlign:
                    "middle",
                  marginRight:
                    "7px",
                }}
              />
              {highlight}
            </div>
          )
        )}
      </div>

      {/* =====================================================
          PREPARATION
      ====================================================== */}

      <div
        style={{
          marginTop: "28px",
          padding: "20px",
          borderRadius: "16px",
          background: "#f9fafb",
          border:
            "1px solid #e5e7eb",
        }}
      >
        <h3
          style={{
            margin:
              "0 0 12px",
            fontSize:
              "16px",
            fontWeight:
              700,
            color:
              "#111827",
          }}
        >
          How to prepare
        </h3>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "10px",
          }}
        >
          {PREP_POINTS.map(
            (point) => (
              <div
                key={point}
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "8px",
                  fontSize:
                    "13px",
                  color:
                    "#6b7280",
                }}
              >
                <CheckCircle2
                  size={14}
                />
                {point}
              </div>
            )
          )}
        </div>
      </div>

      {/* =====================================================
          QUERY MODAL
      ====================================================== */}

      {queryModalOpen && (
        <QueryModal
          mentorId={mentorId}
          mentor={mentor}
          onClose={() =>
            setQueryModalOpen(false)
          }
        />
      )}

      {/* =====================================================
          WAITLIST MODAL
      ====================================================== */}

      {waitlistModalOpen &&
        selectedService && (
          <WaitlistModal
            mentorId={mentorId}
            serviceId={
              selectedService?.sessionId ||
              selectedService?._id ||
              selectedService?.id
            }
            serviceTitle={
              selectedService?.title ||
              selectedService?.serviceTitle ||
              "Group Session"
            }
            onClose={() => {
              setWaitlistModalOpen(false);
              setSelectedService(null);
            }}
          />
        )}
    </section>
  );
}