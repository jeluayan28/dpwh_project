import { NextResponse } from "next/server";

import { approveAssignedDocument, toApiError } from "@/services/documentService";

function parseDocumentId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid document id.");
  }
  return parsed;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const result = await approveAssignedDocument(parseDocumentId(id), body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status },
    );
  }
}
