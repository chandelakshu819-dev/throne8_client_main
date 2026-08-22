import type { Metadata } from "next";
import "./globals.css";
import 'remixicon/fonts/remixicon.css';
import ReduxProvider from "@/store/providers/ReduxProvider";
import AuthProvider from "@/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Throne8 - Professional Networking Platform",
  description: "Connect, collaborate, and grow with professionals worldwide",
  icons: {
    icon: '/throne8logo.png',  // Basic favicon (auto-served)
    // Agar multiple sizes/additional icons chahiye:
    // apple: '/apple-touch-icon.png',  // iOS ke liye
    // shortcut: '/favicon-16x16.png',  // Small icon
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
            {children}
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}

