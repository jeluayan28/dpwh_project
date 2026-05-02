import { NextResponse } from "next/server";

import {
  deleteDepartment,
  toAdminApiError,
  updateDepartment,
} from "@/services/adminService";

function parseDepartmentId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid department id.");
  }
  return parsed;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const department = await updateDepartment(parseDepartmentId(id), body);
    return NextResponse.json({ data: department });
  } catch (error) {
    const apiError = toAdminApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await deleteDepartment(parseDepartmentId(id));
    return NextResponse.json({ data: result });
  } catch (error) {
    const apiError = toAdminApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
