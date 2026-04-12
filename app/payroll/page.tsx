"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  FileText,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  X,
  Upload,
  Paperclip,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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
    icon: <Clock className="h-3.5 w-3.5" />,
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

const STATUS_FILTERS = ["All", "Completed", "Pending", "Overdue"];
const DOCUMENT_TYPES = [
  "Payroll",
  "Memo",
  "Contract",
  "Report",
  "Request",
  "Other",
];

type FormData = {
  title: string;
  type: string;
  status: string;
  is_urgent: boolean;
  tracking_num: string;
  file: File | null;
};

const EMPTY_FORM: FormData = {
  title: "",
  type: "",
  status: "pending",
  is_urgent: false,
  tracking_num: "",
  file: null,
};

const MAX_FILE_MB = 5;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFormError("Only PDF or Word (.doc/.docx) files are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setFormError(`File must be under ${MAX_FILE_MB}MB.`);
      e.target.value = "";
      return;
    }
    setFormError("");
    setForm((f) => ({ ...f, file }));
  }

  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim() || !form.type || !form.tracking_num.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    let file_url: string | null = null;

    if (form.file) {
      const ext = form.file.name.split(".").pop();
      const filePath = `documents/${Date.now()}_${form.tracking_num}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, form.file, { upsert: false });

      if (uploadError) {
        setFormError("File upload failed: " + uploadError.message);
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);
      file_url = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from("Documents")
      .insert([
        {
          title: form.title.trim(),
          type: form.type,
          status: form.status,
          is_urgent: form.is_urgent,
          tracking_num: Number(form.tracking_num),
          ...(file_url && { file_url }),
        },
      ])
      .select();

    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setDocuments((prev) => [data[0], ...prev]);
    setShowModal(false);
    setForm(EMPTY_FORM);
  }

  useEffect(() => {
    async function fetchDocuments() {
      const { data, error } = await supabase
        .from("Documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error.message);
      } else {
        setDocuments(data ?? []);
      }
      setLoading(false);
    }
    fetchDocuments();
  }, []);

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      doc.title?.toLowerCase().includes(search.toLowerCase()) ||
      String(doc.tracking_num).includes(search) ||
      doc.type?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      doc.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <main
      className="min-h-screen p-6 sm:p-8"
      style={{ backgroundColor: "#F7F7F7" }}
    >
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#1E1E2E" }}
          >
            Documents
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
            Complete list of all tracked documents
          </p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setFormError("");
          }}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5"
          style={{
            backgroundColor: "#3338A0",
            color: "#fff",
            boxShadow: "0 4px 14px rgba(51,56,160,0.25)",
          }}
        >
          <Plus className="h-4 w-4" />
          Add Document
        </button>
      </div>

      {/* Search + Filter Bar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "#9CA3AF" }}
          />
          <input
            type="text"
            placeholder="Search by title, tracking , or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-300"
            style={{
              borderColor: "#E5E7EB",
              backgroundColor: "#fff",
              color: "#111827",
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 shrink-0" style={{ color: "#9CA3AF" }} />
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: statusFilter === s ? "#3338A0" : "#F3F4F6",
                  color: statusFilter === s ? "#fff" : "#6B7280",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Table */}
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
              All Documents
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              {loading
                ? "Loading…"
                : `${filtered.length} document${filtered.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: "#EEF0FB" }}
          >
            <FileText className="h-4 w-4" style={{ color: "#3338A0" }} />
          </div>
        </div>

        {/* Column Headers */}
        <div
          className="grid gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "1fr 2.5fr 1fr 1fr 1fr",
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

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2
              className="h-6 w-6 animate-spin"
              style={{ color: "#3338A0" }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <AlertTriangle className="h-8 w-8" style={{ color: "#E5E7EB" }} />
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              No documents found.
            </p>
          </div>
        ) : (
          filtered.map((doc, i) => {
            const statusKey = doc.status?.toLowerCase();
            const status = statusConfig[statusKey] ?? statusConfig["pending"];
            return (
              <div
                key={doc.document_id}
                className="grid gap-4 items-center px-5 py-4 transition-colors hover:bg-gray-50 cursor-pointer"
                style={{
                  gridTemplateColumns: "1fr 2.5fr 1fr 1fr 1fr",
                  borderBottom:
                    i < filtered.length - 1 ? "1px solid #F3F4F6" : "none",
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
                  {doc.type ?? "—"}
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
      {/* Add Document Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setForm(EMPTY_FORM);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: "#fff" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#1E1E2E" }}>
                  Add Document
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                  Fill in the details to create a new document record.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(EMPTY_FORM);
                }}
                className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                style={{ color: "#9CA3AF" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="flex flex-col gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs font-semibold"
                  style={{ color: "#374151" }}
                >
                  Title <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Budget Request Q2"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  style={{ borderColor: "#E5E7EB", color: "#111827" }}
                />
              </div>

              {/* Type */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs font-semibold"
                  style={{ color: "#374151" }}
                >
                  Type <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                  className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                  style={{
                    borderColor: "#E5E7EB",
                    color: form.type ? "#111827" : "#9CA3AF",
                  }}
                >
                  <option value="" disabled>
                    Select type…
                  </option>
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs font-semibold"
                  style={{ color: "#374151" }}
                >
                  Attach File{" "}
                  <span className="font-normal" style={{ color: "#9CA3AF" }}>
                    (PDF or Word, max 5MB)
                  </span>
                </label>
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 transition-colors hover:bg-gray-50"
                  style={{ borderColor: form.file ? "#3338A0" : "#E5E7EB" }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: form.file ? "#EEF0FB" : "#F9FAFB",
                    }}
                  >
                    {form.file ? (
                      <Paperclip
                        className="h-4 w-4"
                        style={{ color: "#3338A0" }}
                      />
                    ) : (
                      <Upload
                        className="h-4 w-4"
                        style={{ color: "#9CA3AF" }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {form.file ? (
                      <>
                        <p
                          className="truncate text-xs font-semibold"
                          style={{ color: "#3338A0" }}
                        >
                          {form.file.name}
                        </p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          {(form.file.size / 1024).toFixed(1)} KB
                        </p>
                      </>
                    ) : (
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>
                        Click to browse — .pdf, .doc, .docx
                      </p>
                    )}
                  </div>
                  {form.file && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setForm((f) => ({ ...f, file: null }));
                      }}
                      className="shrink-0 rounded p-1 hover:bg-gray-100"
                      style={{ color: "#9CA3AF" }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Urgent Toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() =>
                    setForm((f) => ({ ...f, is_urgent: !f.is_urgent }))
                  }
                  className="relative h-5 w-9 rounded-full transition-colors duration-200"
                  style={{
                    backgroundColor: form.is_urgent ? "#DC2626" : "#E5E7EB",
                  }}
                >
                  <div
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                    style={{
                      transform: form.is_urgent
                        ? "translateX(1.1rem)"
                        : "translateX(0.125rem)",
                    }}
                  />
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: form.is_urgent ? "#DC2626" : "#374151" }}
                >
                  Mark as Urgent
                </span>
              </label>

              {/* Error */}
              {formError && (
                <p
                  className="rounded-lg px-3 py-2 text-xs font-medium"
                  style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
                >
                  {formError}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setForm(EMPTY_FORM);
                  }}
                  className="flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "#3338A0", color: "#fff" }}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {submitting ? "Saving…" : "Add Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
