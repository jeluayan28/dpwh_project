import { NextResponse } from "next/server";

import { markOverdueDocuments, toOverdueApiError } from "@/services/overdueService";

export async function POST() {
  try {
    const result = await markOverdueDocuments();
    return NextResponse.json({ data: result });
  } catch (error) {
    const apiError = toOverdueApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
