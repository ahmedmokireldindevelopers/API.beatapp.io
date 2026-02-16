import { getWafeqOAuthEnv } from "@/lib/env";
import { createWafeqState } from "@/lib/oauth-state";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locationId = url.searchParams.get("locationId");

  if (!locationId) {
    return new Response("Missing locationId", { status: 400 });
  }

  let oauthEnv: ReturnType<typeof getWafeqOAuthEnv>;
  try {
    oauthEnv = getWafeqOAuthEnv();
  } catch {
    return new Response("Missing Wafeq OAuth env variables", { status: 500 });
  }

  const state = createWafeqState(locationId);

  const authorizeUrl = new URL(oauthEnv.authorizeUrl);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", oauthEnv.clientId);
  authorizeUrl.searchParams.set("redirect_uri", oauthEnv.redirectUri);
  authorizeUrl.searchParams.set("state", state);

  const scope = oauthEnv.scope;
  if (scope) {
    authorizeUrl.searchParams.set("scope", scope);
  }

  return Response.redirect(authorizeUrl.toString(), 302);
}
