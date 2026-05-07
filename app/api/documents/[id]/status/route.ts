import { NextResponse } from "next/server";

import {
  createStatusHistoryEntry,
  listStatusHistory,
  toApiError,
} from "@/services/documentService";

function parseDocumentId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid document id.");
  }
  return parsed;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const statusHistory = await listStatusHistory(parseDocumentId(id));
    return NextResponse.json({ data: statusHistory });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const statusHistoryEntry = await createStatusHistoryEntry(
      parseDocumentId(id),
      body,
    );
    return NextResponse.json({ data: statusHistoryEntry }, { status: 201 });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status },
    );
  }
}
