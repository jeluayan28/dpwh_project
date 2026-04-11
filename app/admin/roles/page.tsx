"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const tabs = [
  { id: "users", label: "Users", icon: Users },
  { id: "departments", label: "Departments", icon: Building2 },
];

const AVATAR_COLORS = ["#3338A0", "#0891B2", "#7C3AED", "#059669", "#D97706", "#DC2626"];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

type UserRow = {
  user_id: number;
  name: string;
  email: string;
  status: boolean;
  role_id: number;
  department_id: number;
  // joined from Departments and Roles
  Departments?: { department_name: string };
  Roles?: { role_name: string };
};

type DeptRow = {
  department_id: number;
  department_name: string;
  description: string;
  // member count joined
  member_count?: number;
};

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [departments, setDepartments] = useState<(DeptRow & { member_count: number })[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from("Users")
        .select("*, Departments(department_name), Roles(role_name)");

      if (error) console.error("Error fetching users:", error.message);
      else setUsers(data ?? []);
      setLoadingUsers(false);
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchDepartments() {
      const { data, error } = await supabase
        .from("Departments")
        .select("*");

      if (error) {
        console.error("Error fetching departments:", error.message);
        setLoadingDepts(false);
        return;
      }

      // get member counts per department
      const { data: userCounts, error: countError } = await supabase
        .from("Users")
        .select("department_id");

      if (countError) console.error("Error fetching user counts:", countError.message);

      const countMap: Record<number, number> = {};
      (userCounts ?? []).forEach((u) => {
        countMap[u.department_id] = (countMap[u.department_id] ?? 0) + 1;
      });

      const enriched = (data ?? []).map((dept) => ({
        ...dept,
        member_count: countMap[dept.department_id] ?? 0,
      }));

      setDepartments(enriched);
      setLoadingDepts(false);
    }
    fetchDepartments();
  }, []);

  return (
    <main className="min-h-screen p-6 sm:p-8" style={{ backgroundColor: "#F7F7F7" }}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1E1E2E" }}>
          User Management
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          Manage users, departments, and access roles
        </p>
      </div>

      {/* Tab Menu Bar */}
      <div className="mb-6 flex items-center gap-0 border-b" style={{ borderColor: "#E5E7EB" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all duration-200 relative"
            style={{
              color: activeTab === id ? "#3338A0" : "#9CA3AF",
              borderBottom: activeTab === id ? "2px solid #3338A0" : "2px solid transparent",
              marginBottom: "-1px",
              background: "transparent",
            }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>Users</h2>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                {loadingUsers ? "Loading…" : `${users.length} registered users`}
              </p>
            </div>
            <button
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90"
              style={{ backgroundColor: "#3338A0", color: "#fff" }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Add User
            </button>
          </div>

          <div
            className="grid gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
            style={{ gridTemplateColumns: "2fr 2fr 2fr 1fr auto", backgroundColor: "#F9FAFB", color: "#9CA3AF", borderBottom: "1px solid #F3F4F6" }}
          >
            <span>Name</span>
            <span>Department</span>
            <span>Role</span>
            <span className="text-center">Status</span>
            <span className="text-right">Actions</span>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3338A0" }} />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: "#9CA3AF" }}>No users found.</div>
          ) : (
            users.map((user, i) => (
              <div
                key={user.user_id}
                className="grid gap-4 items-center px-5 py-4 transition-colors hover:bg-gray-50"
                style={{ gridTemplateColumns: "2fr 2fr 2fr 1fr auto", borderBottom: i < users.length - 1 ? "1px solid #F3F4F6" : "none" }}
              >
                {/* Name + Avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: getColor(user.user_id) }}
                  >
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#111827" }}>{user.name}</p>
                    <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{user.email}</p>
                  </div>
                </div>

                {/* Department */}
                <span className="text-sm truncate" style={{ color: "#6B7280" }}>
                  {user.Departments?.department_name ?? "—"}
                </span>

                {/* Role */}
                <span className="text-sm truncate" style={{ color: "#6B7280" }}>
                  {user.Roles?.role_name ?? "—"}
                </span>

                {/* Status */}
                <div className="flex justify-center">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: user.status ? "#F0FDF4" : "#F3F4F6",
                      color: user.status ? "#16A34A" : "#9CA3AF",
                    }}
                  >
                    {user.status ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Actions */}
                <div className="relative flex justify-end">
                  <button
                    onClick={() => setOpenMenu(openMenu === user.user_id ? null : user.user_id)}
                    className="rounded-md p-1.5 transition-colors hover:bg-gray-100"
                    style={{ color: "#9CA3AF" }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenu === user.user_id && (
                    <div
                      className="absolute right-0 top-8 z-20 w-36 rounded-lg py-1 shadow-lg"
                      style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}
                    >
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50"
                        style={{ color: "#374151" }}
                        onClick={() => setOpenMenu(null)}
                      >
                        <Pencil className="h-3.5 w-3.5" style={{ color: "#3338A0" }} />
                        Edit User
                      </button>
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50"
                        style={{ color: "#DC2626" }}
                        onClick={() => setOpenMenu(null)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === "departments" && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>Departments</h2>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                {loadingDepts ? "Loading…" : `${departments.length} divisions`}
              </p>
            </div>
            <button
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90"
              style={{ backgroundColor: "#3338A0", color: "#fff" }}
            >
              <Building2 className="h-3.5 w-3.5" />
              Add Department
            </button>
          </div>

          <div
            className="grid gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
            style={{ gridTemplateColumns: "2fr 3fr auto auto", backgroundColor: "#F9FAFB", color: "#9CA3AF", borderBottom: "1px solid #F3F4F6" }}
          >
            <span>Department</span>
            <span>Description</span>
            <span className="text-right">Members</span>
            <span className="text-right">Actions</span>
          </div>

          {loadingDepts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3338A0" }} />
            </div>
          ) : departments.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: "#9CA3AF" }}>No departments found.</div>
          ) : (
            departments.map((dept, i) => (
              <div
                key={dept.department_id}
                className="grid gap-4 items-center px-5 py-4 transition-colors hover:bg-gray-50"
                style={{ gridTemplateColumns: "2fr 3fr auto auto", borderBottom: i < departments.length - 1 ? "1px solid #F3F4F6" : "none" }}
              >
                {/* Name + Avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: getColor(dept.department_id) }}
                  >
                    {getInitials(dept.department_name)}
                  </div>
                  <span className="text-sm font-medium truncate" style={{ color: "#111827" }}>
                    {dept.department_name}
                  </span>
                </div>

                {/* Description */}
                <span className="text-sm truncate" style={{ color: "#6B7280" }}>
                  {dept.description ?? "—"}
                </span>

                {/* Members */}
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
                  style={{ backgroundColor: "#EEF0FB", color: "#3338A0" }}
                >
                  {dept.member_count} members
                </span>

                {/* Actions */}
                <div className="relative flex justify-end">
                  <button
                    onClick={() => setOpenMenu(openMenu === dept.department_id + 1000 ? null : dept.department_id + 1000)}
                    className="rounded-md p-1.5 transition-colors hover:bg-gray-100"
                    style={{ color: "#9CA3AF" }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenu === dept.department_id + 1000 && (
                    <div
                      className="absolute right-0 top-8 z-20 w-40 rounded-lg py-1 shadow-lg"
                      style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}
                    >
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50"
                        style={{ color: "#374151" }}
                        onClick={() => setOpenMenu(null)}
                      >
                        <Pencil className="h-3.5 w-3.5" style={{ color: "#3338A0" }} />
                        Edit Department
                      </button>
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50"
                        style={{ color: "#DC2626" }}
                        onClick={() => setOpenMenu(null)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
