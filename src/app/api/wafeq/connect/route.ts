import { createWafeqState } from "@/lib/oauth-state";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locationId = url.searchParams.get("locationId");

  if (!locationId) {
    return new Response("Missing locationId", { status: 400 });
  }

  const authorizeUrlValue =
    process.env.WAFEQ_AUTHORIZE_URL || "https://app.wafeq.com/oauth/authorize/";
  const clientId = process.env.WAFEQ_CLIENT_ID;
  const redirectUri = process.env.WAFEQ_REDIRECT_URI;

  if (!authorizeUrlValue || !clientId || !redirectUri) {
    return new Response("Missing Wafeq OAuth env variables", { status: 500 });
  }

  const state = createWafeqState(locationId);

  const authorizeUrl = new URL(authorizeUrlValue);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  const scope = process.env.WAFEQ_SCOPE;
  if (scope) {
    authorizeUrl.searchParams.set("scope", scope);
  }

  return Response.redirect(authorizeUrl.toString(), 302);
}
