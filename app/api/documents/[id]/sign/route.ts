/**
 * app/api/documents/[id]/sign/route.ts
 *
 * POST   /api/documents/:id/sign  — send document to DocuSign
 * GET    /api/documents/:id/sign  — get current signing status
 * DELETE /api/documents/:id/sign  — void the envelope
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendEnvelopeForSigning,
  getEnvelopeStatus,
  voidEnvelope,
  SignerInfo,
} from "@/lib/services/docusignService"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchDocument(documentId: number) {
  const { data, error } = await supabase
    .from("Documents")
    .select("document_id, tracking_num, title, status, file_url, envelope_id")
    .eq("document_id", documentId)
    .single();

  if (error || !data) return null;
  return data;
}

async function fetchFileAsBase64(fileUrl: string): Promise<string> {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

// ---------------------------------------------------------------------------
// POST — send for signing
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const documentId = Number(params.id);
  if (!documentId) {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  let signers: SignerInfo[];
  try {
    const body = await req.json();
    signers = body.signers;
    if (!Array.isArray(signers) || signers.length === 0) {
      return NextResponse.json(
        { error: "signers array is required" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const doc = await fetchDocument(documentId);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!doc.file_url) {
    return NextResponse.json(
      { error: "Document has no attached file" },
      { status: 422 }
    );
  }
  if (doc.envelope_id) {
    return NextResponse.json(
      { error: "Document already has an active envelope", envelope_id: doc.envelope_id },
      { status: 409 }
    );
  }

  let fileBase64: string;
  try {
    fileBase64 = await fetchFileAsBase64(doc.file_url);
  } catch (err) {
    console.error("File fetch error:", err);
    return NextResponse.json({ error: "Could not fetch document file" }, { status: 502 });
  }

  let envelopeId: string;
  let dsStatus: string;
  try {
    const result = await sendEnvelopeForSigning({
      documentId,
      trackingNum: doc.tracking_num,
      title: doc.title,
      fileBase64,
      signers,
    });
    envelopeId = result.envelopeId;
    dsStatus = result.status;
  } catch (err: unknown) {
    console.error("DocuSign send error:", err);
    const message = err instanceof Error ? err.message : "DocuSign API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await supabase
    .from("Documents")
    .update({ envelope_id: envelopeId, status: "pending_signature" })
    .eq("document_id", documentId);

  await supabase.from("Document_Status_History").insert({
    document_id: documentId,
    status: "pending_signature",
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json(
    { data: { envelope_id: envelopeId, status: dsStatus } },
    { status: 201 }
  );
}

// ---------------------------------------------------------------------------
// GET — signing status
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const documentId = Number(params.id);
  const doc = await fetchDocument(documentId);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!doc.envelope_id) {
    return NextResponse.json({ data: { status: "not_sent", envelope_id: null } });
  }

  try {
    const result = await getEnvelopeStatus(doc.envelope_id);
    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DocuSign API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — void envelope
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const documentId = Number(params.id);
  const doc = await fetchDocument(documentId);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!doc.envelope_id) {
    return NextResponse.json({ error: "No envelope to void" }, { status: 400 });
  }

  let reason = "Voided by DPWH admin";
  try {
    const body = await req.json();
    if (body.reason) reason = body.reason;
  } catch { /* reason is optional */ }

  try {
    await voidEnvelope(doc.envelope_id, reason);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DocuSign API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await supabase
    .from("Documents")
    .update({ status: "voided" })
    .eq("document_id", documentId);

  await supabase.from("Document_Status_History").insert({
    document_id: documentId,
    status: "voided",
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ data: { voided: true } });
}