import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { LayoutShell } from "@/components/layout-shell";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "D-Track",
  description: "Department of Public Works and Highways",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-background text-foreground`}
      >
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
