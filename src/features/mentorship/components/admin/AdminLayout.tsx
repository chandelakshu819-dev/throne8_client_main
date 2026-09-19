"use client";

import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  activePage: string;
  setActivePage: (page: string) => void;
  pendingMentorCount?: number;
  reportedReviewCount?: number;
  pageTitle: string;
  pageSubtitle?: string;
  children: ReactNode;
}

export default function AdminLayout({
  activePage,
  setActivePage,
  pendingMentorCount = 0,
  reportedReviewCount = 0,
  pageTitle,
  pageSubtitle,
  children,
}: AdminLayoutProps) {
  return (
    <div
      className="flex overflow-hidden pt-16"
      style={{ backgroundColor: "#faf6f1", height: "100vh" }}
    >
      <AdminSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        pendingMentorCount={pendingMentorCount}
        reportedReviewCount={reportedReviewCount}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="px-8 py-5 shrink-0"
          style={{ backgroundColor: "#fff", borderBottom: "1px solid #ece4db" }}
        >
          <h1 className="text-xl font-bold" style={{ color: "#4a3728" }}>
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="text-sm mt-0.5" style={{ color: "#8a7a6a" }}>
              {pageSubtitle}
            </p>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}