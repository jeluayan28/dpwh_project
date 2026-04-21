"use client";

import { useEffect, useState } from "react";

export type SessionUser = {
  user_id: number;
  name: string;
  email: string;
  role: "Admin" | "Staff" | string;
};

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dpwh_session");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const isAdmin = user?.role === "Admin";
  const isStaff = user?.role === "Staff";

  return { user, loading, isAdmin, isStaff };
}
