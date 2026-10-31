// mentorDashboard/components/PlansPage.tsx
"use client"

import React, { useCallback, useEffect, useState } from "react"
import {
  Award,
  CheckCircle,
  Sparkles,
  Lock,
  Bell,
  BellRing,
  X,
  Check,
  Minus,
  ChevronDown,
  Rocket,
  Zap,
  Building2,
  Crown,
  ArrowRight,
  Info,
} from "lucide-react"

const NOTIFY_KEY = "throne8_premium_notify"

type BillingCycle = "monthly" | "yearly"

interface Feature {
  title: string
  desc: string
}

interface Plan {
  id: string
  name: string
  monthly: number
  yearly: number
  tagline: string
  bestFor: string
  popular: boolean
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  features: Feature[]
}

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    monthly: 999,
    yearly: 799,
    tagline: "Mentoring shuru karne ke liye",
    bestFor: "Naye mentors jo abhi apna mentee base bana rahe hain",
    popular: false,
    icon: Rocket,
    features: [
      {
        title: "Up to 10 sessions/month",
        desc: "Har mahine maximum 10 one-to-one ya group sessions host kar sakte ho.",
      },
      {
        title: "Basic analytics",
        desc: "Total bookings, completed sessions aur average rating ka simple overview.",
      },
      {
        title: "Email support",
        desc: "Support team se email par madad, 48 ghante ke andar reply.",
      },
      {
        title: "Profile listing",
        desc: "Tumhari profile mentor discovery list mein dikhegi.",
      },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 2499,
    yearly: 1999,
    tagline: "Serious mentors ke liye best value",
    bestFor: "Active mentors jo regular sessions aur zyada visibility chahte hain",
    popular: true,
    icon: Zap,
    features: [
      {
        title: "Unlimited sessions",
        desc: "Sessions ki koi monthly limit nahi. Jitne chaho utne host karo.",
      },
      {
        title: "Advanced analytics",
        desc: "Profile views, conversion, repeat mentees aur earnings trends ke detailed charts.",
      },
      {
        title: "Priority support",
        desc: "Chat aur email par fast response, 12 ghante ke andar reply.",
      },
      {
        title: "Marketing tools",
        desc: "Shareable profile card, promo graphics aur social media ready assets.",
      },
      {
        title: "Featured listing",
        desc: "Discovery page par highlighted placement, zyada mentees tak pahunch.",
      },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: 4999,
    yearly: 3999,
    tagline: "Teams aur established mentors ke liye",
    bestFor: "Bade mentors, academies aur teams jo apna brand scale karna chahte hain",
    popular: false,
    icon: Building2,
    features: [
      {
        title: "Everything in Pro",
        desc: "Pro plan ke saare features pehle se included hain.",
      },
      {
        title: "Custom branding",
        desc: "Apni profile aur booking page par apna logo aur brand colors lagao.",
      },
      {
        title: "API access",
        desc: "Apne tools aur website ko Throne8 se connect karne ke liye API keys.",
      },
      {
        title: "Dedicated manager",
        desc: "Ek personal account manager jo onboarding aur growth mein help kare.",
      },
      {
        title: "Premium badge",
        desc: "Profile par special badge jo trust aur authority dikhata hai.",
      },
    ],
  },
]

const COMPARISON_ROWS: { label: string; values: (string | boolean)[] }[] = [
  { label: "Sessions per month", values: ["10", "Unlimited", "Unlimited"] },
  { label: "Analytics", values: ["Basic", "Advanced", "Advanced"] },
  { label: "Support", values: ["Email", "Priority", "Dedicated manager"] },
  { label: "Profile listing", values: [true, true, true] },
  { label: "Featured listing", values: [false, true, true] },
  { label: "Marketing tools", values: [false, true, true] },
  { label: "Custom branding", values: [false, false, true] },
  { label: "API access", values: [false, false, true] },
  { label: "Premium badge", values: [false, false, true] },
]

const PREMIUM_GROUPS: { title: string; items: string[] }[] = [
  {
    title: "Mentor growth",
    items: [
      "Custom pricing per session",
      "Monthly mentorship club for mentees",
      "Digital products store",
      "Auto payout scheduling",
      "Revenue forecasting dashboard",
      "Referral program",
    ],
  },
  {
    title: "Session experience",
    items: [
      "Session recording with auto-transcript",
      "AI session notes and summaries",
      "Shared whiteboard and code editor",
      "Session templates and agendas",
      "Goal tracking and milestones",
    ],
  },
  {
    title: "Visibility and branding",
    items: [
      "Top of search listing",
      "Custom profile URL",
      "Intro video on profile",
      "Testimonial wall",
    ],
  },
  {
    title: "Automation and trust",
    items: [
      "Automated follow-up messages",
      "Bulk messaging and announcements",
      "Mentee CRM with private notes",
      "Advanced conversion analytics",
      "Priority dispute resolution",
    ],
  },
]

const PREMIUM_HIGHLIGHTS = [
  "Custom pricing per session",
  "Mentee CRM with private notes",
  "AI session notes and summaries",
  "Top of search listing",
  "Custom profile URL",
  "Revenue forecasting dashboard",
  "Auto payout scheduling",
  "Priority dispute resolution",
]

const FAQS = [
  {
    q: "Can I change my plan later?",
    a: "Yes. You can upgrade or downgrade at any time. A downgrade takes effect from the next billing cycle, while an upgrade becomes active immediately.",
  },
  {
    q: "How much do I save with yearly billing?",
    a: "Choosing the yearly plan saves you 20% compared to the monthly price. The full year's amount is billed at once.",
  },
  {
    q: "When will the Premium plan launch?",
    a: "Premium is currently in development. Click Notify Me and you will be the first to know when it launches.",
  },
]

const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`

export default function PlansPage() {
  const [billing, setBilling] = useState<BillingCycle>("monthly")
  const [activePlan, setActivePlan] = useState<Plan | null>(null)
  const [premiumOpen, setPremiumOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [notified, setNotified] = useState(false)
  const [justToggled, setJustToggled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const modalOpen = activePlan !== null || premiumOpen

  useEffect(() => {
    try {
      setNotified(localStorage.getItem(NOTIFY_KEY) === "1")
    } catch {
      // storage unavailable
    }
  }, [])

  const closeModals = useCallback(() => {
    setActivePlan(null)
    setPremiumOpen(false)
  }, [])

  // Escape close + body scroll lock
  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModals()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [modalOpen, closeModals])

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 5000)
    return () => clearTimeout(t)
  }, [banner])

  const handleNotify = () => {
    const next = !notified
    setNotified(next)
    setJustToggled(true)
    try {
      if (next) localStorage.setItem(NOTIFY_KEY, "1")
      else localStorage.removeItem(NOTIFY_KEY)
    } catch {
      // storage unavailable
    }
    // TODO: yahan premium waitlist ka backend API call add karo
    setTimeout(() => setJustToggled(false), 4000)
  }

  const handleChoose = (plan: Plan) => {
    setSelectedPlanId(plan.id)
    setActivePlan(null)
    setBanner(
      `${plan.name} plan select ho gaya (${formatINR(
        billing === "monthly" ? plan.monthly : plan.yearly
      )}/mo, ${billing}). Payment flow jald hi connect hoga.`
    )
    // TODO: yahan payment / subscription API call add karo
  }

  const keyActivate =
    (fn: () => void) => (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        fn()
      }
    }

  const priceOf = (p: Plan) => (billing === "monthly" ? p.monthly : p.yearly)

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg"
            style={{ backgroundColor: "#4a3728" }}
          >
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold" style={{ color: "#4a3728" }}>
              Subscription Plans
            </h2>
            <p style={{ color: "#8a7a6a" }} className="text-sm">
              Choose the best plan for you
            </p>
          </div>
        </div>

        {/* Billing toggle */}
        <div
          className="inline-flex items-center rounded-full border-2 bg-white p-1 shadow-md"
          style={{ borderColor: "#e0d8cf" }}
          role="tablist"
          aria-label="Billing cycle"
        >
          {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => {
            const active = billing === cycle
            return (
              <button
                key={cycle}
                role="tab"
                aria-selected={active}
                onClick={() => setBilling(cycle)}
                className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold capitalize transition-all duration-300"
                style={{
                  backgroundColor: active ? "#4a3728" : "transparent",
                  color: active ? "#ffffff" : "#7a5c3e",
                }}
              >
                {cycle}
                {cycle === "yearly" && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{
                      backgroundColor: active ? "#c9a97a" : "#f1e4d0",
                      color: active ? "#3a2a1c" : "#7a5c3e",
                    }}
                  >
                    Save 20%
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected plan banner */}
      {banner && (
        <div
          className="flex items-start justify-between gap-3 rounded-xl border-2 px-5 py-4 shadow-md"
          style={{ borderColor: "#c9a97a", backgroundColor: "#fffaf3" }}
          role="status"
        >
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: "#7a5c3e" }} />
            <p className="text-sm font-medium" style={{ color: "#4a3728" }}>
              {banner}
            </p>
          </div>
          <button
            onClick={() => setBanner(null)}
            aria-label="Dismiss"
            className="flex-shrink-0 rounded-md p-1 transition-colors hover:bg-[#f1e4d0]"
          >
            <X className="h-4 w-4" style={{ color: "#7a5c3e" }} />
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isSelected = selectedPlanId === plan.id
          return (
            <div
              key={plan.id}
              role="button"
              tabIndex={0}
              aria-label={`${plan.name} plan details`}
              onClick={() => setActivePlan(plan)}
              onKeyDown={keyActivate(() => setActivePlan(plan))}
              className={`
                group relative flex cursor-pointer flex-col rounded-2xl border-2 bg-white p-8 shadow-xl outline-none
                transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-[#c9a97a]/50
                ${plan.popular ? "border-[#4a3728] md:scale-105" : "border-[#e0d8cf] hover:border-[#c9a97a]"}
                ${isSelected ? "ring-4 ring-[#c9a97a]/60" : ""}
              `}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span
                    className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-lg"
                    style={{ backgroundColor: "#4a3728" }}
                  >
                    Most Popular
                  </span>
                </div>
              )}

              {isSelected && (
                <div
                  className="absolute right-4 top-4 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ backgroundColor: "#e7f4ea", color: "#2f7a43" }}
                >
                  <Check className="h-3 w-3" />
                  Selected
                </div>
              )}

              <div className="mb-6 text-center">
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: plan.popular ? "#4a3728" : "#f6ebdc" }}
                >
                  <Icon
                    className="h-6 w-6"
                    style={{ color: plan.popular ? "#ffffff" : "#7a5c3e" }}
                  />
                </div>
                <h3 className="mb-1 text-2xl font-bold" style={{ color: "#4a3728" }}>
                  {plan.name}
                </h3>
                <p className="mb-4 text-xs" style={{ color: "#8a7a6a" }}>
                  {plan.tagline}
                </p>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold" style={{ color: "#7a5c3e" }}>
                    {formatINR(priceOf(plan))}
                  </span>
                  <span className="ml-1 text-lg" style={{ color: "#8a7a6a" }}>
                    /mo
                  </span>
                </div>
                {billing === "yearly" ? (
                  <p className="mt-1 text-xs font-medium" style={{ color: "#2f7a43" }}>
                    Billed {formatINR(plan.yearly * 12)}/year, you save{" "}
                    {formatINR((plan.monthly - plan.yearly) * 12)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs" style={{ color: "#8a7a6a" }}>
                    Billed monthly
                  </p>
                )}
              </div>

              <ul className="mb-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f.title} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-sm" style={{ color: "#8a7a6a" }}>
                      {f.title}
                    </span>
                  </li>
                ))}
              </ul>

              <div
                className="mb-4 flex items-center justify-center gap-1 text-xs font-semibold transition-all duration-300 group-hover:gap-2"
                style={{ color: "#7a5c3e" }}
              >
                View full details
                <ArrowRight className="h-3.5 w-3.5" />
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleChoose(plan)
                }}
                className={`
                  w-full rounded-xl py-3 font-bold shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                  ${
                    plan.popular
                      ? "bg-[#4a3728] text-white"
                      : "border-2 border-[#e0d8cf] bg-[#fbf7f3] text-[#7a5c3e]"
                  }
                `}
              >
                {isSelected ? `${plan.name} Selected` : `Choose ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Premium - Coming Soon (clickable) */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Premium plan details"
        onClick={() => setPremiumOpen(true)}
        onKeyDown={keyActivate(() => setPremiumOpen(true))}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-8 shadow-xl outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-[#c9a97a]/50"
        style={{
          borderColor: "#c9a97a",
          background: "linear-gradient(135deg, #fffaf3 0%, #f6ebdc 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
          style={{ backgroundColor: "#c9a97a" }}
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl shadow-md transition-transform duration-300 group-hover:rotate-6"
                style={{ backgroundColor: "#7a5c3e" }}
              >
                <Crown className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold" style={{ color: "#4a3728" }}>
                Premium
              </h3>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: "#4a3728" }}
              >
                <Lock className="h-3 w-3" />
                Coming Soon
              </span>
            </div>

            <p className="mb-5 max-w-xl text-sm" style={{ color: "#8a7a6a" }}>
              Grow faster with tools built for serious mentors. Premium abhi live nahi hai,
              lekin 20 naye features ke saath aa raha hai. Poori list dekhne ke liye card par
              click karo.
            </p>

            <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {PREMIUM_HIGHLIGHTS.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#b08d5b" }} />
                  <span className="text-sm" style={{ color: "#6b5a4a" }}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div
              className="mt-5 flex items-center gap-1 text-xs font-semibold transition-all duration-300 group-hover:gap-2"
              style={{ color: "#7a5c3e" }}
            >
              See all 20 Premium features
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-3 lg:w-72">
            <div className="text-center">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#8a7a6a" }}
              >
                Pricing
              </p>
              <p className="text-3xl font-bold" style={{ color: "#7a5c3e" }}>
                Announced soon
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNotify()
              }}
              className={`
                flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold shadow-lg
                transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                ${
                  notified
                    ? "border-2 border-[#4a3728] bg-white text-[#4a3728]"
                    : "bg-[#4a3728] text-white"
                }
              `}
            >
              {notified ? (
                <>
                  <BellRing className="h-5 w-5" />
                  You are on the list
                </>
              ) : (
                <>
                  <Bell className="h-5 w-5" />
                  Notify Me
                </>
              )}
            </button>

            <p
              className="min-h-[2.5rem] text-center text-xs"
              style={{ color: "#8a7a6a" }}
            >
              {justToggled && notified
                ? "Done! Premium launch hote hi aapko notification milega."
                : justToggled && !notified
                ? "Notification band kar di gayi hai."
                : notified
                ? "Launch par sabse pehle bataya jayega. Dobara click karke band kar sakte ho."
                : "Premium launch hone par sabse pehle jaanne ke liye click karein."}
            </p>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div>
        <h3 className="mb-1 text-2xl font-bold" style={{ color: "#4a3728" }}>
          Compare plans
        </h3>
        <p className="mb-4 text-sm" style={{ color: "#8a7a6a" }}>
          Sabhi plans ke features ek nazar mein
        </p>

        <div
          className="overflow-x-auto rounded-2xl border-2 bg-white shadow-lg"
          style={{ borderColor: "#e0d8cf" }}
        >
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: "#fbf7f3" }}>
                <th className="px-5 py-4 font-semibold" style={{ color: "#8a7a6a" }}>
                  Feature
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.id}
                    className="px-5 py-4 text-center font-bold"
                    style={{ color: "#4a3728" }}
                  >
                    {p.name}
                    <div className="text-xs font-medium" style={{ color: "#7a5c3e" }}>
                      {formatINR(priceOf(p))}/mo
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr
                  key={row.label}
                  className="transition-colors hover:bg-[#fffaf3]"
                  style={{ borderTop: "1px solid #efe7dc" }}
                >
                  <td className="px-5 py-3.5 font-medium" style={{ color: "#4a3728" }}>
                    {row.label}
                  </td>
                  {row.values.map((v, j) => (
                    <td key={`${i}-${j}`} className="px-5 py-3.5 text-center">
                      {typeof v === "boolean" ? (
                        v ? (
                          <Check className="mx-auto h-5 w-5 text-green-600" />
                        ) : (
                          <Minus className="mx-auto h-5 w-5" style={{ color: "#cfc4b6" }} />
                        )
                      ) : (
                        <span style={{ color: "#6b5a4a" }}>{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h3 className="mb-1 text-2xl font-bold" style={{ color: "#4a3728" }}>
          Frequently asked questions
        </h3>
        <p className="mb-4 text-sm" style={{ color: "#8a7a6a" }}>
          Common questions about our plans
        </p>

        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const open = openFaq === i
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all duration-300"
                style={{ borderColor: open ? "#c9a97a" : "#e0d8cf" }}
              >
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold" style={{ color: "#4a3728" }}>
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${
                      open ? "rotate-180" : ""
                    }`}
                    style={{ color: "#7a5c3e" }}
                  />
                </button>
                {open && (
                  <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: "#8a7a6a" }}>
                    {item.a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Plan details modal */}
      {activePlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={closeModals}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${activePlan.name} plan details`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div
              className="relative px-8 pb-6 pt-8"
              style={{ background: "linear-gradient(135deg, #fffaf3 0%, #f6ebdc 100%)" }}
            >
              <button
                onClick={closeModals}
                aria-label="Close"
                className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-[#e8dccb]"
              >
                <X className="h-5 w-5" style={{ color: "#4a3728" }} />
              </button>

              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl shadow-md"
                  style={{ backgroundColor: "#4a3728" }}
                >
                  {React.createElement(activePlan.icon, { className: "h-6 w-6 text-white" })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: "#4a3728" }}>
                    {activePlan.name}
                  </h3>
                  <p className="text-xs" style={{ color: "#8a7a6a" }}>
                    {activePlan.tagline}
                  </p>
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: "#7a5c3e" }}>
                  {formatINR(priceOf(activePlan))}
                </span>
                <span style={{ color: "#8a7a6a" }}>/mo</span>
                <span
                  className="ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase"
                  style={{ backgroundColor: "#f1e4d0", color: "#7a5c3e" }}
                >
                  {billing}
                </span>
              </div>
              {billing === "yearly" && (
                <p className="mt-1 text-xs font-medium" style={{ color: "#2f7a43" }}>
                  Billed {formatINR(activePlan.yearly * 12)}/year, you save{" "}
                  {formatINR((activePlan.monthly - activePlan.yearly) * 12)}
                </p>
              )}
            </div>

            <div className="space-y-5 px-8 py-6">
              <div
                className="rounded-xl border px-4 py-3"
                style={{ borderColor: "#efe7dc", backgroundColor: "#fbf7f3" }}
              >
                <p
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "#8a7a6a" }}
                >
                  Best for
                </p>
                <p className="mt-0.5 text-sm" style={{ color: "#4a3728" }}>
                  {activePlan.bestFor}
                </p>
              </div>

              <div>
                <p className="mb-3 text-sm font-bold" style={{ color: "#4a3728" }}>
                  What you get
                </p>
                <ul className="space-y-3.5">
                  {activePlan.features.map((f) => (
                    <li key={f.title} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#4a3728" }}>
                          {f.title}
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: "#8a7a6a" }}>
                          {f.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  onClick={closeModals}
                  className="flex-1 rounded-xl border-2 py-3 font-bold transition-all duration-300 hover:bg-[#fbf7f3]"
                  style={{ borderColor: "#e0d8cf", color: "#7a5c3e" }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleChoose(activePlan)}
                  className="flex-1 rounded-xl py-3 font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ backgroundColor: "#4a3728" }}
                >
                  Choose {activePlan.name}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium details modal */}
      {premiumOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={closeModals}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Premium plan details"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div
              className="relative px-8 pb-6 pt-8"
              style={{ background: "linear-gradient(135deg, #fffaf3 0%, #f1e0c8 100%)" }}
            >
              <button
                onClick={closeModals}
                aria-label="Close"
                className="absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-[#e8dccb]"
              >
                <X className="h-5 w-5" style={{ color: "#4a3728" }} />
              </button>

              <div className="mb-3 flex flex-wrap items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl shadow-md"
                  style={{ backgroundColor: "#7a5c3e" }}
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold" style={{ color: "#4a3728" }}>
                  Premium
                </h3>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: "#4a3728" }}
                >
                  <Lock className="h-3 w-3" />
                  Coming Soon
                </span>
              </div>
              <p className="max-w-xl text-sm" style={{ color: "#8a7a6a" }}>
                Mentors ke liye sabse powerful tier. Monetization, session experience, branding
                aur automation, sab ek jagah. Pricing launch ke time announce hogi.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 px-8 py-6 sm:grid-cols-2">
              {PREMIUM_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className="rounded-xl border p-4"
                  style={{ borderColor: "#efe7dc", backgroundColor: "#fbf7f3" }}
                >
                  <p
                    className="mb-3 text-xs font-bold uppercase tracking-wider"
                    style={{ color: "#7a5c3e" }}
                  >
                    {group.title}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <CheckCircle
                          className="mt-0.5 h-4 w-4 flex-shrink-0"
                          style={{ color: "#b08d5b" }}
                        />
                        <span className="text-sm" style={{ color: "#6b5a4a" }}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div
              className="flex flex-col items-center justify-between gap-4 border-t px-8 py-5 sm:flex-row"
              style={{ borderColor: "#efe7dc" }}
            >
              <p className="text-center text-xs sm:text-left" style={{ color: "#8a7a6a" }}>
                {notified
                  ? "Tum waitlist mein ho. Launch par sabse pehle bataya jayega."
                  : "Waitlist join karo, launch hote hi sabse pehle access milega."}
              </p>
              <div className="flex w-full gap-3 sm:w-auto">
                <button
                  onClick={closeModals}
                  className="flex-1 rounded-xl border-2 px-6 py-3 font-bold transition-all duration-300 hover:bg-[#fbf7f3] sm:flex-none"
                  style={{ borderColor: "#e0d8cf", color: "#7a5c3e" }}
                >
                  Close
                </button>
                <button
                  onClick={handleNotify}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:flex-none ${
                    notified
                      ? "border-2 border-[#4a3728] bg-white text-[#4a3728]"
                      : "bg-[#4a3728] text-white"
                  }`}
                >
                  {notified ? (
                    <>
                      <BellRing className="h-5 w-5" />
                      On the list
                    </>
                  ) : (
                    <>
                      <Bell className="h-5 w-5" />
                      Notify Me
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}