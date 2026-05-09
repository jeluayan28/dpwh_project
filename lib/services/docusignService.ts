/**
 * services/docusignService.ts
 * All DocuSign business logic.
 */

import * as docusign from "docusign-esign";
import { buildDocuSignClient, DOCUSIGN_ACCOUNT_ID } from "@/lib/docusign";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SignerInfo {
  name: string;
  email: string;
  userId?: number;
}

export interface SendEnvelopeParams {
  documentId: number;
  trackingNum: number | string;
  title: string;
  fileBase64: string;
  signers: SignerInfo[];
  emailSubject?: string;
}

export interface EnvelopeStatusResult {
  envelopeId: string;
  status: string;
  sentDateTime?: string;
  completedDateTime?: string;
  declinedDateTime?: string;
  voidedDateTime?: string;
  signers: {
    name: string;
    email: string;
    status: string;
    signedDateTime?: string;
  }[];
}

export interface WebhookEventResult {
  envelopeId: string;
  status: string;
  documentId: number | null;
  trackingNum: string | null;
  completedDateTime?: string;
}

// ---------------------------------------------------------------------------
// Send envelope
// ---------------------------------------------------------------------------
export async function sendEnvelopeForSigning(
  params: SendEnvelopeParams
): Promise<{ envelopeId: string; status: string }> {
  const { documentId, trackingNum, title, fileBase64, signers, emailSubject } = params;

  const apiClient  = await buildDocuSignClient();
  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  const doc: docusign.Document = {
    documentBase64: fileBase64,
    name:           title,
    fileExtension:  "pdf",
    documentId:     "1",
  };

  const dsSigners: docusign.Signer[] = signers.map((signer, index) => ({
    email:       signer.email,
    name:        signer.name,
    recipientId: String(index + 1),
    routingOrder: String(index + 1),
    tabs: {
      signHereTabs: [{
        anchorString:  `/sig${index + 1}/`,
        anchorUnits:   "pixels",
        anchorXOffset: "0",
        anchorYOffset: "0",
      }],
      dateSignedTabs: [{
        anchorString:  `/date${index + 1}/`,
        anchorUnits:   "pixels",
        anchorXOffset: "0",
        anchorYOffset: "0",
      }],
    },
  }));

  const envelope: docusign.EnvelopeDefinition = {
    emailSubject: emailSubject ?? `Please sign: ${title} [Tracking #${trackingNum}]`,
    documents:    [doc],
    recipients:   { signers: dsSigners },
    status:       "sent",
    customFields: {
      textCustomFields: [
        { name: "document_id",  value: String(documentId),  required: "false", show: "true" },
        { name: "tracking_num", value: String(trackingNum), required: "false", show: "true" },
      ],
    },
  };

  const result = await envelopesApi.createEnvelope(DOCUSIGN_ACCOUNT_ID, {
    envelopeDefinition: envelope,
  });

  return { envelopeId: result.envelopeId!, status: result.status! };
}

// ---------------------------------------------------------------------------
// Get envelope + signer status
// ---------------------------------------------------------------------------
export async function getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatusResult> {
  const apiClient    = await buildDocuSignClient();
  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  const [envelope, recipients] = await Promise.all([
    envelopesApi.getEnvelope(DOCUSIGN_ACCOUNT_ID, envelopeId, {}),
    envelopesApi.listRecipients(DOCUSIGN_ACCOUNT_ID, envelopeId, {}),
  ]);

  return {
    envelopeId:        envelope.envelopeId!,
    status:            envelope.status!,
    sentDateTime:      envelope.sentDateTime,
    completedDateTime: envelope.completedDateTime,
    declinedDateTime:  envelope.declinedDateTime,
    voidedDateTime:    envelope.voidedDateTime,
    signers: (recipients.signers ?? []).map((s) => ({
      name:            s.name  ?? "",
      email:           s.email ?? "",
      status:          s.status ?? "unknown",
      signedDateTime:  s.signedDateTime,
    })),
  };
}

// ---------------------------------------------------------------------------
// Download signed PDF
// ---------------------------------------------------------------------------
export async function downloadSignedDocument(envelopeId: string): Promise<Buffer> {
  const apiClient    = await buildDocuSignClient();
  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  const result = await envelopesApi.getDocument(
    DOCUSIGN_ACCOUNT_ID, envelopeId, "combined", {}
  );

  if (Buffer.isBuffer(result)) return result;

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    (result as unknown as NodeJS.ReadableStream)
      .on("data",  (chunk) => chunks.push(Buffer.from(chunk)))
      .on("end",   ()      => resolve(Buffer.concat(chunks)))
      .on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Void envelope
// ---------------------------------------------------------------------------
export async function voidEnvelope(
  envelopeId: string,
  reason = "Voided by DPWH system"
): Promise<void> {
  const apiClient    = await buildDocuSignClient();
  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  await envelopesApi.update(DOCUSIGN_ACCOUNT_ID, envelopeId, {
    envelope: { status: "voided", voidedReason: reason },
  });
}

// ---------------------------------------------------------------------------
// Parse DocuSign Connect webhook payload
// ---------------------------------------------------------------------------
export function processWebhookEvent(payload: Record<string, unknown>): WebhookEventResult {
  const env = (payload.EnvelopeStatus ?? payload.envelopeStatus ?? payload) as Record<string, unknown>;

  const envelopeId        = (env.EnvelopeID as string)  ?? (env.envelopeId as string)        ?? "";
  const status            = (env.Status    as string)   ?? (env.status    as string)          ?? "";
  const completedDateTime = (env.Completed as string)   ?? (env.completedDateTime as string);

  const customFields = (env.CustomFields as Record<string, unknown>) ?? {};
  const textFields   = (customFields.CustomField as Record<string, string>[]) ?? [];
  const findField    = (name: string) =>
    textFields.find((f) => (f.Name ?? f.name ?? "").toLowerCase() === name)?.Value ?? null;

  return {
    envelopeId,
    status,
    documentId:        findField("document_id") ? Number(findField("document_id")) : null,
    trackingNum:       findField("tracking_num"),
    completedDateTime,
  };
}