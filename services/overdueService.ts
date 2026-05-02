import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { DocumentLogRecord, OverdueCheckResult } from "@/types";

const DOCUMENTS_TABLE = "Documents";
const LOGS_TABLE = "Document_Logs";
const STATUS_HISTORY_TABLE = "Document_Status_History";
const OVERDUE_STATUS = "overdue";

class OverdueServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "OverdueServiceError";
    this.status = status;
  }
}

export function toOverdueApiError(error: unknown) {
  if (error instanceof OverdueServiceError) {
    return {
      message: error.message,
      status: error.status,
    };
  }

  return {
    message: "Unexpected server error.",
    status: 500,
  };
}

export async function markOverdueDocuments(): Promise<OverdueCheckResult> {
  const supabase = createServerSupabaseClient();
  const checkedAt = new Date().toISOString();

  const { data: documents, error } = await supabase
    .from(DOCUMENTS_TABLE)
    .select("document_id, status")
    .neq("status", OVERDUE_STATUS);

  if (error) {
    throw new OverdueServiceError(error.message, 500);
  }

  const overdueIds: number[] = [];

  for (const document of documents ?? []) {
    const { data: latestLog, error: latestLogError } = await supabase
      .from(LOGS_TABLE)
      .select("*")
      .eq("document_id", document.document_id)
      .order("date_received", { ascending: false, nullsFirst: false })
      .order("log_id", { ascending: false })
      .limit(1)
      .maybeSingle<DocumentLogRecord>();

    if (latestLogError) {
      throw new OverdueServiceError(latestLogError.message, 500);
    }

    if (!latestLog?.date_received) {
      continue;
    }

    const receivedAt = new Date(latestLog.date_received).getTime();
    const daysInDepartment = checkedAt
      ? new Date(checkedAt).getTime() - receivedAt
      : 0;
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

    if (daysInDepartment <= threeDaysInMs) {
      continue;
    }

    overdueIds.push(document.document_id);
  }

  if (overdueIds.length === 0) {
    return {
      checked_at: checkedAt,
      updated_count: 0,
      document_ids: [],
    };
  }

  const { error: updateError } = await supabase
    .from(DOCUMENTS_TABLE)
    .update({ status: OVERDUE_STATUS })
    .in("document_id", overdueIds);

  if (updateError) {
    throw new OverdueServiceError(updateError.message, 500);
  }

  const statusRows = overdueIds.map((documentId) => ({
    document_id: documentId,
    status: OVERDUE_STATUS,
    updated_at: checkedAt,
  }));

  const { error: historyError } = await supabase
    .from(STATUS_HISTORY_TABLE)
    .insert(statusRows);

  if (historyError) {
    throw new OverdueServiceError(historyError.message, 500);
  }

  return {
    checked_at: checkedAt,
    updated_count: overdueIds.length,
    document_ids: overdueIds,
  };
}
