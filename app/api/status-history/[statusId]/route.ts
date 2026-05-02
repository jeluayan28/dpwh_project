import { NextResponse } from "next/server";

import {
  deleteStatusHistoryEntry,
  toApiError,
  updateStatusHistoryEntry,
} from "@/services/documentService";

function parseStatusId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid status id.");
  }
  return parsed;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ statusId: string }> },
) {
  try {
    const { statusId } = await context.params;
    const body = await request.json();
    const statusHistoryEntry = await updateStatusHistoryEntry(
      parseStatusId(statusId),
      body,
    );
    return NextResponse.json({ data: statusHistoryEntry });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ statusId: string }> },
) {
  try {
    const { statusId } = await context.params;
    const result = await deleteStatusHistoryEntry(parseStatusId(statusId));
    return NextResponse.json({ data: result });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status },
    );
  }
}
