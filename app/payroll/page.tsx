"use client";

import { useState } from "react";
import {
  FileText,
  ClipboardList,
  CheckCircle2,
  Loader2,
  XCircle,
  Plus,
  ArrowUpRight,
} from "lucide-react";

const tabs = [
  { id: "payroll", label: "Payroll", icon: FileText },
  { id: "tracker", label: "Tracker", icon: ClipboardList },
];

const payrollDocs = [
  { id: "PR-2026-014", title: "Payroll Voucher – March 2026", division: "Finance", date: "Mar 18, 2026", status: "completed" },
  { id: "PR-2026-013", title: "Salary Adjustment – Q1", division: "HR Division", date: "Mar 15, 2026", status: "pending" },
  { id: "PR-2026-012", title: "13th Month Pay – Batch 2", division: "Finance", date: "Mar 01, 2026", status: "overdue" },
  { id: "PR-2026-011", title: "PERA Allowance – March", division: "Finance", date: "Feb 28, 2026", status: "completed" },
  { id: "PR-2026-010", title: "Overtime Pay – Feb 2026", division: "Operations", date: "Feb 20, 2026", status: "completed" },
];

const trackerDocs = [
  { id: "TRK-2026-009", title: "Infrastructure Budget Proposal Q1", division: "Planning", date: "Mar 10, 2026", status: "overdue" },
  { id: "TRK-2026-008", title: "Leave of Absence – J. Santos", division: "HR Division", date: "Mar 20, 2026", status: "pending" },
  { id: "TRK-2026-007", title: "Procurement Request – Office Supplies", division: "Admin", date: "Mar 17, 2026", status: "completed" },
  { id: "TRK-2026-006", title: "Travel Order – R. Cruz", division: "Engineering", date: "Mar 12, 2026", status: "pending" },
  { id: "TRK-2026-005", title: "Certificate of Employment – M. Reyes", division: "HR Division", date: "Mar 05, 2026", status: "completed" },
];

const statusStyle: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  completed: { label: "Completed", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "#16A34A", bg: "#F0FDF4" },
  pending:   { label: "Pending",   icon: <Loader2 className="h-3.5 w-3.5" />,       color: "#D97706", bg: "#FFFBEB" },
  overdue:   { label: "Overdue",   icon: <XCircle className="h-3.5 w-3.5" />,        color: "#DC2626", bg: "#FEF2F2" },
};

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState("payroll");
  const docs = activeTab === "payroll" ? payrollDocs : trackerDocs;

  return (
    <main className="min-h-screen p-6 sm:p-8" style={{ backgroundColor: "#F7F7F7" }}>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1E1E2E" }}>
          Documents
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          Manage payroll documents and track their processing status
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

      {/* Document Table */}
      <div
        className="rounded-xl overflow-hidden mb-6"
        style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
      >
        {/* Table Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "#F3F4F6" }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>
              {activeTab === "payroll" ? "Payroll Documents" : "Tracked Documents"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              {activeTab === "payroll"
                ? "All payroll-related document records"
                : "Document movement across divisions"}
            </p>
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: "#EEF0FB", color: "#3338A0" }}
          >
            {docs.length} records
          </span>
        </div>

        {/* Column Headers */}
        <div
          className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
          style={{ backgroundColor: "#F9FAFB", color: "#9CA3AF", borderBottom: "1px solid #F3F4F6" }}
        >
          <span>Document</span>
          <span className="text-right">Division</span>
          <span className="text-right">Date</span>
          <span className="text-right">Status</span>
        </div>

        {/* Rows */}
        {docs.map((doc, i) => {
          const s = statusStyle[doc.status];
          return (
            <div
              key={doc.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 transition-colors hover:bg-gray-50 cursor-pointer"
              style={{ borderBottom: i < docs.length - 1 ? "1px solid #F3F4F6" : "none" }}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#111827" }}>{doc.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{doc.id}</p>
              </div>
              <span className="text-xs whitespace-nowrap" style={{ color: "#6B7280" }}>{doc.division}</span>
              <span className="text-xs whitespace-nowrap" style={{ color: "#6B7280" }}>{doc.date}</span>
              <div
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
                style={{ backgroundColor: s.bg, color: s.color }}
              >
                {s.icon}
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Document Button */}
      <div className="flex justify-end">
        <button
          className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ backgroundColor: "#3338A0", color: "#fff", boxShadow: "0 4px 14px rgba(51,56,160,0.35)" }}
        >
          <Plus className="h-4 w-4" />
          Create Document
          <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
        </button>
      </div>

    </main>
  );
}
