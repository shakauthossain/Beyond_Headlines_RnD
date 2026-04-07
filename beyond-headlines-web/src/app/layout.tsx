import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beyond Headlines — Editorial Dashboard",
  description: "AI-Assisted News Platforms for Modern Editorial Teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.className} h-full antialiased`}
    >
      <body className="min-h-screen bg-slate-50 flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
