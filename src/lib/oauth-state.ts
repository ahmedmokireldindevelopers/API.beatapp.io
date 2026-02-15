import { createHmac } from "node:crypto";

type WafeqStatePayload = {
  locationId: string;
  ts: number;
  sig?: string;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + "=".repeat(pad), "base64").toString("utf8");
}

function signPayload(locationId: string, ts: number): string | undefined {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    return undefined;
  }

  return createHmac("sha256", secret).update(`${locationId}.${ts}`).digest("hex");
}

export function createWafeqState(locationId: string): string {
  const payload: WafeqStatePayload = {
    locationId,
    ts: Date.now()
  };

  const sig = signPayload(payload.locationId, payload.ts);
  if (sig) {
    payload.sig = sig;
  }

  return base64UrlEncode(JSON.stringify(payload));
}

export function parseWafeqState(state: string | null): {
  locationId: string | null;
  valid: boolean;
} {
  if (!state) {
    return { locationId: null, valid: false };
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(state)) as WafeqStatePayload;
    if (!parsed?.locationId) {
      return { locationId: null, valid: false };
    }

    const expectedSig = signPayload(parsed.locationId, parsed.ts);
    if (expectedSig && parsed.sig !== expectedSig) {
      return { locationId: null, valid: false };
    }

    return { locationId: parsed.locationId, valid: true };
  } catch {
    return { locationId: null, valid: false };
  }
}
