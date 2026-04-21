"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/useSession";
import { Mail, Phone, Building2, PanelLeftClose, PanelLeftOpen, LayoutDashboard, FileText, Users, Settings, LogOut, ChevronUp } from "lucide-react";

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
  const router = useRouter();
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/payroll") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/user");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAdmin } = useSession();
  const userEmail = user?.email ?? null;
  const userInitial = (user?.email?.[0] ?? user?.name?.[0] ?? "U").toUpperCase();

  function handleLogout() {
    setUserMenuOpen(false);
    localStorage.removeItem("dpwh_session");
    document.cookie = "dpwh_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Hard redirect so the browser discards history and can't go back to a cached protected page
    window.location.replace("/login");
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/payroll", label: "Documents", icon: FileText },
    // Only visible to Admins
    ...(isAdmin ? [{ href: "/admin/roles", label: "User Management", icon: Users }] : []),
  ];

  if (isDashboardRoute) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <aside
          className="flex flex-col border-r border-border transition-all duration-300"
          style={{
            backgroundColor: "#3338A0",
            width: sidebarOpen ? "16rem" : "3.5rem",
            minWidth: sidebarOpen ? "16rem" : "3.5rem",
          }}
        >
          {/* Header */}
          <div
            className="flex h-14 items-center border-b px-3"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
          >
            {sidebarOpen ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex flex-1 items-center gap-2 text-base font-semibold tracking-tight text-white whitespace-nowrap overflow-hidden"
                >
                  <Image src="/img/logo.png" alt="D-Track Logo" width={28} height={28} className="shrink-0" />
                  <span>D-Track</span>
                </Link>
                <div className="relative ml-1 shrink-0 group/tooltip">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                  <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100 z-50">
                    Collapse sidebar
                  </span>
                </div>
              </>
            ) : (
              <div className="relative mx-auto group/tooltip">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
                <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100 z-50">
                  Expand sidebar
                </span>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="grid gap-1 p-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  title={!sidebarOpen ? label : undefined}
                  className={`flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-white/20 hover:text-white ${
                    isActive ? "bg-white/20 text-white" : "text-white/70"
                  } ${!sidebarOpen ? "justify-center" : ""}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {sidebarOpen && <span className="whitespace-nowrap overflow-hidden">{label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div
            className="relative mt-auto border-t p-3"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
          >
            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div
                className="absolute rounded-lg overflow-hidden shadow-xl z-50"
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  ...(sidebarOpen
                    ? { bottom: "100%", left: "0.75rem", right: "0.75rem", marginBottom: "0.5rem" }
                    : { bottom: "0", left: "calc(100% + 8px)", width: "200px" }),
                }}
              >
                {/* User info header */}
                <div className="px-3 py-2.5 border-b" style={{ borderColor: "#F3F4F6" }}>
                  <p className="text-xs font-semibold truncate" style={{ color: "#111827" }}>
                    {userEmail ?? "—"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>Signed in</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/user/user-account"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                    style={{ color: "#374151" }}
                  >
                    <Settings className="h-4 w-4" style={{ color: "#6B7280" }} />
                    Account Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                    style={{ color: "#DC2626" }}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}

            {/* Trigger Button */}
            {sidebarOpen ? (
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-white/10"
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.55)" }}>Logged in as</p>
                  <p className="truncate text-sm font-medium text-white">
                    {userEmail ?? "…"}
                  </p>
                </div>
                <ChevronUp
                  className="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
                  style={{ color: "rgba(255,255,255,0.5)", transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
            ) : (
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white transition-colors hover:bg-white/30"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                title={userEmail ?? undefined}
              >
                {userInitial}
              </button>
            )}
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
                        <p style={{ color: "#374151" }}>john.doe@example.com</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <Phone className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "#3338A0" }} />
                      <div>
                        <p className="font-medium" style={{ color: "#1F2937" }}>Phone</p>
                        <p style={{ color: "#374151" }}>+XXXXXXXXXX</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <Building2 className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "#3338A0" }} />
                      <div>
                        <p className="font-medium" style={{ color: "#1F2937" }}>Office</p>
                        <p style={{ color: "#374151" }}>DPWH Regional Office XIII</p>
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
