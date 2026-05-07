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
  in_transit: {
    label: "In Transit",
    icon: <Loader2 className="h-3.5 w-3.5" />,
    color: "#2563EB",
    bg: "#EFF6FF",
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

function sanitizeFileNamePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/-+/g, "-");
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
    await fetchDocumentDetails(documentId);
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

  return (
    <main
      className="min-h-screen p-6 sm:p-8"
      style={{ backgroundColor: "#F7F7F7" }}
    >
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

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "#9CA3AF" }}
          />
          <input
            type="text"
            placeholder="Search by title, tracking, or type..."
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
          <div className="flex flex-wrap gap-1.5">
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

      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "#fff",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "#F3F4F6" }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>
              All Documents
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: "#9CA3AF" }}>
              {loading
                ? "Loading..."
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

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2
              className="h-6 w-6 animate-spin"
              style={{ color: "#3338A0" }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <AlertTriangle className="h-8 w-8" style={{ color: "#E5E7EB" }} />
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              No documents found.
            </p>
          </div>
        ) : (
          filtered.map((doc, i) => {
            const statusKey = doc.status?.toLowerCase();
            const status = statusConfig[statusKey] ?? statusConfig.pending;

            return (
              <button
                key={doc.document_id}
                type="button"
                onClick={() => handleOpenDetails(doc.document_id)}
                className="grid w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
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
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: "#111827" }}
                  >
                    {doc.title}
                  </p>
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex text-xs font-semibold hover:underline"
                      style={{ color: "#3338A0" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View File
                    </a>
                  )}
                </div>
                <span className="text-xs" style={{ color: "#6B7280" }}>
                  {doc.type ?? "—"}
                </span>
                <span className="text-center text-xs" style={{ color: "#6B7280" }}>
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
              </button>
            );
          })
        )}
      </div>

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
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#1E1E2E" }}>
                  Add Document
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: "#9CA3AF" }}>
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
                    Select type...
                  </option>
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  className="text-xs font-semibold"
                  style={{ color: "#374151" }}
                >
                  Attach File{" "}
                  <span className="font-normal" style={{ color: "#9CA3AF" }}>
                    (PDF or Word, max 10MB)
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
                      <Paperclip className="h-4 w-4" style={{ color: "#3338A0" }} />
                    ) : (
                      <Upload className="h-4 w-4" style={{ color: "#9CA3AF" }} />
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

              <label className="flex cursor-pointer items-center gap-3 select-none">
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

              {formError && (
                <p
                  className="rounded-lg px-3 py-2 text-xs font-medium"
                  style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
                >
                  {formError}
                </p>
              )}

              <div className="mt-1 flex gap-2">
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "#3338A0", color: "#fff" }}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {submitting ? "Saving..." : "Add Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDocumentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedDocumentId(null);
              setSelectedChain(null);
              setDetailsError("");
            }
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: "#fff" }}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#1E1E2E" }}>
                  Document Tracking
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: "#9CA3AF" }}>
                  Track custody, status, and department movement.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedDocumentId(null);
                  setSelectedChain(null);
                  setDetailsError("");
                }}
                className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                style={{ color: "#9CA3AF" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2
                  className="h-6 w-6 animate-spin"
                  style={{ color: "#3338A0" }}
                />
              </div>
            ) : detailsError && !selectedChain ? (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
              >
                {detailsError}
              </div>
            ) : selectedChain ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div
                    className="rounded-xl border p-4"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <p className="text-xs font-semibold uppercase" style={{ color: "#9CA3AF" }}>
                      Tracking Number
                    </p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: "#111827" }}>
                      #{selectedChain.document.tracking_num}
                    </p>
                  </div>
                  <div
                    className="rounded-xl border p-4"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <p className="text-xs font-semibold uppercase" style={{ color: "#9CA3AF" }}>
                      Current Department
                    </p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: "#111827" }}>
                      {selectedChain.current_department_name ?? "Not assigned"}
                    </p>
                  </div>
                  <div
                    className="rounded-xl border p-4"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <p className="text-xs font-semibold uppercase" style={{ color: "#9CA3AF" }}>
                      Latest Status
                    </p>
                    <p className="mt-2 text-sm font-semibold capitalize" style={{ color: "#111827" }}>
                      {selectedChain.latest_status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div
                    className="rounded-xl border p-4"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <p className="text-xs font-semibold uppercase" style={{ color: "#9CA3AF" }}>
                      Attachment
                    </p>
                    {selectedChain.document.file_url ? (
                      <a
                        href={selectedChain.document.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm font-semibold hover:underline"
                        style={{ color: "#3338A0" }}
                      >
                        Open file
                      </a>
                    ) : (
                      <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>
                        No file uploaded
                      </p>
                    )}
                  </div>
                </div>

                {detailsError && (
                  <div
                    className="rounded-lg px-4 py-3 text-sm"
                    style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
                  >
                    {detailsError}
                  </div>
                )}

                <section
                  className="rounded-xl border p-5"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <div className="mb-4">
                    <h3 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>
                      Visual Tracker
                    </h3>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>
                      Quick progress view for this document
                    </p>
                  </div>
                  {trackerSteps.length === 0 ? (
                    <p className="text-sm" style={{ color: "#9CA3AF" }}>
                      No tracker steps yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto pb-2">
                      <div className="flex min-w-max items-start px-2 pt-3">
                        {trackerSteps.map((step, index) => {
                          const isActive = step.state !== "upcoming";
                          const nextStep = trackerSteps[index + 1];
                          const connectorActive = nextStep && nextStep.state !== "upcoming";

                          return (
                            <div key={step.id} className="flex items-start">
                              <div className="flex w-40 flex-col items-center text-center">
                                <div
                                  className="flex h-14 w-14 items-center justify-center rounded-full border-[4px] bg-white"
                                  style={{
                                    borderColor: isActive ? "#22C55E" : "#D1D5DB",
                                    color: isActive ? "#22C55E" : "#9CA3AF",
                                    boxShadow:
                                      step.state === "current"
                                        ? "0 0 0 6px rgba(34,197,94,0.12)"
                                        : "none",
                                  }}
                                >
                                  {step.icon}
                                </div>
                                <p
                                  className="mt-4 text-base font-semibold leading-tight"
                                  style={{ color: isActive ? "#111827" : "#9CA3AF" }}
                                >
                                  {step.label}
                                </p>
                                <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>
                                  {formatDateTime(step.timestamp)}
                                </p>
                                <p className="mt-1 text-xs" style={{ color: "#9CA3AF" }}>
                                  {step.caption}
                                </p>
                              </div>
                              {index < trackerSteps.length - 1 && (
                                <div
                                  className="mt-7 h-1 w-24 rounded-full"
                                  style={{
                                    backgroundColor: connectorActive ? "#22C55E" : "#D1D5DB",
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>

                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                  <div className="space-y-6">
                    <section
                      className="rounded-xl border p-5"
                      style={{ borderColor: "#E5E7EB" }}
                    >
                      <div className="mb-4">
                        <h3 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>
                          Chain of Custody
                        </h3>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          Full department movement history
                        </p>
                      </div>
                      {selectedChain.logs.length === 0 ? (
                        <p className="text-sm" style={{ color: "#9CA3AF" }}>
                          No movement logs yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedChain.logs.map((log) => (
                            <div
                              key={log.log_id}
                              className="rounded-lg border p-4"
                              style={{ borderColor: "#F3F4F6", backgroundColor: "#FAFAFA" }}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold" style={{ color: "#111827" }}>
                                  {log.from_department_name ?? "Origin"} to{" "}
                                  {log.to_department_name ?? "Unassigned"}
                                </p>
                                <span className="text-xs" style={{ color: "#6B7280" }}>
                                  Received: {formatDateTime(log.date_received)}
                                </span>
                              </div>
                              <div className="mt-2 grid gap-2 text-xs" style={{ color: "#6B7280" }}>
                                <p>
                                  Released by: {log.released_by_name ?? "—"}
                                </p>
                                <p>
                                  Received by: {log.received_by_name ?? "—"}
                                </p>
                                <p>
                                  Released at: {formatDateTime(log.date_released)}
                                </p>
                                <p>
                                  Remarks: {log.remarks ?? "—"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section
                      className="rounded-xl border p-5"
                      style={{ borderColor: "#E5E7EB" }}
                    >
                      <div className="mb-4">
                        <h3 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>
                          Status History
                        </h3>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          Timeline of status updates
                        </p>
                      </div>
                      {selectedChain.status_history.length === 0 ? (
                        <p className="text-sm" style={{ color: "#9CA3AF" }}>
                          No status history yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedChain.status_history.map((item) => (
                            <div
                              key={item.status_id}
                              className="flex items-center justify-between rounded-lg border p-3"
                              style={{ borderColor: "#F3F4F6", backgroundColor: "#FAFAFA" }}
                            >
                              <span className="text-sm font-semibold capitalize" style={{ color: "#111827" }}>
                                {item.status.replaceAll("_", " ")}
                              </span>
                              <span className="text-xs" style={{ color: "#6B7280" }}>
                                {formatDateTime(item.updated_at)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>

                  <div className="space-y-6">
                    <section
                      className="rounded-xl border p-5"
                      style={{ borderColor: "#E5E7EB" }}
                    >
                      <div className="mb-4">
                        <h3 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>
                          Move Document
                        </h3>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          Forward this document to another department
                        </p>
                      </div>
                      <form onSubmit={handleCreateMovement} className="space-y-4">
                        <div>
                          <label className="mb-1 block text-xs font-semibold" style={{ color: "#374151" }}>
                            Next Department
                          </label>
                          <select
                            value={movementForm.to_department_id}
                            onChange={(e) =>
                              setMovementForm((prev) => ({
                                ...prev,
                                to_department_id: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                            style={{ borderColor: "#E5E7EB", color: "#111827" }}
                          >
                            <option value="">Select department...</option>
                            {departments
                              .filter(
                                (department) =>
                                  department.department_id !==
                                  selectedChain.current_department_id,
                              )
                              .map((department) => (
                                <option
                                  key={department.department_id}
                                  value={department.department_id}
                                >
                                  {department.department_name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold" style={{ color: "#374151" }}>
                            Released By
                          </label>
                          <select
                            value={movementForm.released_by}
                            onChange={(e) =>
                              setMovementForm((prev) => ({
                                ...prev,
                                released_by: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                            style={{ borderColor: "#E5E7EB", color: "#111827" }}
                          >
                            <option value="">Select user...</option>
                            {users.map((user) => (
                              <option key={user.user_id} value={user.user_id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold" style={{ color: "#374151" }}>
                            Received By
                          </label>
                          <select
                            value={movementForm.received_by}
                            onChange={(e) =>
                              setMovementForm((prev) => ({
                                ...prev,
                                received_by: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                            style={{ borderColor: "#E5E7EB", color: "#111827" }}
                          >
                            <option value="">Select user...</option>
                            {users.map((user) => (
                              <option key={user.user_id} value={user.user_id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold" style={{ color: "#374151" }}>
                            Status After Move
                          </label>
                          <select
                            value={movementForm.status}
                            onChange={(e) =>
                              setMovementForm((prev) => ({
                                ...prev,
                                status: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                            style={{ borderColor: "#E5E7EB", color: "#111827" }}
                          >
                            {DOCUMENT_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold" style={{ color: "#374151" }}>
                            Remarks
                          </label>
                          <textarea
                            rows={3}
                            value={movementForm.remarks}
                            onChange={(e) =>
                              setMovementForm((prev) => ({
                                ...prev,
                                remarks: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                            style={{ borderColor: "#E5E7EB", color: "#111827" }}
                            placeholder="Explain the handoff..."
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={movementSubmitting}
                          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                          style={{ backgroundColor: "#3338A0", color: "#fff" }}
                        >
                          {movementSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          {movementSubmitting ? "Saving..." : "Save Movement"}
                        </button>
                      </form>
                    </section>

                    <section
                      className="rounded-xl border p-5"
                      style={{ borderColor: "#E5E7EB" }}
                    >
                      <div className="mb-4">
                        <h3 className="text-base font-semibold" style={{ color: "#1E1E2E" }}>
                          Change Status
                        </h3>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          Add a status entry for this document
                        </p>
                      </div>
                      <form onSubmit={handleCreateStatus} className="space-y-4">
                        <div>
                          <label className="mb-1 block text-xs font-semibold" style={{ color: "#374151" }}>
                            Status
                          </label>
                          <select
                            value={statusForm.status}
                            onChange={(e) =>
                              setStatusForm({ status: e.target.value })
                            }
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                            style={{ borderColor: "#E5E7EB", color: "#111827" }}
                          >
                            {DOCUMENT_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={statusSubmitting}
                          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                          style={{ backgroundColor: "#111827", color: "#fff" }}
                        >
                          {statusSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {statusSubmitting ? "Saving..." : "Save Status"}
                        </button>
                      </form>
                    </section>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
