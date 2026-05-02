import { NextResponse } from "next/server";

import { deleteLog, toApiError, updateLog } from "@/services/documentService";

function parseLogId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid log id.");
  }
  return parsed;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ logId: string }> },
) {
  try {
    const { logId } = await context.params;
    const body = await request.json();
    const log = await updateLog(parseLogId(logId), body);
    return NextResponse.json({ data: log });
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
  context: { params: Promise<{ logId: string }> },
) {
  try {
    const { logId } = await context.params;
    const result = await deleteLog(parseLogId(logId));
    return NextResponse.json({ data: result });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status },
    );
  }
}
