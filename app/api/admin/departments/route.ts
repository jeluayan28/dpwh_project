import { NextResponse } from "next/server";

import {
  createDepartment,
  listDepartments,
  toAdminApiError,
} from "@/services/adminService";

export async function GET() {
  try {
    const departments = await listDepartments();
    return NextResponse.json({ data: departments });
  } catch (error) {
    const apiError = toAdminApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const department = await createDepartment(body);
    return NextResponse.json({ data: department }, { status: 201 });
  } catch (error) {
    const apiError = toAdminApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
