"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  FileText,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  X,
  Upload,
  Paperclip,
  PenLine,
  Download,
  Ban,
  Mail,
  Eye,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  completed: { label: "Completed", color: "#15803D", bg: "#F0FDF4", dot: "#22C55E" },
  pending:   { label: "Pending",   color: "#92400E", bg: "#FFFBEB", dot: "#F59E0B" },
  overdue:   { label: "Overdue",   color: "#991B1B", bg: "#FEF2F2", dot: "#EF4444" },
  in_transit:{ label: "In Transit",color: "#1E40AF", bg: "#EFF6FF", dot: "#3B82F6" },
};

type Document = {
  document_id: number;
  tracking_num: number;
  title: string;
  status: string;
  is_urgent: boolean;
  created_at: string;
  type: string;
  file_url?: string | null;
};

type Department = {
  department_id: number;
  department_name: string;
};

type UserOption = {
  user_id: number;
  name: string;
  department_id: number;
};

type ChainLog = {
  log_id: number;
  date_received: string | null;
  date_released: string | null;
  remarks: string | null;
  document_id: number;
  from_department_id: number | null;
  to_department_id: number | null;
  received_by: number | null;
  released_by: number | null;
  from_department_name: string | null;
  to_department_name: string | null;
  received_by_name: string | null;
  released_by_name: string | null;
};

type StatusHistory = {
  status_id: number;
  status: string;
  updated_at: string;
  document_id: number;
};

type TrackerStep = {
  id: string;
  label: string;
  timestamp: string | null;
  caption: string;
  state: "done" | "current" | "upcoming";
  icon: React.ReactNode;
};

type ChainOfCustody = {
  document: Document;
  current_department_id: number | null;
  current_department_name: string | null;
  latest_status: string;
  status_history: StatusHistory[];
  logs: ChainLog[];
};

type FormData = {
  title: string;
  type: string;
  status: string;
  is_urgent: boolean;
  file: File | null;
};

type MovementForm = {
  to_department_id: string;
  released_by: string;
  received_by: string;
  remarks: string;
  status: string;
};

type StatusForm = {
  status: string;
};

type SignerInfo = {
  name: string;
  email: string;
};

type SigningStatus = {
  envelopeId: string;
  status: string;
  sentDateTime?: string;
  completedDateTime?: string;
  signers: { name: string; email: string; status: string; signedDateTime?: string }[];
} | null;

const STATUS_FILTERS = ["All", "Completed", "Pending", "Overdue", "In Transit"];
const DOCUMENT_TYPES = [
  "Payroll",
  "Memo",
  "Contract",
  "Report",
  "Request",
  "Other",
];
const DOCUMENT_STATUSES = ["pending", "in_transit", "completed", "overdue"];

const EMPTY_FORM: FormData = {
  title: "",
  type: "",
  status: "pending",
  is_urgent: false,
  file: null,
};

const EMPTY_MOVEMENT_FORM: MovementForm = {
  to_department_id: "",
  released_by: "",
  received_by: "",
  remarks: "",
  status: "in_transit",
};

const EMPTY_STATUS_FORM: StatusForm = {
  status: "pending",
};

const MAX_FILE_MB = 10;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function CustomSelect({ label, value, onChange, options, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div>
      <div className="mb-1.5 flex items-center">
        <span className="inline-block w-0.5 h-3.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: "#3338A0" }} />
        <label className="text-xs font-semibold" style={{ color: "#374151" }}>{label}</label>
      </div>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm text-left transition-all duration-150"
          style={{
            borderColor: open ? "#3338A0" : "#E5E7EB",
            backgroundColor: open ? "#F8F9FF" : "#fff",
            color: selected ? "#111827" : "#9CA3AF",
            boxShadow: open ? "0 0 0 3px rgba(51,56,160,0.08)" : "none",
          }}
        >
          <span className="truncate">{selected ? selected.label : (placeholder ?? "Select…")}</span>
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 ml-2 transition-transform duration-200"
            style={{ color: open ? "#3338A0" : "#9CA3AF", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
        {open && (
          <div
            className="absolute left-0 right-0 top-full z-[100] mt-1 rounded-xl overflow-hidden"
            style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", maxHeight: "220px", overflowY: "auto" }}
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors"
                  style={{
                    backgroundColor: isSelected ? "#EEF0FB" : "transparent",
                    color: isSelected ? "#3338A0" : "#374151",
                    fontWeight: isSelected ? 600 : 400,
                    borderBottom: i < options.length - 1 ? "1px solid #F3F4F6" : "none",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "#F8F9FF"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <span>{o.label}</span>
                  {isSelected && (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#3338A0" }}>
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function sanitizeFileNamePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/-+/g, "-");
}

function getFileType(url: string | null | undefined): { ext: string; badge: { bg: string; color: string; border: string } } | null {
  if (!url) return null;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, { bg: string; color: string; border: string }> = {
    pdf:  { bg: "#FFF1F2", color: "#BE123C", border: "#FECDD3" },
    doc:  { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
    docx: { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  };
  return { ext: ext.toUpperCase() || "FILE", badge: map[ext] ?? { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" } };
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTrackerSteps(chain: ChainOfCustody | null): TrackerStep[] {
  if (!chain) return [];

  const createdStep: TrackerStep = {
    id: `created-${chain.document.document_id}`,
    label: "Document Created",
    timestamp: chain.document.created_at,
    caption: chain.document.type,
    state: "done",
    icon: <FileText className="h-5 w-5" />,
  };

  const steps: TrackerStep[] = [
    createdStep,
    ...chain.logs.map<TrackerStep>((log, index) => ({
      id: `log-${log.log_id}`,
      label: log.to_department_name
        ? `Received by ${log.to_department_name}`
        : `Movement ${index + 1}`,
      timestamp: log.date_received,
      caption: log.remarks || "Department handoff",
      state: "done",
      icon: <Paperclip className="h-5 w-5" />,
    })),
    ...chain.status_history.map<TrackerStep>((item) => ({
      id: `status-${item.status_id}`,
      label: item.status.replaceAll("_", " "),
      timestamp: item.updated_at,
      caption: "Status update",
      state:
        item.status === chain.latest_status
          ? "current"
          : "done",
      icon:
        item.status === "completed" ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : item.status === "overdue" ? (
          <AlertTriangle className="h-5 w-5" />
        ) : (
          <Clock className="h-5 w-5" />
        ),
    })),
  ].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return aTime - bTime;
  });

  const latestCurrentIndex = steps.findLastIndex(
    (step) => step.state === "current",
  );
  const currentIndex =
    latestCurrentIndex >= 0 ? latestCurrentIndex : steps.length - 1;

  return steps.map((step, index) => ({
    ...step,
    state:
      index < currentIndex
        ? "done"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedChain, setSelectedChain] = useState<ChainOfCustody | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [movementForm, setMovementForm] = useState<MovementForm>(EMPTY_MOVEMENT_FORM);
  const [statusForm, setStatusForm] = useState<StatusForm>(EMPTY_STATUS_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [movementSubmitting, setMovementSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [detailTab, setDetailTab] = useState<"custody" | "actions" | "esign">("custody");

  // DocuSign state
  const [signingStatus, setSigningStatus] = useState<SigningStatus>(null);
  const [signingLoading, setSigningLoading] = useState(false);
  const [signers, setSigners] = useState<SignerInfo[]>([{ name: "", email: "" }]);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signError, setSignError] = useState("");
  const [signSubmitting, setSignSubmitting] = useState(false);
  const [voidingEnvelope, setVoidingEnvelope] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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

      setDocuments(result.data ?? []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setFormError("Unable to load documents right now.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchReferenceData() {
    try {
      const [departmentsResponse, usersResponse] = await Promise.all([
        fetch("/api/admin/departments", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
      ]);

      const departmentResult = (await departmentsResponse.json()) as {
        data?: Department[];
        error?: string;
      };
      const usersResult = (await usersResponse.json()) as {
        data?: UserOption[];
        error?: string;
      };

      if (departmentsResponse.ok) {
        setDepartments(departmentResult.data ?? []);
      }
      if (usersResponse.ok) {
        setUsers(usersResult.data ?? []);
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  }

  async function fetchDocumentDetails(documentId: number) {
    setDetailsLoading(true);
    setDetailsError("");

    try {
      const response = await fetch(`/api/documents/${documentId}/chain-of-custody`, {
        cache: "no-store",
      });
      const result = (await response.json()) as {
        data?: ChainOfCustody;
        error?: string;
      };

      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "Unable to load document details.");
      }

      setSelectedChain(result.data);
      setMovementForm({
        ...EMPTY_MOVEMENT_FORM,
        status:
          result.data.latest_status === "completed"
            ? "completed"
            : "in_transit",
      });
      setStatusForm({
        status: result.data.latest_status || "pending",
      });
    } catch (error) {
      setDetailsError(
        error instanceof Error
          ? error.message
          : "Unable to load document details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  }

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

    if (!form.title.trim() || !form.type) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      let fileUrl: string | null = null;

      if (form.file) {
        const fileExtension =
          form.file.name.split(".").pop()?.toLowerCase() ?? "file";
        const titlePart = sanitizeFileNamePart(form.title.trim() || "document");
        const filePath = `documents/${Date.now()}-${titlePart}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, form.file, { upsert: false });

        if (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);

        fileUrl = publicUrlData.publicUrl;
      }

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          type: form.type,
          status: form.status,
          is_urgent: form.is_urgent,
          file_url: fileUrl,
        }),
      });

      const result = (await response.json()) as {
        data?: Document;
        error?: string;
      };

      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "Unable to create document.");
      }

      const createdDocument = result.data;
      setDocuments((prev) => [createdDocument, ...prev]);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to create document.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenDetails(documentId: number) {
    setSelectedDocumentId(documentId);
    setSelectedChain(null);
    setSigningStatus(null);
    setSignError("");
    setDetailTab("custody");
    await Promise.all([
      fetchDocumentDetails(documentId),
      fetchSigningStatus(documentId),
    ]);
  }

  async function handleCreateMovement(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedDocumentId || !selectedChain) return;
    if (!movementForm.to_department_id) {
      setDetailsError("Please select the next department.");
      return;
    }

    setMovementSubmitting(true);
    setDetailsError("");

    try {
      const response = await fetch(`/api/documents/${selectedDocumentId}/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from_department_id: selectedChain.current_department_id,
          to_department_id: Number(movementForm.to_department_id),
          released_by: movementForm.released_by
            ? Number(movementForm.released_by)
            : null,
          received_by: movementForm.received_by
            ? Number(movementForm.received_by)
            : null,
          remarks: movementForm.remarks,
          date_received: new Date().toISOString(),
          date_released: new Date().toISOString(),
          status: movementForm.status,
        }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to move document.");
      }

      await Promise.all([
        fetchDocuments(),
        fetchDocumentDetails(selectedDocumentId),
      ]);
      setMovementForm({
        ...EMPTY_MOVEMENT_FORM,
        status: movementForm.status,
      });
    } catch (error) {
      setDetailsError(
        error instanceof Error ? error.message : "Unable to move document.",
      );
    } finally {
      setMovementSubmitting(false);
    }
  }

  async function handleCreateStatus(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedDocumentId) return;
    if (!statusForm.status) {
      setDetailsError("Please select a status.");
      return;
    }

    setStatusSubmitting(true);
    setDetailsError("");

    try {
      const response = await fetch(
        `/api/documents/${selectedDocumentId}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: statusForm.status,
            updated_at: new Date().toISOString(),
          }),
        },
      );

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to update status.");
      }

      await Promise.all([
        fetchDocuments(),
        fetchDocumentDetails(selectedDocumentId),
      ]);
    } catch (error) {
      setDetailsError(
        error instanceof Error ? error.message : "Unable to update status.",
      );
    } finally {
      setStatusSubmitting(false);
    }
  }

  async function fetchSigningStatus(documentId: number) {
    setSigningLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/sign`);
      const result = (await res.json()) as { data?: SigningStatus; error?: string };
      if (res.ok && result.data && result.data.envelopeId) {
        setSigningStatus(result.data);
      } else {
        setSigningStatus(null);
      }
    } catch {
      setSigningStatus(null);
    } finally {
      setSigningLoading(false);
    }
  }

  async function handleSendForSigning(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDocumentId) return;

    const validSigners = signers.filter((s) => s.name.trim() && s.email.trim());
    if (validSigners.length === 0) {
      setSignError("Add at least one signer with a name and email.");
      return;
    }

    setSignSubmitting(true);
    setSignError("");

    try {
      const res = await fetch(`/api/documents/${selectedDocumentId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signers: validSigners }),
      });
      const result = (await res.json()) as { data?: { envelope_id: string; status: string }; error?: string };

      if (!res.ok) throw new Error(result.error ?? "Failed to send for signing.");

      setShowSignModal(false);
      setSigners([{ name: "", email: "" }]);
      await Promise.all([fetchDocuments(), fetchSigningStatus(selectedDocumentId)]);
    } catch (err) {
      setSignError(err instanceof Error ? err.message : "Failed to send for signing.");
    } finally {
      setSignSubmitting(false);
    }
  }

  async function handleVoidEnvelope() {
    if (!selectedDocumentId) return;
    if (!confirm("Are you sure you want to void this signing request?")) return;

    setVoidingEnvelope(true);
    try {
      const res = await fetch(`/api/documents/${selectedDocumentId}/sign`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Voided by DPWH admin" }),
      });
      if (!res.ok) {
        const r = (await res.json()) as { error?: string };
        throw new Error(r.error ?? "Failed to void envelope.");
      }
      await Promise.all([fetchDocuments(), fetchSigningStatus(selectedDocumentId)]);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Failed to void envelope.");
    } finally {
      setVoidingEnvelope(false);
    }
  }

  async function handleDownloadSigned() {
    if (!selectedDocumentId) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/documents/${selectedDocumentId}/sign/download`);
      if (!res.ok) {
        const r = (await res.json()) as { error?: string };
        throw new Error(r.error ?? "Download failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed-document-${selectedDocumentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
    fetchReferenceData();
  }, []);


  const filtered = documents.filter((doc) => {
    const matchesSearch =
      doc.title?.toLowerCase().includes(search.toLowerCase()) ||
      String(doc.tracking_num).includes(search) ||
      doc.type?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      doc.status?.toLowerCase() === statusFilter.toLowerCase().replace(" ", "_");

    return matchesSearch && matchesStatus;
  });

  const trackerSteps = getTrackerSteps(selectedChain);

  const closeDetails = () => {
    setSelectedDocumentId(null);
    setSelectedChain(null);
    setDetailsError("");
    setSigningStatus(null);
    setSignError("");
  };

  const inputCls = "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 transition-shadow";
  const inputStyle = { borderColor: "#E5E7EB", color: "#111827", backgroundColor: "#fff" };
  const sectionCls = "rounded-2xl border p-5";
  const sectionStyle = { borderColor: "#E5E7EB", backgroundColor: "#fff" };

  return (
    <main className="min-h-screen p-6 sm:p-8" style={{ backgroundColor: "#F7F7F7" }}>

      {/* ── Page header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1E1E2E" }}>Documents</h1>
          <p className="mt-0.5 text-sm" style={{ color: "#6B7280" }}>Complete list of all tracked documents</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(""); }}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90 hover:-translate-y-px"
          style={{ backgroundColor: "#3338A0", color: "#fff", boxShadow: "0 4px 14px rgba(51,56,160,0.28)" }}
        >
          <Plus className="h-4 w-4" /> Add Document
        </button>
      </div>

      {/* ── Search + filters ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
          <input
            type="text"
            placeholder="Search by title, tracking, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#fff", color: "#111827" }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 shrink-0" style={{ color: "#9CA3AF" }} />
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                style={{ backgroundColor: statusFilter === s ? "#3338A0" : "#F3F4F6", color: statusFilter === s ? "#fff" : "#6B7280" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Documents table ── */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
        {/* Table bar */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "#F3F4F6" }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>All Documents</h2>
            <p className="mt-0.5 text-xs" style={{ color: "#9CA3AF" }}>
              {loading ? "Loading…" : `${filtered.length} document${filtered.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: "#EEF0FB" }}>
            <FileText className="h-4 w-4" style={{ color: "#3338A0" }} />
          </div>
        </div>

        {/* Column headers */}
        <div
          className="grid px-6 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 1fr 80px", backgroundColor: "#FAFAFA", color: "#9CA3AF", borderBottom: "1px solid #F3F4F6" }}
        >
          <span>Tracking #</span>
          <span>Title</span>
          <span>File</span>
          <span>Type</span>
          <span>Date</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#3338A0" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
              <FileText className="h-6 w-6" style={{ color: "#D1D5DB" }} />
            </div>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>No documents found.</p>
          </div>
        ) : (
          filtered.map((doc, i) => {
            const statusKey = doc.status?.toLowerCase().replace(" ", "_");
            const status = statusConfig[statusKey] ?? statusConfig.pending;
            return (
              <div
                key={doc.document_id}
                className="grid items-center px-6 py-3.5 transition-colors hover:bg-slate-50/80"
                style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 1fr 80px", borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none" }}
              >
                {/* Tracking # */}
                <span className="flex items-center gap-1.5 font-mono text-xs font-semibold" style={{ color: "#3338A0" }}>
                  #{doc.tracking_num}
                  {doc.is_urgent && doc.status?.toLowerCase() !== "completed" && (
                    <span className="rounded-full px-1.5 py-0.5 text-xs font-bold" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>!</span>
                  )}
                </span>

                {/* Title */}
                <div className="min-w-0 pr-4">
                  <p className="truncate text-sm font-medium" style={{ color: "#111827" }}>{doc.title}</p>
                </div>

                {/* File */}
                <div>
                  {(() => {
                    const ft = getFileType(doc.file_url);
                    if (!ft) return <span className="text-xs" style={{ color: "#D1D5DB" }}>—</span>;
                    return (
                      <a
                        href={doc.file_url!} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold tracking-wider uppercase transition-opacity hover:opacity-75"
                        style={{ backgroundColor: ft.badge.bg, color: ft.badge.color, border: `1px solid ${ft.badge.border}` }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ArrowUpRight className="h-2.5 w-2.5" />
                        View {ft.ext}
                      </a>
                    );
                  })()}
                </div>

                {/* Type */}
                <span className="text-xs" style={{ color: "#6B7280" }}>{doc.type ?? "—"}</span>

                {/* Date */}
                <span className="text-xs tabular-nums" style={{ color: "#6B7280" }}>
                  {new Date(doc.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </span>

                {/* Status */}
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap" style={{ backgroundColor: status.bg, color: status.color }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                    {status.label}
                  </span>
                </div>

                {/* View button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(doc.document_id)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:-translate-y-px hover:shadow-md"
                    style={{ backgroundColor: "#EEF0FB", color: "#3338A0", border: "1px solid #D4D6F0" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#3338A0"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#3338A0"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#EEF0FB"; e.currentTarget.style.color = "#3338A0"; e.currentTarget.style.borderColor = "#D4D6F0"; }}
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ══════════════════════════════════════════
          ADD DOCUMENT MODAL
      ══════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setForm(EMPTY_FORM); } }}
        >
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: "#fff", animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <style>{`@keyframes modalIn { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ background: "linear-gradient(135deg,#3338A0 0%,#4F54C4 100%)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>New Record</p>
                  <p className="text-sm font-bold text-white">Add Document</p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }} className="rounded-lg p-1.5 transition-colors hover:bg-white/20" style={{ color: "rgba(255,255,255,0.7)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleAddDocument} className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "#374151" }}>Title <span style={{ color: "#DC2626" }}>*</span></label>
                <input type="text" placeholder="e.g. Budget Request Q2" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputCls} style={inputStyle} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "#374151" }}>Type <span style={{ color: "#DC2626" }}>*</span></label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className={inputCls} style={{ ...inputStyle, color: form.type ? "#111827" : "#9CA3AF" }}>
                  <option value="" disabled>Select type…</option>
                  {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "#374151" }}>
                  Attach File <span className="font-normal" style={{ color: "#9CA3AF" }}>(PDF or Word, max 10MB)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-colors hover:bg-gray-50" style={{ borderColor: form.file ? "#3338A0" : "#E5E7EB" }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: form.file ? "#EEF0FB" : "#F9FAFB" }}>
                    {form.file ? <Paperclip className="h-4 w-4" style={{ color: "#3338A0" }} /> : <Upload className="h-4 w-4" style={{ color: "#9CA3AF" }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {form.file ? (
                      <><p className="truncate text-xs font-semibold" style={{ color: "#3338A0" }}>{form.file.name}</p><p className="text-xs" style={{ color: "#9CA3AF" }}>{(form.file.size / 1024).toFixed(1)} KB</p></>
                    ) : (
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>Click to browse — .pdf, .doc, .docx</p>
                    )}
                  </div>
                  {form.file && (
                    <button type="button" onClick={(e) => { e.preventDefault(); setForm((f) => ({ ...f, file: null })); }} className="shrink-0 rounded p-1 hover:bg-gray-100" style={{ color: "#9CA3AF" }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              <label className="flex cursor-pointer items-center gap-3 select-none">
                <div onClick={() => setForm((f) => ({ ...f, is_urgent: !f.is_urgent }))} className="relative h-5 w-9 rounded-full transition-colors duration-200" style={{ backgroundColor: form.is_urgent ? "#DC2626" : "#E5E7EB" }}>
                  <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200" style={{ transform: form.is_urgent ? "translateX(1.1rem)" : "translateX(0.125rem)" }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: form.is_urgent ? "#DC2626" : "#374151" }}>Mark as Urgent</span>
              </label>

              {formError && <p className="rounded-xl px-3 py-2 text-xs font-medium" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>{formError}</p>}

              <div className="mt-1 flex gap-2">
                <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>Cancel</button>
                <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#3338A0", color: "#fff" }}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {submitting ? "Saving…" : "Add Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DOCUMENT DETAIL MODAL
      ══════════════════════════════════════════ */}
      {selectedDocumentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeDetails(); }}
        >
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl shadow-2xl" style={{ backgroundColor: "#F7F7F7", animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 rounded-t-2xl" style={{ background: "linear-gradient(135deg,#3338A0 0%,#4F54C4 100%)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>Document Tracking</p>
                  <p className="text-sm font-bold text-white">
                    {selectedChain ? `#${selectedChain.document.tracking_num} — ${selectedChain.document.title}` : "Loading…"}
                  </p>
                </div>
              </div>
              <button onClick={closeDetails} className="rounded-lg p-1.5 transition-colors hover:bg-white/20" style={{ color: "rgba(255,255,255,0.7)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#3338A0" }} />
              </div>
            ) : detailsError && !selectedChain ? (
              <div className="m-6 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>{detailsError}</div>
            ) : selectedChain ? (
              <div className="p-6 space-y-5">

                {/* ── Info cards row ── */}
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { label: "Tracking #", value: `#${selectedChain.document.tracking_num}`, mono: true },
                    { label: "Department", value: selectedChain.current_department_name ?? "Not assigned" },
                    { label: "Status", value: selectedChain.latest_status.replaceAll("_", " "), capitalize: true },
                    { label: "Attachment", value: null, fileUrl: selectedChain.document.file_url },
                  ].map(({ label, value, mono, capitalize, fileUrl }) => (
                    <div key={label} className={sectionCls} style={sectionStyle}>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{label}</p>
                      {fileUrl ? (
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: "#3338A0" }}>
                          Open file <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      ) : fileUrl === null && label === "Attachment" ? (
                        <p className="mt-2 text-sm" style={{ color: "#9CA3AF" }}>No file uploaded</p>
                      ) : (
                        <p className={`mt-2 text-sm font-bold ${capitalize ? "capitalize" : ""} ${mono ? "font-mono" : ""}`} style={{ color: "#111827" }}>{value}</p>
                      )}
                    </div>
                  ))}
                </div>

                {detailsError && <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>{detailsError}</div>}

                {/* ── Visual Tracker ── */}
                <div className={sectionCls} style={sectionStyle}>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold" style={{ color: "#1E1E2E" }}>Visual Tracker</h3>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Progress view for this document</p>
                  </div>
                  {trackerSteps.length === 0 ? (
                    <p className="text-sm" style={{ color: "#9CA3AF" }}>No tracker steps yet.</p>
                  ) : (
                    <div className="overflow-x-auto pb-2">
                      <div className="flex min-w-max items-start px-2 pt-3">
                        {trackerSteps.map((step, index) => {
                          const isActive = step.state !== "upcoming";
                          const connectorActive = trackerSteps[index + 1] && trackerSteps[index + 1].state !== "upcoming";
                          return (
                            <div key={step.id} className="flex items-start">
                              <div className="flex w-36 flex-col items-center text-center">
                                <div
                                  className="flex h-12 w-12 items-center justify-center rounded-full border-4 bg-white"
                                  style={{ borderColor: isActive ? "#22C55E" : "#E5E7EB", color: isActive ? "#22C55E" : "#9CA3AF", boxShadow: step.state === "current" ? "0 0 0 6px rgba(34,197,94,0.12)" : "none" }}
                                >
                                  {step.icon}
                                </div>
                                <p className="mt-3 text-xs font-semibold leading-tight capitalize" style={{ color: isActive ? "#111827" : "#9CA3AF" }}>{step.label}</p>
                                <p className="mt-1 text-xs" style={{ color: "#9CA3AF" }}>{formatDateTime(step.timestamp)}</p>
                              </div>
                              {index < trackerSteps.length - 1 && (
                                <div className="mt-6 h-0.5 w-20 rounded-full" style={{ backgroundColor: connectorActive ? "#22C55E" : "#E5E7EB" }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Tabbed bottom section ── */}
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
                  {/* Tab bar */}
                  <div className="flex items-center border-b px-6" style={{ borderColor: "#E5E7EB" }}>
                    {(["custody", "actions", "esign"] as const).map((tab) => {
                      const labels = { custody: "Chain of Custody", actions: "Actions", esign: "E-Signature" };
                      return (
                        <button
                          key={tab}
                          onClick={() => setDetailTab(tab)}
                          className="relative py-3.5 px-1 mr-6 text-sm font-semibold transition-colors duration-150"
                          style={{
                            color: detailTab === tab ? "#3338A0" : "#9CA3AF",
                            borderBottom: detailTab === tab ? "2px solid #3338A0" : "2px solid transparent",
                            marginBottom: "-1px",
                            background: "transparent",
                          }}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-5" style={{ minHeight: "420px" }}>

                    {/* ── Tab: Chain of Custody ── */}
                    {detailTab === "custody" && (
                      <div className="space-y-5">
                        <div>
                          <div className="mb-3">
                            <h3 className="text-sm font-semibold" style={{ color: "#1E1E2E" }}>Chain of Custody</h3>
                            <p className="text-xs" style={{ color: "#9CA3AF" }}>Full department movement history</p>
                          </div>
                          {selectedChain.logs.length === 0 ? (
                            <p className="text-sm" style={{ color: "#9CA3AF" }}>No movement logs yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {selectedChain.logs.map((log) => (
                                <div key={log.log_id} className="rounded-xl p-3.5" style={{ backgroundColor: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <p className="text-xs font-semibold" style={{ color: "#111827" }}>
                                      {log.from_department_name ?? "Origin"} → {log.to_department_name ?? "Unassigned"}
                                    </p>
                                    <span className="text-xs" style={{ color: "#9CA3AF" }}>{formatDateTime(log.date_received)}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: "#6B7280" }}>
                                    <p>Released by: <span className="font-medium" style={{ color: "#374151" }}>{log.released_by_name ?? "—"}</span></p>
                                    <p>Received by: <span className="font-medium" style={{ color: "#374151" }}>{log.received_by_name ?? "—"}</span></p>
                                    {log.remarks && <p className="col-span-2">Remarks: <span className="font-medium" style={{ color: "#374151" }}>{log.remarks}</span></p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "1.25rem" }}>
                          <div className="mb-3">
                            <h3 className="text-sm font-semibold" style={{ color: "#1E1E2E" }}>Status History</h3>
                            <p className="text-xs" style={{ color: "#9CA3AF" }}>Timeline of status updates</p>
                          </div>
                          {selectedChain.status_history.length === 0 ? (
                            <p className="text-sm" style={{ color: "#9CA3AF" }}>No status history yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {selectedChain.status_history.map((item) => {
                                const sk = item.status.toLowerCase().replace(" ", "_");
                                const sc = statusConfig[sk] ?? statusConfig.pending;
                                return (
                                  <div key={item.status_id} className="flex items-center justify-between rounded-xl px-3.5 py-2.5" style={{ backgroundColor: sc.bg, border: `1px solid ${sc.dot}22` }}>
                                    <div className="flex items-center gap-2">
                                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sc.dot }} />
                                      <span className="text-xs font-semibold capitalize" style={{ color: sc.color }}>{item.status.replaceAll("_", " ")}</span>
                                    </div>
                                    <span className="text-xs tabular-nums" style={{ color: "#9CA3AF" }}>{formatDateTime(item.updated_at)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Tab: Actions ── */}
                    {detailTab === "actions" && (
                      <div className="grid gap-6 sm:grid-cols-2">
                        {/* Move Document */}
                        <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: "#FAFAFA", border: "1px solid #F3F4F6" }}>
                          <div className="flex items-center gap-2.5 pb-3" style={{ borderBottom: "1px solid #F0F0F5" }}>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF0FB" }}>
                              <ArrowUpRight className="h-3.5 w-3.5" style={{ color: "#3338A0" }} />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold" style={{ color: "#1E1E2E" }}>Move Document</h3>
                              <p className="text-xs" style={{ color: "#9CA3AF" }}>Forward to another department</p>
                            </div>
                          </div>
                          <form onSubmit={handleCreateMovement} className="space-y-3">
                            <CustomSelect label="Next Department" value={movementForm.to_department_id} onChange={(v) => setMovementForm((p) => ({ ...p, to_department_id: v }))} options={departments.filter((d) => d.department_id !== selectedChain.current_department_id).map((d) => ({ value: String(d.department_id), label: d.department_name }))} placeholder="Select department…" />
                            <CustomSelect label="Released By" value={movementForm.released_by} onChange={(v) => setMovementForm((p) => ({ ...p, released_by: v }))} options={users.map((u) => ({ value: String(u.user_id), label: u.name }))} placeholder="Select user…" />
                            <CustomSelect label="Received By" value={movementForm.received_by} onChange={(v) => setMovementForm((p) => ({ ...p, received_by: v }))} options={users.map((u) => ({ value: String(u.user_id), label: u.name }))} placeholder="Select user…" />
                            <CustomSelect label="Status After Move" value={movementForm.status} onChange={(v) => setMovementForm((p) => ({ ...p, status: v }))} options={DOCUMENT_STATUSES.map((s) => ({ value: s, label: s.replaceAll("_", " ") }))} />
                            <div>
                              <div className="mb-1.5 flex items-center">
                                <span className="inline-block w-0.5 h-3.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: "#3338A0" }} />
                                <label className="text-xs font-semibold" style={{ color: "#374151" }}>Remarks</label>
                              </div>
                              <textarea rows={2} value={movementForm.remarks} onChange={(e) => setMovementForm((p) => ({ ...p, remarks: e.target.value }))} placeholder="Explain the handoff…" className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E5E7EB", backgroundColor: "#fff", color: "#111827" }} />
                            </div>
                            <button type="submit" disabled={movementSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#3338A0", color: "#fff", boxShadow: "0 4px 14px rgba(51,56,160,0.22)" }}>
                              {movementSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                              {movementSubmitting ? "Saving…" : "Save Movement"}
                            </button>
                          </form>
                        </div>

                        {/* Change Status */}
                        <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: "#FAFAFA", border: "1px solid #F3F4F6" }}>
                          <div className="flex items-center gap-2.5 pb-3" style={{ borderBottom: "1px solid #F0F0F5" }}>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "#F0FDF4" }}>
                              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#16A34A" }} />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold" style={{ color: "#1E1E2E" }}>Change Status</h3>
                              <p className="text-xs" style={{ color: "#9CA3AF" }}>Add a status entry for this document</p>
                            </div>
                          </div>
                          <form onSubmit={handleCreateStatus} className="space-y-3">
                            <CustomSelect label="Status" value={statusForm.status} onChange={(v) => setStatusForm({ status: v })} options={DOCUMENT_STATUSES.map((s) => ({ value: s, label: s.replaceAll("_", " ") }))} />
                            <button type="submit" disabled={statusSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#111827", color: "#fff" }}>
                              {statusSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                              {statusSubmitting ? "Saving…" : "Save Status"}
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* ── Tab: E-Signature ── */}
                    {detailTab === "esign" && (
                      <div className="max-w-md">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold" style={{ color: "#1E1E2E" }}>E-Signature (DocuSign)</h3>
                          <p className="text-xs" style={{ color: "#9CA3AF" }}>Send this document for electronic signing</p>
                        </div>
                        {signingLoading ? (
                          <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#3338A0" }} />
                          </div>
                        ) : signingStatus ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ backgroundColor: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                              <div>
                                <p className="text-xs font-semibold uppercase" style={{ color: "#9CA3AF" }}>Envelope Status</p>
                                <p className="mt-0.5 text-sm font-semibold capitalize" style={{ color: "#111827" }}>{signingStatus.status.replaceAll("_", " ")}</p>
                              </div>
                              <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{
                                backgroundColor: signingStatus.status === "completed" ? "#F0FDF4" : signingStatus.status === "declined" ? "#FEF2F2" : signingStatus.status === "voided" ? "#F3F4F6" : "#FFFBEB",
                                color: signingStatus.status === "completed" ? "#16A34A" : signingStatus.status === "declined" ? "#DC2626" : signingStatus.status === "voided" ? "#6B7280" : "#D97706",
                              }}>{signingStatus.status}</span>
                            </div>
                            {signingStatus.signers.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase" style={{ color: "#9CA3AF" }}>Signers</p>
                                {signingStatus.signers.map((signer, i) => (
                                  <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "#FAFAFA", border: "1px solid #F3F4F6" }}>
                                    <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "#9CA3AF" }} />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-xs font-semibold" style={{ color: "#111827" }}>{signer.name}</p>
                                      <p className="truncate text-xs" style={{ color: "#6B7280" }}>{signer.email}</p>
                                    </div>
                                    <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize" style={{ backgroundColor: signer.status === "completed" ? "#F0FDF4" : "#FFFBEB", color: signer.status === "completed" ? "#16A34A" : "#D97706" }}>{signer.status}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-col gap-2 pt-1">
                              {signingStatus.status === "completed" && (
                                <button type="button" onClick={handleDownloadSigned} disabled={downloadingPdf} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#16A34A", color: "#fff" }}>
                                  {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                  {downloadingPdf ? "Downloading…" : "Download Signed PDF"}
                                </button>
                              )}
                              {(signingStatus.status === "sent" || signingStatus.status === "delivered") && (
                                <button type="button" onClick={handleVoidEnvelope} disabled={voidingEnvelope} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                                  {voidingEnvelope ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                                  {voidingEnvelope ? "Voiding…" : "Void Signing Request"}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : selectedChain.document.file_url ? (
                          <button type="button" onClick={() => { setShowSignModal(true); setSignError(""); }} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: "#3338A0", color: "#fff" }}>
                            <PenLine className="h-4 w-4" /> Send for Signing
                          </button>
                        ) : (
                          <p className="rounded-xl px-3 py-3 text-xs" style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
                            Attach a file to this document before sending for signing.
                          </p>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DOCUSIGN SEND MODAL
      ══════════════════════════════════════════ */}
      {showSignModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSignModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: "#fff", animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ background: "linear-gradient(135deg,#3338A0 0%,#4F54C4 100%)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <PenLine className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>DocuSign</p>
                  <p className="text-sm font-bold text-white">Send for Signing</p>
                </div>
              </div>
              <button onClick={() => setShowSignModal(false)} className="rounded-lg p-1.5 transition-colors hover:bg-white/20" style={{ color: "rgba(255,255,255,0.7)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendForSigning} className="p-6 space-y-4">
              <p className="text-xs" style={{ color: "#6B7280" }}>Add signers who will receive an email invitation from DocuSign.</p>
              <div className="space-y-3">
                {signers.map((signer, index) => (
                  <div key={index} className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: "#374151" }}>Signer {index + 1}</span>
                      {signers.length > 1 && (
                        <button type="button" onClick={() => setSigners(signers.filter((_, i) => i !== index))} className="rounded-lg p-1 hover:bg-gray-100" style={{ color: "#9CA3AF" }}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <input type="text" placeholder="Full name" value={signer.name} onChange={(e) => { const u = [...signers]; u[index] = { ...u[index], name: e.target.value }; setSigners(u); }} className={inputCls} style={inputStyle} />
                    <input type="email" placeholder="Email address" value={signer.email} onChange={(e) => { const u = [...signers]; u[index] = { ...u[index], email: e.target.value }; setSigners(u); }} className={inputCls} style={inputStyle} />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setSigners([...signers, { name: "", email: "" }])} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#3338A0" }}>
                <Plus className="h-3.5 w-3.5" /> Add another signer
              </button>
              {signError && <p className="rounded-xl px-3 py-2 text-xs font-medium" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>{signError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowSignModal(false)} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>Cancel</button>
                <button type="submit" disabled={signSubmitting} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#3338A0", color: "#fff" }}>
                  {signSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
                  {signSubmitting ? "Sending…" : "Send via DocuSign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
