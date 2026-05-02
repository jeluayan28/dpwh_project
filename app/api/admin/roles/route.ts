import { NextResponse } from "next/server";

import { listRoles, toAdminApiError } from "@/services/adminService";

export async function GET() {
  try {
    const roles = await listRoles();
    return NextResponse.json({ data: roles });
  } catch (error) {
    const apiError = toAdminApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
