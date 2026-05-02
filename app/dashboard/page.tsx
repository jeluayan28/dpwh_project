"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  XCircle,
  FileText,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

const statusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
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

type Document = {
  document_id: number;
  tracking_num: number;
  title: string;
  status: string;
  is_urgent: boolean;
  created_at: string;
  type: string;
};

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch("/api/documents", { cache: "no-store" });
        const result = (await response.json()) as {
          data?: Document[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to fetch documents.");
        }

        setDocuments((result.data ?? []).slice(0, 10));
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
      setLoading(false);
    }

    fetchDocuments();
  }, []);

  const total = documents.length;
  const completed = documents.filter(
    (d) => d.status?.toLowerCase() === "completed",
  ).length;
  const pending = documents.filter(
    (d) => d.status?.toLowerCase() === "pending",
  ).length;
  const overdue = documents.filter(
    (d) => d.status?.toLowerCase() === "overdue",
  ).length;

  const analytics = [
    {
      label: "Total Documents",
      value: String(total),
      sub: "All recorded documents",
      change: "From database",
      icon: FileText,
      accent: "#3338A0",
      bg: "#EEF0FB",
      bar: 100,
    },
    {
      label: "Completed",
      value: String(completed),
      sub: "Fully processed",
      change:
        total > 0
          ? `${Math.round((completed / total) * 100)}% completion rate`
          : "0%",
      icon: CheckCircle2,
      accent: "#16A34A",
      bg: "#F0FDF4",
      bar: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
    {
      label: "Pending Review",
      value: String(pending),
      sub: "Awaiting action",
      change: "Awaiting review",
      icon: Clock,
      accent: "#D97706",
      bg: "#FFFBEB",
      bar: total > 0 ? Math.round((pending / total) * 100) : 0,
    },
    {
      label: "Overdue",
      value: String(overdue),
      sub: "Past deadline",
      change: overdue > 0 ? "Needs immediate action" : "None overdue",
      icon: AlertTriangle,
      accent: "#DC2626",
      bg: "#FEF2F2",
      bar: total > 0 ? Math.round((overdue / total) * 100) : 0,
    },
  ];

  return (
    <main
      className="min-h-screen p-6 sm:p-8"
      style={{ backgroundColor: "#F7F7F7" }}
    >
      {/* Page Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "#1E1E2E" }}
        >
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
          Overview of document tracking activity
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {analytics.map(
          ({ label, value, sub, change, icon: Icon, accent, bg, bar }) => (
            <div
              key={label}
              className="relative rounded-xl p-5 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                backgroundColor: "#fff",
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
              }}
            >
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
              <p
                className="text-3xl font-bold tracking-tight"
                style={{ color: "#1E1E2E" }}
              >
                {loading ? "—" : value}
              </p>
              <p
                className="mt-0.5 text-sm font-medium"
                style={{ color: "#374151" }}
              >
                {label}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "#9CA3AF" }}>
                {sub}
              </p>
              <div
                className="mt-4 h-1.5 w-full rounded-full"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${bar}%`, backgroundColor: accent }}
                />
              </div>
              <div className="mt-2 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" style={{ color: accent }} />
                <span className="text-xs font-medium" style={{ color: accent }}>
                  {change}
                </span>
              </div>
            </div>
          ),
        )}
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
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "#F3F4F6" }}
        >
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "#1E1E2E" }}
            >
              Recent Documents
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              Latest document activity
            </p>
          </div>
          <Link
            href="/payroll"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90"
            style={{ backgroundColor: "#3338A0", color: "#fff" }}
          >
            View All <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Column Headers */}
        <div
          className="grid gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr",
            backgroundColor: "#F9FAFB",
            color: "#9CA3AF",
            borderBottom: "1px solid #F3F4F6",
          }}
        >
          <span>Tracking Number</span>
          <span>Title</span>
          <span>Type</span>
          <span className="text-center">Date</span>
          <span className="text-center">Status</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className="h-6 w-6 animate-spin"
              style={{ color: "#3338A0" }}
            />
          </div>
        ) : documents.length === 0 ? (
          <div
            className="py-12 text-center text-sm"
            style={{ color: "#9CA3AF" }}
          >
            No documents found.
          </div>
        ) : (
          documents.map((doc, i) => {
            const statusKey = doc.status?.toLowerCase();
            const status = statusConfig[statusKey] ?? statusConfig["pending"];
            return (
              <div
                key={doc.document_id}
                className="grid gap-4 items-center px-5 py-4 transition-colors hover:bg-gray-50 cursor-pointer"
                style={{
                  gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr",
                  borderBottom:
                    i < documents.length - 1 ? "1px solid #F3F4F6" : "none",
                }}
              >
                <p className="text-sm font-medium" style={{ color: "#9CA3AF" }}>
                  #{doc.tracking_num}
                  {doc.is_urgent && (
                    <span
                      className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
                    >
                      Urgent
                    </span>
                  )}
                </p>
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "#111827" }}
                >
                  {doc.title}
                </p>
                <span className="text-xs" style={{ color: "#6B7280" }}>
                  {doc.type}
                </span>
                <span
                  className="text-xs text-center"
                  style={{ color: "#6B7280" }}
                >
                  {new Date(doc.created_at).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <div className="flex justify-center">
                  <div
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
                    style={{ backgroundColor: status.bg, color: status.color }}
                  >
                    {status.icon}
                    {status.label}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
