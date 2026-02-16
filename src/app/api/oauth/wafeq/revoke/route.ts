import { getWafeqOAuthEnv } from "@/lib/env";
import { supabase } from "@/lib/supabase";

type RevokePayload = {
  locationId?: string;
  companyId?: string;
  userId?: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as RevokePayload;
  const locationId = body.locationId?.trim();
  const companyId = body.companyId?.trim() ?? "";
  const userId = body.userId?.trim() ?? "";

  if (!locationId) {
    return json({ error: "Missing locationId" }, 400);
  }

  let oauthEnv: ReturnType<typeof getWafeqOAuthEnv>;
  try {
    oauthEnv = getWafeqOAuthEnv();
  } catch {
    return json({ error: "Missing Wafeq OAuth env variables" }, 500);
  }

  const { data, error } = await supabase
    .from("integrations")
    .select("access_token,refresh_token,meta")
    .eq("provider", "wafeq")
    .eq("location_id", locationId)
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return json({ error: `DB fetch error: ${error.message}` }, 500);
  }

  if (!data) {
    return json({ error: "Wafeq integration not found for this locationId" }, 404);
  }

  const revokeToken = data.refresh_token || data.access_token;
  if (!revokeToken) {
    return json({ error: "No token stored for this integration" }, 400);
  }

  const revokeRes = await fetch(oauthEnv.revokeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: oauthEnv.clientId,
      client_secret: oauthEnv.clientSecret,
      token: revokeToken
    })
  });

  if (!revokeRes.ok) {
    const errText = await revokeRes.text();
    return json(
      {
        error: "Wafeq revoke failed",
        status: revokeRes.status,
        details: errText
      },
      400
    );
  }

  const { error: updateError } = await supabase
    .from("integrations")
    .update({
      access_token: null,
      refresh_token: null,
      expires_at: null,
      meta: {
        ...asObject(data.meta),
        revokedAt: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq("provider", "wafeq")
    .eq("location_id", locationId)
    .eq("company_id", companyId)
    .eq("user_id", userId);

  if (updateError) {
    return json({ error: `DB update error: ${updateError.message}` }, 500);
  }

  return json({
    ok: true,
    message: "Wafeq token revoked and integration disconnected",
    locationId
  });
}
