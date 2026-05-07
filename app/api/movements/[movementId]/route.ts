import { NextResponse } from "next/server";

import { deleteMovement, toApiError, updateMovement } from "@/services/documentService";

function parseMovementId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid movement id.");
  }
  return parsed;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ movementId: string }> },
) {
  try {
    const { movementId } = await context.params;
    const body = await request.json();
    const movement = await updateMovement(parseMovementId(movementId), body);
    return NextResponse.json({ data: movement });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ movementId: string }> },
) {
  try {
    const { movementId } = await context.params;
    const result = await deleteMovement(parseMovementId(movementId));
    return NextResponse.json({ data: result });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json({ error: apiError.message }, { status: apiError.status });
  }
}
