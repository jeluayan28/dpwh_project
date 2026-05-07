import { NextResponse } from "next/server";

import {
  createAdminUser,
  listAdminUsers,
  toAdminApiError,
} from "@/services/adminService";

export async function GET() {
  try {
    const users = await listAdminUsers();
    return NextResponse.json({ data: users });
  } catch (error) {
    const apiError = toAdminApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await createAdminUser(body);
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    const apiError = toAdminApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
