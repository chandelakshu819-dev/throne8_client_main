import { ReactNode } from "react";
import StudySidebar from "@/features/study-group/modals/StudySidebar";
import GlobalNavbar from "@/shared/uiComponents/GlobalNavbar";

export default function StudyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-screen w-full overflow-hidden bg-[#f7f3ee] flex flex-col">
      <GlobalNavbar />
      <div className="flex-1 min-h-0 w-full flex relative">
        <StudySidebar />
        {/* pt-16 = fixed top navbar (h-16) spacing; main content scrolls smoothly underneath the header */}
        <main
          id="study-main-scroll"
          className="flex-1 min-h-0 w-full lg:w-[calc(100%-18rem)] ml-0 lg:ml-72 pt-16 overflow-y-auto overflow-x-hidden scroll-smooth throne8-scrollbar relative z-0 [isolation:isolate]"
        >
          {children}
        </main>
      </div>
    </div>
  );
}