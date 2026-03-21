"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Phone, Building2 } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type LayoutShellProps = {
  children: React.ReactNode;
};

export function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isDashboardRoute) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <aside className="flex w-64 flex-col border-r border-border bg-card/40">
          <div className="flex h-14 items-center border-b border-border px-4">
            <Link
              href="/dashboard"
              className="text-base font-semibold tracking-tight"
            >
              D-Track
            </Link>
          </div>
          <nav className="grid gap-1 p-3">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/documents"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Documents
            </Link>
            <Link
              href="/dashboard/user-management"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              User Management
            </Link>
          </nav>
          <div className="mt-auto border-t border-border p-4">
            <p className="text-xs text-muted-foreground">Logged in as</p>
            <p className="truncate text-sm font-medium">user@dpwh.gov.ph</p>
          </div>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border backdrop-blur" style={{ backgroundColor: "#3338A0" }}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white transition-colors hover:text-white/80"
          >
            <Image src="/img/logo.png" alt="D-Track Logo" width={32} height={32} />
            D-Track
          </Link>
          <nav className="flex items-center gap-6 sm:gap-8">
            <a
              href="/#about"
              className="text-sm font-medium text-white transition-colors hover:text-foreground"
            >
              About
            </a>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="rounded-sm text-sm font-medium text-white transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Contacts
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-5" style={{ backgroundColor: "#F7F7F7" }}>
                <div className="space-y-2">
                  <div>
                    <h3 className="text-xs font-semibold tracking-tight" style={{ color: "#1F2937" }}>
                      Contact Information
                    </h3>
                    <div className="mt-1 h-0.5 w-6 rounded-full" style={{ backgroundColor: "#FCC61D" }} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 text-xs">
                      <Mail className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "#3338A0" }} />
                      <div>
                        <p className="font-medium" style={{ color: "#1F2937" }}>Email</p>
                        <p style={{ color: "#374151" }}>support@dtrack.gov.ph</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <Phone className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "#3338A0" }} />
                      <div>
                        <p className="font-medium" style={{ color: "#1F2937" }}>Phone</p>
                        <p style={{ color: "#374151" }}>+63 2 1234 5678</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <Building2 className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "#3338A0" }} />
                      <div>
                        <p className="font-medium" style={{ color: "#1F2937" }}>Office</p>
                        <p style={{ color: "#374151" }}>DPWH Central Office</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Link
              href="/login"
              className="inline-flex h-7 items-center justify-center rounded-[min(var(--radius-md),12px)] bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
