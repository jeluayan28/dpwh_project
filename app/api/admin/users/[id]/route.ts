import { NextResponse } from "next/server";

import {
  deleteAdminUser,
  toAdminApiError,
  updateAdminUser,
} from "@/services/adminService";

function parseUserId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid user id.");
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
    const user = await updateAdminUser(parseUserId(id), body);
    return NextResponse.json({ data: user });
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
    const result = await deleteAdminUser(parseUserId(id));
    return NextResponse.json({ data: result });
  } catch (error) {
    const apiError = toAdminApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
