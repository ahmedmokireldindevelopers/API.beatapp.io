import { getGhlOAuthEnv } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import { saveHighLevelOAuthSession } from "@/lib/highlevel";

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

  let oauthEnv: ReturnType<typeof getGhlOAuthEnv>;
  try {
    oauthEnv = getGhlOAuthEnv();
  } catch {
    return new Response("Missing GHL OAuth env variables", { status: 500 });
  }

  const tokenRes = await fetch(oauthEnv.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: oauthEnv.clientId,
      client_secret: oauthEnv.clientSecret,
      code,
      redirect_uri: oauthEnv.redirectUri
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

  let sdkSessionWarning: string | null = null;
  try {
    await saveHighLevelOAuthSession({
      locationId: resolvedLocationId,
      companyId: resolvedCompanyId,
      tokenJson
    });
  } catch (err) {
    sdkSessionWarning = err instanceof Error ? err.message : String(err);
  }

  return new Response(
    `GoHighLevel connected successfully.\nlocationId=${resolvedLocationId ?? ""}\ncompanyId=${resolvedCompanyId ?? ""}${sdkSessionWarning ? `\nwarning=${sdkSessionWarning}` : ""}`,
    { status: 200 }
  );
}
