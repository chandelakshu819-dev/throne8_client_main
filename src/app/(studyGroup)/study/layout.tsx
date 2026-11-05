import { ReactNode } from "react";
import StudySidebar from "@/features/study-group/modals/StudySidebar";
import GlobalNavbar from "@/shared/uiComponents/GlobalNavbar";

export default function StudyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f3ee]">
      <GlobalNavbar />
      <StudySidebar />
      {/* pt-16 = fixed top navbar (h-16) ki height; pehle lg:pt-0 tha jisse content nav ke peeche chhup jaata tha */}
      <main className="min-h-screen
        ml-0 lg:ml-72
        pt-16
      ">
        {children}
      </main>
    </div>
  );
}