/**
 * app/api/webhooks/docusign/route.ts
 *
 * POST /api/webhooks/docusign
 *
 * DocuSign Connect posts here when an envelope status changes.
 * Set this URL in DocuSign Admin → Connect → Add Configuration.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processWebhookEvent } from "@/lib/services/docusignService";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STATUS_MAP: Record<string, string> = {
  sent: "pending_signature",
  delivered: "pending_signature",
  completed: "signed",
  declined: "signature_declined",
  voided: "voided",
};

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const event = processWebhookEvent(payload);
  if (!event.envelopeId) {
    return NextResponse.json({ error: "Missing envelopeId" }, { status: 400 });
  }

  const appStatus = STATUS_MAP[event.status.toLowerCase()] ?? event.status;

  // Find the document — prefer custom field, fallback to envelope_id lookup
  let documentId = event.documentId;
  if (!documentId) {
    const { data } = await supabase
      .from("Documents")
      .select("document_id")
      .eq("envelope_id", event.envelopeId)
      .single();
    documentId = data?.document_id ?? null;
  }

  if (!documentId) {
    // Unknown envelope — acknowledge anyway to stop DocuSign retries
    console.warn("Webhook: no matching document for envelope", event.envelopeId);
    return NextResponse.json({ received: true });
  }

  // Update document status
  await supabase
    .from("Documents")
    .update({
      status: appStatus,
      ...(event.status.toLowerCase() === "completed" && event.completedDateTime
        ? { signed_at: event.completedDateTime }
        : {}),
    })
    .eq("document_id", documentId);

  // Append to status history
  await supabase.from("Document_Status_History").insert({
    document_id: documentId,
    status: appStatus,
    updated_at: event.completedDateTime ?? new Date().toISOString(),
  });

  return NextResponse.json({ received: true });
}