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
      <main className="min-h-screen
        ml-0 lg:ml-72
        pt-16 lg:pt-0
      ">
        {children}
      </main>
    </div>
  );
}