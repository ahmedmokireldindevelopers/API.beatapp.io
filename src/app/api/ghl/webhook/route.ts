import { createHash, createVerify } from "crypto";

import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const DEFAULT_GHL_WEBHOOK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAokvo/r9tVgcfZ5DysOSC
Frm602qYV0MaAiNnX9O8KxMbiyRKWeL9JpCpVpt4XHIcBOK4u3cLSqJGOLaPuXw6
dO0t6Q/ZVdAV5Phz+ZtzPL16iCGeK9po6D6JHBpbi989mmzMryUnQJezlYJ3DVfB
csedpinheNnyYeFXolrJvcsjDtfAeRx5ByHQmTnSdFUzuAnC9/GepgLT9SM4nCpv
uxmZMxrJt5Rw+VUaQ9B8JSvbMPpez4peKaJPZHBbU3OdeCVx5klVXXZQGNHOs8gF
3kvoV5rTnXV0IknLBXlcKKAQLZcY/Q9rG6Ifi9c+5vqlvHPCUJFT5XUGG5RKgOKU
J062fRtN+rLYZUV+BjafxQauvC8wSWeYja63VSUruvmNj8xkx2zE/Juc+yjLjTXp
IocmaiFeAO6fUtNjDeFVkhf5LNb59vECyrHD2SQIrhgXpO4Q3dVNA5rw576PwTzN
h/AMfHKIjE4xQA1SZuYJmNnmVZLIZBlQAF9Ntd03rfadZ+yDiOXCCs9FkHibELhC
HULgCsnuDJHcrGNd5/Ddm5hxGQ0ASitgHeMZ0kcIOwKDOzOU53lDza6/Y09T7sYJ
PQe7z0cvj7aE4B+Ax1ZoZGPzpJlZtGXCsu9aTEGEnKzmsFqwcSsnw3JB31IGKAyk
T1hhTiaCeIY/OwwwNUY2yvcCAwEAAQ==
-----END PUBLIC KEY-----`;

const ALLOWED_WEBHOOK_EVENTS = new Set([
  "ContactCreate",
  "ContactUpdate",
  "OpportunityCreate",
  "OpportunityUpdate",
  "OpportunityStatusUpdate",
  "InvoiceCreate",
  "InvoiceUpdate",
  "InvoicePaid",
  "InvoiceVoid"
]);

type JsonObject = Record<string, unknown>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

function asObject(value: unknown): JsonObject | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toIsoOrNull(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function getPayload(rawBody: string): JsonObject | null {
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    return asObject(parsed);
  } catch {
    return null;
  }
}

function getWebhookPublicKey(): string {
  return (
    process.env.GHL_WEBHOOK_PUBLIC_KEY ||
    process.env.HIGHLEVEL_WEBHOOK_PUBLIC_KEY ||
    DEFAULT_GHL_WEBHOOK_PUBLIC_KEY
  );
}

function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  try {
    const verifier = createVerify("SHA256");
    verifier.update(rawBody, "utf8");
    verifier.end();
    return verifier.verify(getWebhookPublicKey(), signature, "base64");
  } catch {
    return false;
  }
}

function resolveWebhookId(payload: JsonObject, rawBody: string): string {
  const webhookId = asString(payload.webhookId) || asString(payload.webhook_id);
  if (webhookId) {
    return webhookId;
  }
  return createHash("sha256").update(rawBody, "utf8").digest("hex");
}

function resolveLocationId(payload: JsonObject): string {
  const data = asObject(payload.data);
  return (
    asString(payload.locationId) ||
    asString(payload.location_id) ||
    asString(data?.locationId) ||
    asString(data?.location_id) ||
    ""
  );
}

function resolveCompanyId(payload: JsonObject): string {
  const data = asObject(payload.data);
  return (
    asString(payload.companyId) ||
    asString(payload.company_id) ||
    asString(data?.companyId) ||
    asString(data?.company_id) ||
    ""
  );
}

async function storeWebhookEvent(params: {
  webhookId: string;
  eventType: string;
  locationId: string;
  companyId: string;
  webhookTimestamp: string | null;
  signatureValid: boolean;
  status: "accepted" | "ignored" | "rejected";
  payload: JsonObject;
}): Promise<"inserted" | "duplicate"> {
  const { error } = await supabase.from("ghl_webhook_events").insert({
    webhook_id: params.webhookId,
    event_type: params.eventType,
    location_id: params.locationId,
    company_id: params.companyId,
    webhook_timestamp: params.webhookTimestamp,
    signature_valid: params.signatureValid,
    status: params.status,
    payload: params.payload
  });

  if (!error) {
    return "inserted";
  }

  if (error.code === "23505") {
    return "duplicate";
  }

  throw new Error(error.message);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!rawBody) {
    return json({ ok: false, error: "Missing request body" }, 400);
  }

  const payload = getPayload(rawBody);
  if (!payload) {
    return json({ ok: false, error: "Invalid JSON payload" }, 400);
  }

  const signature =
    req.headers.get("x-wh-signature") ||
    req.headers.get("x-highlevel-signature");
  if (!signature) {
    return json({ ok: false, error: "Missing webhook signature" }, 401);
  }

  const eventType = asString(payload.type) || "Unknown";
  const webhookId = resolveWebhookId(payload, rawBody);
  const locationId = resolveLocationId(payload);
  const companyId = resolveCompanyId(payload);
  const webhookTimestamp = toIsoOrNull(
    asString(payload.timestamp) || asString(payload.createdAt)
  );
  const signatureValid = verifyWebhookSignature(rawBody, signature);

  if (!signatureValid) {
    try {
      await storeWebhookEvent({
        webhookId,
        eventType,
        locationId,
        companyId,
        webhookTimestamp,
        signatureValid: false,
        status: "rejected",
        payload
      });
    } catch {
      // Signature validation result is authoritative; storage failure should not flip to success.
    }

    return json({ ok: false, error: "Invalid signature" }, 401);
  }

  try {
    if (!ALLOWED_WEBHOOK_EVENTS.has(eventType)) {
      await storeWebhookEvent({
        webhookId,
        eventType,
        locationId,
        companyId,
        webhookTimestamp,
        signatureValid: true,
        status: "ignored",
        payload
      });

      return json({
        ok: true,
        ignored: true,
        eventType,
        reason: "Event is not enabled in this endpoint"
      });
    }

    const writeResult = await storeWebhookEvent({
      webhookId,
      eventType,
      locationId,
      companyId,
      webhookTimestamp,
      signatureValid: true,
      status: "accepted",
      payload
    });

    return json({
      ok: true,
      accepted: writeResult === "inserted",
      duplicate: writeResult === "duplicate",
      webhookId,
      eventType
    });
  } catch (err) {
    return json(
      {
        ok: false,
        error: "Failed to persist webhook event",
        message: err instanceof Error ? err.message : String(err)
      },
      500
    );
  }
}
