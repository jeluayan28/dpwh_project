import { createServerSupabaseClient } from "@/lib/supabase-server";
import type {
  ChainOfCustodyResponse,
  ChainOfCustodyStep,
  CreateDocumentInput,
  CreateLogInput,
  CreateStatusInput,
  DepartmentRecord,
  DocumentLogRecord,
  DocumentRecord,
  DocumentStatusHistoryRecord,
  UpdateDocumentInput,
  UpdateLogInput,
  UpdateStatusInput,
  UserRecord,
} from "@/types";

const DOCUMENTS_TABLE = "Documents";
const LOGS_TABLE = "Document_Logs";
const STATUS_HISTORY_TABLE = "Document_Status_History";
const DEPARTMENTS_TABLE = "Departments";
const USERS_TABLE = "Users";

class DocumentTrackingError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "DocumentTrackingError";
    this.status = status;
  }
}

function assertNonEmptyString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new DocumentTrackingError(`${field} is required.`);
  }
}

function toOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new DocumentTrackingError("Expected a valid numeric identifier.");
  }
  return parsed;
}

function getEventTimestamp(preferred?: string | null) {
  return preferred ?? new Date().toISOString();
}

async function generateTrackingNumber() {
  const supabase = createServerSupabaseClient();
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const trackingNumber = Number(`${datePrefix}${suffix}`);

    const { data, error } = await supabase
      .from(DOCUMENTS_TABLE)
      .select("document_id")
      .eq("tracking_num", trackingNumber)
      .maybeSingle();

    if (error) {
      throw new DocumentTrackingError(error.message, 500);
    }

    if (!data) {
      return trackingNumber;
    }
  }

  throw new DocumentTrackingError(
    "Unable to generate a unique tracking number. Please try again.",
    500,
  );
}

async function getDocumentOrThrow(documentId: number) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(DOCUMENTS_TABLE)
    .select("*")
    .eq("document_id", documentId)
    .maybeSingle<DocumentRecord>();

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  if (!data) {
    throw new DocumentTrackingError("Document not found.", 404);
  }

  return data;
}

async function getLogOrThrow(logId: number) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(LOGS_TABLE)
    .select("*")
    .eq("log_id", logId)
    .maybeSingle<DocumentLogRecord>();

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  if (!data) {
    throw new DocumentTrackingError("Document log entry not found.", 404);
  }

  return data;
}

async function getStatusOrThrow(statusId: number) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(STATUS_HISTORY_TABLE)
    .select("*")
    .eq("status_id", statusId)
    .maybeSingle<DocumentStatusHistoryRecord>();

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  if (!data) {
    throw new DocumentTrackingError("Status history entry not found.", 404);
  }

  return data;
}

async function getDepartmentNameMap(ids: number[]) {
  const uniqueIds = [...new Set(ids.filter((id) => Number.isInteger(id)))];
  if (uniqueIds.length === 0) {
    return new Map<number, string>();
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(DEPARTMENTS_TABLE)
    .select("department_id, department_name")
    .in("department_id", uniqueIds);

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  return new Map(
    ((data ?? []) as DepartmentRecord[]).map((department) => [
      department.department_id,
      department.department_name,
    ]),
  );
}

async function getUserNameMap(ids: number[]) {
  const uniqueIds = [...new Set(ids.filter((id) => Number.isInteger(id)))];
  if (uniqueIds.length === 0) {
    return new Map<number, string>();
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("user_id, name")
    .in("user_id", uniqueIds);

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  return new Map(
    ((data ?? []) as UserRecord[]).map((user) => [user.user_id, user.name]),
  );
}

export function toApiError(error: unknown) {
  if (error instanceof DocumentTrackingError) {
    return {
      message: error.message,
      status: error.status,
    };
  }

  if (error instanceof Error && /^Invalid .+ id\.$/.test(error.message)) {
    return {
      message: error.message,
      status: 400,
    };
  }

  return {
    message: "Unexpected server error.",
    status: 500,
  };
}

export async function listDocuments() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(DOCUMENTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  return (data ?? []) as DocumentRecord[];
}

export async function getDocumentById(documentId: number) {
  return getDocumentOrThrow(documentId);
}

export async function createDocument(input: CreateDocumentInput) {
  assertNonEmptyString(input.title, "title");
  assertNonEmptyString(input.type, "type");

  const supabase = createServerSupabaseClient();
  const tracking_num = await generateTrackingNumber();
  const createdAt = getEventTimestamp(input.created_at);
  const status = input.status?.trim() || "pending";

  const { data, error } = await supabase
    .from(DOCUMENTS_TABLE)
    .insert({
      tracking_num,
      title: input.title.trim(),
      type: input.type.trim(),
      status,
      is_urgent: Boolean(input.is_urgent),
      created_by: toOptionalNumber(input.created_by),
      file_url: input.file_url?.trim() || null,
      created_at: createdAt,
    })
    .select("*")
    .single<DocumentRecord>();

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  await createStatusHistoryEntry(data.document_id, {
    status,
    updated_at: createdAt,
  });

  if (input.initial_department_id !== undefined && input.initial_department_id !== null) {
    await createLog(data.document_id, {
      from_department_id: null,
      to_department_id: input.initial_department_id,
      received_by: toOptionalNumber(input.received_by) ?? toOptionalNumber(input.created_by),
      date_received: createdAt,
      remarks: input.initial_remarks?.trim() || "Initial document intake.",
    });
  }

  return getDocumentOrThrow(data.document_id);
}

export async function updateDocument(
  documentId: number,
  input: UpdateDocumentInput,
) {
  await getDocumentOrThrow(documentId);

  const updates: Record<string, unknown> = {};

  if (input.title !== undefined) {
    assertNonEmptyString(input.title, "title");
    updates.title = input.title.trim();
  }
  if (input.type !== undefined) {
    assertNonEmptyString(input.type, "type");
    updates.type = input.type.trim();
  }
  if (input.status !== undefined) {
    assertNonEmptyString(input.status, "status");
    updates.status = input.status.trim();
  }
  if (input.is_urgent !== undefined) {
    updates.is_urgent = Boolean(input.is_urgent);
  }
  if (input.created_by !== undefined) {
    updates.created_by = toOptionalNumber(input.created_by);
  }
  if (input.file_url !== undefined) {
    updates.file_url = input.file_url?.trim() || null;
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from(DOCUMENTS_TABLE)
    .update(updates)
    .eq("document_id", documentId);

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  if (input.status !== undefined) {
    await createStatusHistoryEntry(documentId, {
      status: input.status,
    });
  }

  return getDocumentOrThrow(documentId);
}

export async function deleteDocument(documentId: number) {
  await getDocumentOrThrow(documentId);
  const supabase = createServerSupabaseClient();

  const { error: logError } = await supabase
    .from(LOGS_TABLE)
    .delete()
    .eq("document_id", documentId);

  if (logError) {
    throw new DocumentTrackingError(logError.message, 500);
  }

  const { error: statusError } = await supabase
    .from(STATUS_HISTORY_TABLE)
    .delete()
    .eq("document_id", documentId);

  if (statusError) {
    throw new DocumentTrackingError(statusError.message, 500);
  }

  const { error } = await supabase
    .from(DOCUMENTS_TABLE)
    .delete()
    .eq("document_id", documentId);

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  return { success: true };
}

export async function listLogs(documentId: number) {
  await getDocumentOrThrow(documentId);
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(LOGS_TABLE)
    .select("*")
    .eq("document_id", documentId)
    .order("date_received", { ascending: true })
    .order("log_id", { ascending: true });

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  return (data ?? []) as DocumentLogRecord[];
}

export async function createLog(documentId: number, input: CreateLogInput) {
  const document = await getDocumentOrThrow(documentId);
  const existingLogs = await listLogs(documentId);
  const latestLog = existingLogs.at(-1);

  const fromDepartmentId =
    toOptionalNumber(input.from_department_id) ?? latestLog?.to_department_id ?? null;
  const toDepartmentId = toOptionalNumber(input.to_department_id);

  if (fromDepartmentId === null && toDepartmentId === null) {
    throw new DocumentTrackingError(
      "At least one department reference is required for a document log.",
    );
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(LOGS_TABLE)
    .insert({
      document_id: document.document_id,
      from_department_id: fromDepartmentId,
      to_department_id: toDepartmentId,
      received_by: toOptionalNumber(input.received_by),
      released_by: toOptionalNumber(input.released_by),
      date_received: input.date_received ?? null,
      date_released: input.date_released ?? null,
      remarks: input.remarks?.trim() || null,
    })
    .select("*")
    .single<DocumentLogRecord>();

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  if (input.status !== undefined) {
    await updateDocument(documentId, { status: input.status });
  }

  return data;
}

export async function updateLog(logId: number, input: UpdateLogInput) {
  const log = await getLogOrThrow(logId);
  const updates: Record<string, unknown> = {};

  if (input.from_department_id !== undefined) {
    updates.from_department_id = toOptionalNumber(input.from_department_id);
  }
  if (input.to_department_id !== undefined) {
    updates.to_department_id = toOptionalNumber(input.to_department_id);
  }
  if (input.received_by !== undefined) {
    updates.received_by = toOptionalNumber(input.received_by);
  }
  if (input.released_by !== undefined) {
    updates.released_by = toOptionalNumber(input.released_by);
  }
  if (input.date_received !== undefined) {
    updates.date_received = input.date_received;
  }
  if (input.date_released !== undefined) {
    updates.date_released = input.date_released;
  }
  if (input.remarks !== undefined) {
    updates.remarks = input.remarks?.trim() || null;
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from(LOGS_TABLE)
    .update(updates)
    .eq("log_id", logId);

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  if (input.status !== undefined) {
    await updateDocument(log.document_id, { status: input.status });
  }

  return getLogOrThrow(logId);
}

export async function deleteLog(logId: number) {
  await getLogOrThrow(logId);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from(LOGS_TABLE).delete().eq("log_id", logId);

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  return { success: true };
}

export async function listMovements(documentId: number) {
  return listLogs(documentId);
}

export async function createMovement(documentId: number, input: CreateLogInput) {
  return createLog(documentId, input);
}

export async function updateMovement(logId: number, input: UpdateLogInput) {
  return updateLog(logId, input);
}

export async function deleteMovement(logId: number) {
  return deleteLog(logId);
}

export async function listStatusHistory(documentId: number) {
  await getDocumentOrThrow(documentId);
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(STATUS_HISTORY_TABLE)
    .select("*")
    .eq("document_id", documentId)
    .order("updated_at", { ascending: true })
    .order("status_id", { ascending: true });

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  return (data ?? []) as DocumentStatusHistoryRecord[];
}

export async function createStatusHistoryEntry(
  documentId: number,
  input: CreateStatusInput,
) {
  await getDocumentOrThrow(documentId);
  assertNonEmptyString(input.status, "status");

  const supabase = createServerSupabaseClient();
  const normalizedStatus = input.status.trim();
  const updatedAt = getEventTimestamp(input.updated_at);

  const { data, error } = await supabase
    .from(STATUS_HISTORY_TABLE)
    .insert({
      document_id: documentId,
      status: normalizedStatus,
      updated_at: updatedAt,
    })
    .select("*")
    .single<DocumentStatusHistoryRecord>();

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  const { error: documentUpdateError } = await supabase
    .from(DOCUMENTS_TABLE)
    .update({ status: normalizedStatus })
    .eq("document_id", documentId);

  if (documentUpdateError) {
    throw new DocumentTrackingError(documentUpdateError.message, 500);
  }

  return data;
}

export async function updateStatusHistoryEntry(
  statusId: number,
  input: UpdateStatusInput,
) {
  const statusEntry = await getStatusOrThrow(statusId);
  const updates: Record<string, unknown> = {};

  if (input.status !== undefined) {
    assertNonEmptyString(input.status, "status");
    updates.status = input.status.trim();
  }
  if (input.updated_at !== undefined) {
    updates.updated_at = input.updated_at;
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from(STATUS_HISTORY_TABLE)
    .update(updates)
    .eq("status_id", statusId);

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  const latestStatus = (await listStatusHistory(statusEntry.document_id)).at(-1);
  if (latestStatus) {
    const { error: documentUpdateError } = await supabase
      .from(DOCUMENTS_TABLE)
      .update({ status: latestStatus.status })
      .eq("document_id", statusEntry.document_id);

    if (documentUpdateError) {
      throw new DocumentTrackingError(documentUpdateError.message, 500);
    }
  }

  return getStatusOrThrow(statusId);
}

export async function deleteStatusHistoryEntry(statusId: number) {
  const statusEntry = await getStatusOrThrow(statusId);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from(STATUS_HISTORY_TABLE)
    .delete()
    .eq("status_id", statusId);

  if (error) {
    throw new DocumentTrackingError(error.message, 500);
  }

  const latestStatus = (await listStatusHistory(statusEntry.document_id)).at(-1);
  if (latestStatus) {
    const { error: documentUpdateError } = await supabase
      .from(DOCUMENTS_TABLE)
      .update({ status: latestStatus.status })
      .eq("document_id", statusEntry.document_id);

    if (documentUpdateError) {
      throw new DocumentTrackingError(documentUpdateError.message, 500);
    }
  }

  return { success: true };
}

export async function getChainOfCustody(
  documentId: number,
): Promise<ChainOfCustodyResponse> {
  const document = await getDocumentOrThrow(documentId);
  const logs = await listLogs(documentId);
  const statusHistory = await listStatusHistory(documentId);

  const departmentMap = await getDepartmentNameMap(
    logs.flatMap((log) =>
      [log.from_department_id, log.to_department_id].filter(
        (value): value is number => value !== null,
      ),
    ),
  );
  const userMap = await getUserNameMap(
    logs.flatMap((log) =>
      [log.received_by, log.released_by].filter(
        (value): value is number => value !== null,
      ),
    ),
  );

  const mappedLogs: ChainOfCustodyStep[] = logs.map((log) => ({
    ...log,
    from_department_name: log.from_department_id
      ? departmentMap.get(log.from_department_id) ?? null
      : null,
    to_department_name: log.to_department_id
      ? departmentMap.get(log.to_department_id) ?? null
      : null,
    received_by_name: log.received_by
      ? userMap.get(log.received_by) ?? null
      : null,
    released_by_name: log.released_by
      ? userMap.get(log.released_by) ?? null
      : null,
  }));

  const latestLog = logs.at(-1);
  const latestStatus = statusHistory.at(-1)?.status ?? document.status;

  return {
    document,
    current_department_id: latestLog?.to_department_id ?? null,
    current_department_name: latestLog?.to_department_id
      ? departmentMap.get(latestLog.to_department_id) ?? null
      : null,
    latest_status: latestStatus,
    status_history: statusHistory,
    logs: mappedLogs,
  };
}
