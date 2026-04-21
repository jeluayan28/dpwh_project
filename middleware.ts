import { NextRequest, NextResponse } from "next/server";

// Routes only Admin can access
const ADMIN_ONLY_PREFIXES = ["/admin"];

// Routes any logged-in user can access
const PROTECTED_PREFIXES = ["/dashboard", "/payroll", "/admin", "/user"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) return NextResponse.next();

  // Parse session cookie
  const raw = request.cookies.get("dpwh_session")?.value;
  let session: { user_id: number; name: string; email: string; role: string } | null = null;

  if (raw) {
    try {
      session = JSON.parse(decodeURIComponent(raw));
    } catch {
      // invalid cookie
    }
  }

  // Not logged in — redirect to login
  if (!session?.user_id) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in but not Admin — block admin routes
  const isAdminOnly = ADMIN_ONLY_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isAdminOnly && session.role !== "Admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Prevent browser from caching protected pages so back button can't show them after logout
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/payroll/:path*",
    "/admin/:path*",
    "/user/:path*",
  ],
};
