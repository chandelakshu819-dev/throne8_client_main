// src/app/profile/layout.tsx
// Launch mode me /profile aur uske saare sub-paths (/profile/[userId], /profile/network/...,
// saved-posts, hidden-posts, analytics) server-side par hi redirect ho jate hain.
//
// NOTE: src/proxy.ts sirf Next.js 16+ me chalta hai. Is project me Next 15.5 hai,
// isliye proxy.ts execute hi nahi hota (aur launch-mode redirect bhi nahi lagta).
// Jab tak middleware.ts me migrate nahi karte, ye layout guard kaam karega.
import { redirect } from "next/navigation";
import { HOME_PATH, IS_MENTORSHIP_MODE } from "@/config/launch";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (IS_MENTORSHIP_MODE) {
    redirect(HOME_PATH);
  }
  return <>{children}</>;
}
