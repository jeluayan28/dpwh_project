import { ArrowUpRight, CheckCircle2, Loader2, XCircle, FileText, Clock, AlertTriangle, TrendingUp } from "lucide-react";

const analytics = [
  {
    label: "Total Documents",
    value: "128",
    sub: "All recorded documents",
    change: "+12 this month",
    icon: FileText,
    accent: "#3338A0",
    bg: "#EEF0FB",
    bar: 80,
  },
  {
    label: "Completed",
    value: "87",
    sub: "Fully processed",
    change: "68% completion rate",
    icon: CheckCircle2,
    accent: "#16A34A",
    bg: "#F0FDF4",
    bar: 68,
  },
  {
    label: "Pending Review",
    value: "34",
    sub: "Awaiting action",
    change: "8 nearing deadline",
    icon: Clock,
    accent: "#D97706",
    bg: "#FFFBEB",
    bar: 26,
  },
  {
    label: "Overdue",
    value: "7",
    sub: "Past deadline",
    change: "Needs immediate action",
    icon: AlertTriangle,
    accent: "#DC2626",
    bg: "#FEF2F2",
    bar: 6,
  },
];

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "#16A34A",
    bg: "#F0FDF4",
  },
  pending: {
    label: "Pending",
    icon: <Loader2 className="h-3.5 w-3.5" />,
    color: "#D97706",
    bg: "#FFFBEB",
  },
  overdue: {
    label: "Overdue",
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: "#DC2626",
    bg: "#FEF2F2",
  },
};

const documents = [
  {
    id: "DTK-2026-001",
    title: "Payroll Voucher – March 2026",
    division: "Finance Division",
    date: "Mar 18, 2026",
    status: "completed",
  },
  {
    id: "DTK-2026-002",
    title: "Leave of Absence Request – J. Santos",
    division: "HR Division",
    date: "Mar 20, 2026",
    status: "pending",
  },
  {
    id: "DTK-2026-003",
    title: "Infrastructure Budget Proposal Q1",
    division: "Planning Division",
    date: "Mar 10, 2026",
    status: "overdue",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-6 sm:p-8" style={{ backgroundColor: "#F7F7F7" }}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1E1E2E" }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          Overview of document tracking activity
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {analytics.map(({ label, value, sub, change, icon: Icon, accent, bg, bar }) => (
          <div
            key={label}
            className="relative rounded-xl p-5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
          >
            {/* Top row */}
            <div className="flex items-start justify-between mb-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: bg }}
              >
                <Icon className="h-5 w-5" style={{ color: accent }} />
              </div>
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: bg, color: accent }}
              >
                <TrendingUp className="h-3 w-3" />
              </span>
            </div>

            {/* Value */}
            <p className="text-3xl font-bold tracking-tight" style={{ color: "#1E1E2E" }}>
              {value}
            </p>
            <p className="mt-0.5 text-sm font-medium" style={{ color: "#374151" }}>
              {label}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "#9CA3AF" }}>
              {sub}
            </p>

            {/* Progress bar */}
            <div className="mt-4 h-1.5 w-full rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${bar}%`, backgroundColor: accent }}
              />
            </div>

            {/* Change label */}
            <div className="mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" style={{ color: accent }} />
              <span className="text-xs font-medium" style={{ color: accent }}>
                {change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Document List */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "#fff",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        }}
      >
        {/* Table header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "#F3F4F6" }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>
              Recent Documents
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              Latest document activity across divisions
            </p>
          </div>
          <button
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90"
            style={{ backgroundColor: "#3338A0", color: "#fff" }}
          >
            View All
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Column headers */}
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
        {documents.map((doc, i) => {
          const status = statusConfig[doc.status];
          return (
            <div
              key={doc.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 transition-colors hover:bg-gray-50 cursor-pointer"
              style={{
                borderBottom: i < documents.length - 1 ? "1px solid #F3F4F6" : "none",
              }}
            >
              {/* Title + ID */}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#111827" }}>
                  {doc.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                  {doc.id}
                </p>
              </div>

              {/* Division */}
              <span className="text-xs whitespace-nowrap" style={{ color: "#6B7280" }}>
                {doc.division}
              </span>

              {/* Date */}
              <span className="text-xs whitespace-nowrap" style={{ color: "#6B7280" }}>
                {doc.date}
              </span>

              {/* Status badge */}
              <div
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                {status.icon}
                {status.label}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
