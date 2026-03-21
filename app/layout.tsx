import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col antialiased bg-background text-foreground`}
      >
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80"
            >
              D-Track
            </Link>
            <nav className="flex items-center gap-6 sm:gap-8">
              <a
                href="/#about"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                About
              </a>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                  >
                    Contacts
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      Contact Information
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Email: support@dtrack.gov.ph</p>
                      <p>Phone: +63 2 1234 5678</p>
                      <p>Office: DPWH Central Office</p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button asChild size="sm">
                <Link href="/login">Login</Link>
              </Button>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
