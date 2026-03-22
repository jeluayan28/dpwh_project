"use client";

import { useState } from "react";
import { Users, Building2, MoreVertical, Pencil, Trash2, ShieldCheck } from "lucide-react";

const tabs = [
  { id: "users", label: "Users", icon: Users },
  { id: "departments", label: "Departments", icon: Building2 },
];

const users = [
  {
    id: 1,
    name: "Maria Santos",
    department: "Finance Division",
    position: "Accounting Clerk II",
    avatar: "MS",
    avatarColor: "#3338A0",
  },
  {
    id: 2,
    name: "Juan dela Cruz",
    department: "HR Division",
    position: "Human Resource Officer",
    avatar: "JC",
    avatarColor: "#0891B2",
  },
  {
    id: 3,
    name: "Ricardo Reyes",
    department: "Planning Division",
    position: "Project Development Officer",
    avatar: "RR",
    avatarColor: "#7C3AED",
  },
];

const departments = [
  { id: 1, name: "Finance Division", head: "Maria Santos", members: 12, avatar: "FD", avatarColor: "#3338A0" },
  { id: 2, name: "HR Division", head: "Juan dela Cruz", members: 8, avatar: "HR", avatarColor: "#0891B2" },
  { id: 3, name: "Planning Division", head: "Ricardo Reyes", members: 15, avatar: "PD", avatarColor: "#7C3AED" },
];

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [openMenu, setOpenMenu] = useState<number | null>(null);

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
      <div
        className="mb-6 flex items-center gap-1 rounded-xl p-1 w-fit"
        style={{ backgroundColor: "#E8EAF6", border: "1px solid #C5CAE9" }}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200"
            style={
              activeTab === id
                ? { backgroundColor: "#3338A0", color: "#fff", boxShadow: "0 2px 8px rgba(51,56,160,0.25)" }
                : { backgroundColor: "transparent", color: "#6B7280" }
            }
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
          {/* Table Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "#F3F4F6" }}
          >
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>Users</h2>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                {users.length} registered users
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

          {/* Column Headers */}
          <div
            className="grid grid-cols-[2fr_2fr_2fr_auto] gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
            style={{ backgroundColor: "#F9FAFB", color: "#9CA3AF", borderBottom: "1px solid #F3F4F6" }}
          >
            <span>Name</span>
            <span>Department</span>
            <span>Position</span>
            <span className="text-right">Actions</span>
          </div>

          {/* User Rows */}
          {users.map((user, i) => (
            <div
              key={user.id}
              className="grid grid-cols-[2fr_2fr_2fr_auto] gap-4 items-center px-5 py-4 transition-colors hover:bg-gray-50"
              style={{ borderBottom: i < users.length - 1 ? "1px solid #F3F4F6" : "none" }}
            >
              {/* Name + Avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.avatar}
                </div>
                <span className="text-sm font-medium truncate" style={{ color: "#111827" }}>
                  {user.name}
                </span>
              </div>

              {/* Department */}
              <span className="text-sm truncate" style={{ color: "#6B7280" }}>
                {user.department}
              </span>

              {/* Position */}
              <span className="text-sm truncate" style={{ color: "#6B7280" }}>
                {user.position}
              </span>

              {/* Menu */}
              <div className="relative flex justify-end">
                <button
                  onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                  className="rounded-md p-1.5 transition-colors hover:bg-gray-100"
                  style={{ color: "#9CA3AF" }}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {openMenu === user.id && (
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
          ))}
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === "departments" && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
        >
          {/* Table Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "#F3F4F6" }}
          >
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>Departments</h2>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                {departments.length} divisions
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

          {/* Column Headers */}
          <div
            className="grid grid-cols-[2fr_2fr_auto_auto] gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
            style={{ backgroundColor: "#F9FAFB", color: "#9CA3AF", borderBottom: "1px solid #F3F4F6" }}
          >
            <span>Department</span>
            <span>Head</span>
            <span className="text-right">Members</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Department Rows */}
          {departments.map((dept, i) => (
            <div
              key={dept.id}
              className="grid grid-cols-[2fr_2fr_auto_auto] gap-4 items-center px-5 py-4 transition-colors hover:bg-gray-50"
              style={{ borderBottom: i < departments.length - 1 ? "1px solid #F3F4F6" : "none" }}
            >
              {/* Name + Avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: dept.avatarColor }}
                >
                  {dept.avatar}
                </div>
                <span className="text-sm font-medium truncate" style={{ color: "#111827" }}>
                  {dept.name}
                </span>
              </div>

              {/* Head */}
              <span className="text-sm truncate" style={{ color: "#6B7280" }}>
                {dept.head}
              </span>

              {/* Members badge */}
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-right whitespace-nowrap"
                style={{ backgroundColor: "#EEF0FB", color: "#3338A0" }}
              >
                {dept.members} members
              </span>

              {/* Menu */}
              <div className="relative flex justify-end">
                <button
                  onClick={() => setOpenMenu(openMenu === dept.id + 100 ? null : dept.id + 100)}
                  className="rounded-md p-1.5 transition-colors hover:bg-gray-100"
                  style={{ color: "#9CA3AF" }}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {openMenu === dept.id + 100 && (
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
          ))}
        </div>
      )}

    </main>
  );
}
