import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const locationId =
    url.searchParams.get("locationId") || url.searchParams.get("location_id");
  const companyId =
    url.searchParams.get("companyId") || url.searchParams.get("company_id");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const tokenUrl = process.env.GHL_TOKEN_URL;
  const clientId = process.env.GHL_CLIENT_ID;
  const clientSecret = process.env.GHL_CLIENT_SECRET;
  const redirectUri = process.env.GHL_REDIRECT_URI;

  if (!tokenUrl || !clientId || !clientSecret || !redirectUri) {
    return new Response("Missing GHL OAuth env variables", { status: 500 });
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
    return new Response(`GHL token exchange failed: ${errText}`, {
      status: 400
    });
  }

  const tokenJson: Record<string, unknown> = await tokenRes.json();

  const accessToken = String(tokenJson.access_token ?? "");
  const refreshToken = tokenJson.refresh_token
    ? String(tokenJson.refresh_token)
    : null;
  const expiresIn = tokenJson.expires_in ? Number(tokenJson.expires_in) : null;

  const resolvedLocationId =
    locationId ||
    (typeof tokenJson.locationId === "string"
      ? tokenJson.locationId
      : typeof tokenJson.location_id === "string"
        ? tokenJson.location_id
        : null);
  const resolvedCompanyId =
    companyId ||
    (typeof tokenJson.companyId === "string"
      ? tokenJson.companyId
      : typeof tokenJson.company_id === "string"
        ? tokenJson.company_id
        : null);

  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;

  const locationKey = resolvedLocationId ?? "";
  const companyKey = resolvedCompanyId ?? "";
  const userKey = "";

  const { error } = await supabase.from("integrations").upsert(
    {
      provider: "ghl",
      location_id: locationKey,
      company_id: companyKey,
      user_id: userKey,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      meta: { state, raw: tokenJson },
      updated_at: new Date().toISOString()
    },
    { onConflict: "provider,location_id,company_id,user_id" }
  );

  if (error) {
    return new Response(`DB error: ${error.message}`, { status: 500 });
  }

  return new Response(
    `GoHighLevel connected successfully.\nlocationId=${resolvedLocationId ?? ""}\ncompanyId=${resolvedCompanyId ?? ""}`,
    { status: 200 }
  );
}
