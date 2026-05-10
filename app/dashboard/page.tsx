"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight, CheckCircle2, Loader2, FileText,
  Clock, AlertTriangle, X, Hash, CalendarDays, Tag, Zap, Eye,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string; darkColor: string; darkBg: string }> = {
  completed:  { label: "Completed",  color: "#15803D", bg: "#F0FDF4", dot: "#22C55E", darkColor: "#4ade80", darkBg: "rgba(74,222,128,0.12)" },
  pending:    { label: "Pending",    color: "#92400E", bg: "#FFFBEB", dot: "#F59E0B", darkColor: "#fbbf24", darkBg: "rgba(251,191,36,0.12)" },
  overdue:    { label: "Overdue",    color: "#991B1B", bg: "#FEF2F2", dot: "#EF4444", darkColor: "#f87171", darkBg: "rgba(248,113,113,0.12)" },
  in_transit: { label: "In Transit", color: "#1E40AF", bg: "#EFF6FF", dot: "#3B82F6", darkColor: "#60a5fa", darkBg: "rgba(96,165,250,0.12)" },
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

function DocumentModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const statusKey = doc.status?.toLowerCase().replace(" ", "_");
  const status = statusConfig[statusKey] ?? statusConfig["pending"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--dp-backdrop)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: "var(--dp-modal-bg)",
          border: "1px solid var(--dp-modal-border)",
          animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(12px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ background: "linear-gradient(135deg, var(--dp-primary) 0%, var(--dp-primary-lt) 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Document Details</p>
              <p className="text-sm font-bold text-white tracking-tight">#{doc.tracking_num}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white/20" style={{ color: "rgba(255,255,255,0.7)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--dp-text-4)" }}>Title</p>
            <div className="flex items-start gap-2 flex-wrap">
              <p className="text-base font-semibold leading-snug" style={{ color: "var(--dp-text-1)" }}>{doc.title}</p>
              {doc.is_urgent && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                  <Zap className="h-3 w-3" /> Urgent
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Hash,        label: "Tracking No.", value: `#${doc.tracking_num}`, mono: true, accent: "var(--dp-primary)" },
              { icon: Tag,         label: "Type",         value: doc.type ?? "—",        mono: false, accent: "var(--dp-text-1)" },
              { icon: CalendarDays,label: "Date Created", value: new Date(doc.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }), mono: false, accent: "var(--dp-text-1)" },
            ].map(({ icon: Icon, label, value, mono, accent }) => (
              <div key={label} className="rounded-xl p-4" style={{ backgroundColor: "var(--dp-info-bg)", border: "1px solid var(--dp-info-border)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="h-3.5 w-3.5" style={{ color: "var(--dp-text-4)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--dp-text-4)" }}>{label}</p>
                </div>
                <p className={`text-sm font-bold ${mono ? "font-mono" : ""}`} style={{ color: accent }}>{value}</p>
              </div>
            ))}

            {/* Status card */}
            <div className="rounded-xl p-4" style={{ backgroundColor: "var(--dp-info-bg)", border: "1px solid var(--dp-info-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--dp-text-4)" }}>Status</p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.dot }} />
                <p className="text-sm font-bold" style={{ color: "var(--dp-text-1)" }}>{status.label}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ borderColor: "var(--dp-card-border)", color: "var(--dp-text-3)", backgroundColor: "var(--dp-info-bg)" }}
            >
              Close
            </button>
            <Link
              href="/payroll"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 hover:-translate-y-px"
              style={{ backgroundColor: "var(--dp-primary)", color: "#fff", boxShadow: "0 4px 12px rgba(51,56,160,0.35)" }}
            >
              Open in Documents <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch("/api/documents", { cache: "no-store" });
        const result = (await response.json()) as { data?: Document[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to fetch documents.");
        setDocuments((result.data ?? []).slice(0, 10));
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
      setLoading(false);
    }
    fetchDocuments();
  }, []);

  const total     = documents.length;
  const completed = documents.filter((d) => d.status?.toLowerCase() === "completed").length;
  const pending   = documents.filter((d) => d.status?.toLowerCase() === "pending").length;
  const overdue   = documents.filter((d) => d.status?.toLowerCase() === "overdue").length;

  const analytics = [
    { label: "Total Documents", value: String(total),     sub: "All recorded",                                                                          icon: FileText,      accent: "var(--dp-primary)",  bg: "var(--dp-primary-bg)", bar: 100 },
    { label: "Completed",       value: String(completed), sub: total > 0 ? `${Math.round((completed/total)*100)}% rate` : "0%",                         icon: CheckCircle2,  accent: "#16A34A",            bg: "rgba(22,163,74,0.12)",  bar: total > 0 ? Math.round((completed/total)*100) : 0 },
    { label: "Pending",         value: String(pending),   sub: "Awaiting action",                                                                        icon: Clock,         accent: "#D97706",            bg: "rgba(217,119,6,0.12)",  bar: total > 0 ? Math.round((pending/total)*100)   : 0 },
    { label: "Overdue",         value: String(overdue),   sub: overdue > 0 ? "Needs attention" : "None overdue",                                         icon: AlertTriangle, accent: "#DC2626",            bg: "rgba(220,38,38,0.12)",  bar: total > 0 ? Math.round((overdue/total)*100)   : 0 },
  ];

  return (
    <main className="min-h-screen p-6 sm:p-8" style={{ backgroundColor: "var(--dp-page-bg)" }}>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--dp-text-1)" }}>Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--dp-text-3)" }}>Overview of document tracking activity</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {analytics.map(({ label, value, sub, icon: Icon, accent, bg, bar }) => (
          <div
            key={label}
            className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ backgroundColor: "var(--dp-card-bg)", border: "1px solid var(--dp-card-border)" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: bg }}>
                <Icon className="h-5 w-5" style={{ color: accent }} />
              </div>
              <div className="h-1.5 w-16 rounded-full overflow-hidden mt-3" style={{ backgroundColor: "var(--dp-divider)" }}>
                <div className="h-full rounded-full" style={{ width: `${bar}%`, backgroundColor: accent }} />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--dp-text-1)" }}>
              {loading ? "—" : value}
            </p>
            <p className="mt-0.5 text-sm font-medium" style={{ color: "var(--dp-text-2)" }}>{label}</p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--dp-text-4)" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Documents Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--dp-card-bg)", border: "1px solid var(--dp-card-border)" }}>

        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--dp-divider)" }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--dp-text-1)" }}>Recent Documents</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--dp-text-4)" }}>Latest document activity</p>
          </div>
          <Link
            href="/payroll"
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all hover:opacity-90 hover:-translate-y-px"
            style={{ backgroundColor: "var(--dp-primary)", color: "#fff", boxShadow: "0 2px 8px rgba(51,56,160,0.28)" }}
          >
            View All <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Column headers */}
        <div
          className="grid px-6 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "1fr 2.2fr 0.9fr 1.1fr 1fr 80px",
            backgroundColor: "var(--dp-header-bg)",
            color: "var(--dp-text-4)",
            borderBottom: "1px solid var(--dp-divider)",
          }}
        >
          <span>Tracking #</span>
          <span>Title</span>
          <span>Type</span>
          <span>Date</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--dp-primary)" }} />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: "var(--dp-info-bg)" }}>
              <FileText className="h-6 w-6" style={{ color: "var(--dp-text-4)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--dp-text-4)" }}>No documents found.</p>
          </div>
        ) : (
          documents.map((doc, i) => {
            const statusKey = doc.status?.toLowerCase().replace(" ", "_");
            const status = statusConfig[statusKey] ?? statusConfig["pending"];

            return (
              <div
                key={doc.document_id}
                className="grid items-center px-6 py-3.5 transition-colors"
                style={{
                  gridTemplateColumns: "1fr 2.2fr 0.9fr 1.1fr 1fr 80px",
                  borderBottom: i < documents.length - 1 ? "1px solid var(--dp-divider)" : "none",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--dp-row-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <span className="text-xs font-mono font-semibold flex items-center gap-1.5" style={{ color: "var(--dp-primary)" }}>
                  #{doc.tracking_num}
                  {doc.is_urgent && (
                    <span className="rounded-full px-1.5 py-0.5 text-xs font-bold leading-none" style={{ backgroundColor: "rgba(248,113,113,0.15)", color: "#f87171" }}>!</span>
                  )}
                </span>

                <p className="truncate pr-4 text-sm font-medium" style={{ color: "var(--dp-text-1)" }}>{doc.title}</p>
                <span className="text-xs" style={{ color: "var(--dp-text-3)" }}>{doc.type ?? "—"}</span>
                <span className="text-xs tabular-nums" style={{ color: "var(--dp-text-3)" }}>
                  {new Date(doc.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </span>

                <div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
                    style={{ backgroundColor: status.bg, color: status.color }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                    {status.label}
                  </span>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:shadow-md hover:-translate-y-px"
                    style={{ backgroundColor: "var(--dp-primary-bg)", color: "var(--dp-primary)", border: "1px solid var(--dp-primary-bd)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--dp-primary)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--dp-primary-bg)"; e.currentTarget.style.color = "var(--dp-primary)"; }}
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedDoc && <DocumentModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}
    </main>
  );
}
