import { NextResponse } from "next/server";

import { getChainOfCustody, toApiError } from "@/services/documentService";

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
    const chain = await getChainOfCustody(parseDocumentId(id));
    return NextResponse.json({ data: chain });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
