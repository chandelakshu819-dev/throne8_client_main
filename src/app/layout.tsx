//src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import ReduxProvider from "@/store/providers/ReduxProvider";
import NavbarProvider from "@/features/profile/components/home/NavbarProvider";
import MentorshipCallProvider from "@/providers/MentorshipCallProvider";
import AuthProvider from "@/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Throne8 - Professional Networking Platform",
  description: "Connect, collaborate, and grow with professionals worldwide",
  icons: {
    // icon: '/throne8logo.png',
    icon: "/throne8logo-192-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ReduxProvider>
          <AuthProvider>
            <MentorshipCallProvider>
              <NavbarProvider>{children}</NavbarProvider>
            </MentorshipCallProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
