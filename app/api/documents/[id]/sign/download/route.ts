/**
 * app/api/documents/[id]/sign/download/route.ts
 *
 * GET /api/documents/:id/sign/download
 * Streams the completed signed PDF. Only works after status = "signed".
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { downloadSignedDocument } from "@/lib/services/docusignService"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const documentId = Number(params.id);

  const { data: doc, error } = await supabase
    .from("Documents")
    .select("document_id, title, status, envelope_id")
    .eq("document_id", documentId)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (!doc.envelope_id) {
    return NextResponse.json(
      { error: "Document has not been sent for signing" },
      { status: 400 }
    );
  }
  if (doc.status !== "signed") {
    return NextResponse.json(
      { error: `Document is not yet signed (current status: ${doc.status})` },
      { status: 409 }
    );
  }

  try {
    const pdfBuffer = await downloadSignedDocument(doc.envelope_id);
    const safeTitle = (doc.title as string)
      .replace(/[^a-z0-9_\-\s]/gi, "")
      .replace(/\s+/g, "_")
      .slice(0, 80);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle}_signed.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "DocuSign download error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}