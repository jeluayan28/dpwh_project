import { NextResponse } from "next/server";

import { createDocument, listDocuments, toApiError } from "@/services/documentService";

export async function GET() {
  try {
    const documents = await listDocuments();
    return NextResponse.json({ data: documents });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const document = await createDocument(body);
    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
