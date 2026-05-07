import { NextResponse } from "next/server";

import {
  deleteDocument,
  getDocumentById,
  toApiError,
  updateDocument,
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
    const document = await getDocumentById(parseDocumentId(id));
    return NextResponse.json({ data: document });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const document = await updateDocument(parseDocumentId(id), body);
    return NextResponse.json({ data: document });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await deleteDocument(parseDocumentId(id));
    return NextResponse.json({ data: result });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
