import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";

type LinkPayload = {
  locationId?: string;
  apiKey?: string;
  userId?: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

async function validateWafeqApiKey(apiKey: string): Promise<{
  ok: boolean;
  status?: number;
  payload?: unknown;
}> {
  const probeUrl = env.WAFEQ_PROBE_URL;

  try {
    const res = await fetch(probeUrl, {
      method: "GET",
      headers: {
        Authorization: `Api-Key ${apiKey}`
      }
    });

    const payload = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, payload };
  } catch {
    return { ok: false };
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as LinkPayload;
  const locationId = body.locationId?.trim();
  const apiKey = body.apiKey?.trim();
  const userId = body.userId?.trim() || "";

  if (!locationId) {
    return json({ error: "Missing locationId" }, 400);
  }

  if (!apiKey) {
    return json({ error: "Missing apiKey" }, 400);
  }

  const probe = await validateWafeqApiKey(apiKey);
  if (!probe.ok) {
    return json(
      {
        error: "Invalid Wafeq API key or probe failed",
        providerStatus: probe.status ?? null,
        details: probe.payload ?? null
      },
      400
    );
  }

  const { error } = await supabase.from("integrations").upsert(
    {
      provider: "wafeq",
      location_id: locationId,
      company_id: "",
      user_id: userId,
      access_token: apiKey,
      refresh_token: null,
      expires_at: null,
      meta: {
        authType: "api_key",
        probeStatus: probe.status ?? null,
        probePayload: probe.payload ?? null
      },
      updated_at: new Date().toISOString()
    },
    { onConflict: "provider,location_id,company_id,user_id" }
  );

  if (error) {
    return json({ error: `DB error: ${error.message}` }, 500);
  }

  return json({
    ok: true,
    message: "Wafeq API key linked successfully",
    locationId
  });
}
