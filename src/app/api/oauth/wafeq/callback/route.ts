import { parseWafeqState } from "@/lib/oauth-state";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const queryLocationId = url.searchParams.get("locationId");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const stateData = parseWafeqState(state);
  const locationId = queryLocationId || stateData.locationId;

  if (!locationId) {
    return new Response("Missing locationId (query or state)", { status: 400 });
  }

  const tokenUrl =
    process.env.WAFEQ_TOKEN_URL || "https://app.wafeq.com/oauth/token/";
  const clientId = process.env.WAFEQ_CLIENT_ID;
  const clientSecret = process.env.WAFEQ_CLIENT_SECRET;
  const redirectUri = process.env.WAFEQ_REDIRECT_URI;

  if (!tokenUrl || !clientId || !clientSecret || !redirectUri) {
    return new Response("Missing Wafeq OAuth env variables", { status: 500 });
  }

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    })
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    return new Response(`Wafeq token exchange failed: ${errText}`, {
      status: 400
    });
  }

  const tokenJson: Record<string, unknown> = await tokenRes.json();
  const accessToken = String(tokenJson.access_token ?? "");
  const refreshToken = tokenJson.refresh_token
    ? String(tokenJson.refresh_token)
    : null;
  const expiresIn = tokenJson.expires_in ? Number(tokenJson.expires_in) : null;

  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;

  const locationKey = locationId;
  const companyKey = "";
  const userKey = "";

  const { error } = await supabase.from("integrations").upsert(
    {
      provider: "wafeq",
      location_id: locationKey,
      company_id: companyKey,
      user_id: userKey,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      meta: {
        state,
        stateValid: stateData.valid,
        raw: tokenJson
      },
      updated_at: new Date().toISOString()
    },
    { onConflict: "provider,location_id,company_id,user_id" }
  );

  if (error) {
    return new Response(`DB error: ${error.message}`, { status: 500 });
  }

  return new Response(`Wafeq connected successfully.\nlocationId=${locationId}`, {
    status: 200
  });
}
