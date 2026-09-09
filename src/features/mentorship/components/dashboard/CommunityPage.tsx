// mentorDashboard/components/CommunityPage.tsx
import React from "react"
import { Star, Users, Calendar, MessageCircle, TrendingUp } from "lucide-react"

const COLORS = {
  ink: "#4a3728",
  accent: "#7a5c3e",
  hairline: "#e0d8cf",
  chip: "#f3ece4",
  softWash: "#fbf7f3",
  muted: "#8a7a6a",
}

const forums = [
  { topic: "Best Practices for Mentoring", replies: 12, time: "2 hours ago" },
  { topic: "How to Handle Difficult Students", replies: 23, time: "5 hours ago" },
  { topic: "Pricing Strategies", replies: 18, time: "1 day ago" },
  { topic: "Building Your Personal Brand", replies: 31, time: "2 days ago" },
]

const topMentors = [
  { name: "Dr. Sharma", field: "Data Science", rating: 4.9, sessions: 250 },
  { name: "Prof. Gupta", field: "Machine Learning", rating: 4.8, sessions: 180 },
  { name: "Ms. Patel", field: "Web Development", rating: 4.8, sessions: 200 },
  { name: "Mr. Khan", field: "Mobile Development", rating: 4.7, sessions: 150 },
]

const communityEvents = [
  { title: "Mentor Meet & Greet", date: "Jan 28, 2026", participants: 45 },
  { title: "Best Practices Workshop", date: "Feb 2, 2026", participants: 32 },
  { title: "Networking Session", date: "Feb 10, 2026", participants: 28 },
]

export default function CommunityPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.ink }}>
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: COLORS.ink }}>
            Community
          </h2>
          <p style={{ color: COLORS.muted }} className="text-sm">
            Connect with other mentors
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Discussion Forums */}
        <div className="bg-white p-6 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: COLORS.ink }}>
              Discussion Forums
            </h3>
            <span className="text-xs font-semibold" style={{ color: "#a08070" }}>
              {forums.length} active
            </span>
          </div>
          <div className="space-y-3">
            {forums.map((forum, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors hover:border-[#c9baa9]"
                style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: COLORS.chip }}
                >
                  <MessageCircle className="w-4 h-4" style={{ color: COLORS.accent }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                    {forum.topic}
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                    {forum.replies} replies · {forum.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Mentors */}
        <div className="bg-white p-6 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold" style={{ color: COLORS.ink }}>
              Top Mentors
            </h3>
            <TrendingUp className="w-4 h-4" style={{ color: COLORS.accent }} />
          </div>
          <div className="space-y-3">
            {topMentors.map((mentor, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl transition-colors hover:border-[#c9baa9]"
                style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: COLORS.ink }}
                  >
                    {mentor.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: COLORS.ink }}>
                      {mentor.name}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.muted }}>
                      {mentor.field} · {mentor.sessions} sessions
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS.chip }}
                >
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  <span className="text-sm font-bold" style={{ color: COLORS.ink }}>
                    {mentor.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white p-6 rounded-2xl" style={{ border: `1px solid ${COLORS.hairline}` }}>
        <h3 className="text-base font-bold mb-5" style={{ color: COLORS.ink }}>
          Upcoming Community Events
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {communityEvents.map((event, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl transition-colors hover:border-[#c9baa9]"
              style={{ border: `1px solid ${COLORS.hairline}`, backgroundColor: COLORS.softWash }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: COLORS.chip }}
              >
                <Calendar className="w-4.5 h-4.5" style={{ color: COLORS.accent }} />
              </div>
              <h4 className="text-sm font-bold mb-1.5" style={{ color: COLORS.ink }}>
                {event.title}
              </h4>
              <p className="text-xs mb-3" style={{ color: COLORS.muted }}>
                {event.date}
              </p>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" style={{ color: COLORS.accent }} />
                <span className="text-xs font-semibold" style={{ color: COLORS.accent }}>
                  {event.participants} attending
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}