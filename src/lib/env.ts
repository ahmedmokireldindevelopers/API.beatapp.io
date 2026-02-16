import { z } from "zod";

const DEFAULT_GHL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";
const DEFAULT_WAFEQ_AUTHORIZE_URL = "https://app.wafeq.com/oauth/authorize/";
const DEFAULT_WAFEQ_TOKEN_URL = "https://app.wafeq.com/oauth/token/";
const DEFAULT_WAFEQ_REVOKE_URL = "https://app.wafeq.com/oauth/token/revoke/";
const DEFAULT_WAFEQ_PROBE_URL = "https://api.wafeq.com/v1/organization";

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const optionalString = z.preprocess(
  emptyStringToUndefined,
  z.string().min(1).optional()
);

const optionalUrl = z.preprocess(
  emptyStringToUndefined,
  z.string().url().optional()
);

const envSchema = z
  .object({
    SUPABASE_URL: z.preprocess(emptyStringToUndefined, z.string().url()),
    SUPABASE_SERVICE_ROLE_KEY: optionalString,
    SUPABASE_SECRET_KEY: optionalString,

    GHL_CLIENT_ID: optionalString,
    GHL_CLIENT_SECRET: optionalString,
    GHL_TOKEN_URL: optionalUrl.default(DEFAULT_GHL_TOKEN_URL),
    GHL_REDIRECT_URI: optionalUrl,
    GHL_WEBHOOK_PUBLIC_KEY: optionalString,

    HIGHLEVEL_PIT: optionalString,
    GHL_PIT: optionalString,
    HIGHLEVEL_CLIENT_ID: optionalString,
    HIGHLEVEL_CLIENT_SECRET: optionalString,
    HIGHLEVEL_WEBHOOK_PUBLIC_KEY: optionalString,

    WAFEQ_CLIENT_ID: optionalString,
    WAFEQ_CLIENT_SECRET: optionalString,
    WAFEQ_REDIRECT_URI: optionalUrl,
    WAFEQ_SCOPE: optionalString,
    WAFEQ_AUTHORIZE_URL: optionalUrl.default(DEFAULT_WAFEQ_AUTHORIZE_URL),
    WAFEQ_TOKEN_URL: optionalUrl.default(DEFAULT_WAFEQ_TOKEN_URL),
    WAFEQ_REVOKE_URL: optionalUrl.default(DEFAULT_WAFEQ_REVOKE_URL),
    WAFEQ_PROBE_URL: optionalUrl.default(DEFAULT_WAFEQ_PROBE_URL),

    OAUTH_STATE_SECRET: optionalString
  })
  .superRefine((values, ctx) => {
    if (!values.SUPABASE_SERVICE_ROLE_KEY && !values.SUPABASE_SECRET_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY. SUPABASE_PUBLISHABLE_KEY alone is not enough for server upserts."
      });
    }
  });

const parsedEnv = envSchema.parse(process.env);

function requireEnvValue(
  value: string | undefined,
  names: string[],
  context: string
): string {
  if (value) {
    return value;
  }

  throw new Error(`Missing ${names.join(" or ")} for ${context}`);
}

export const env = {
  ...parsedEnv,
  SUPABASE_SERVER_KEY:
    parsedEnv.SUPABASE_SERVICE_ROLE_KEY || parsedEnv.SUPABASE_SECRET_KEY!
};

export function getGhlOAuthEnv(): {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  return {
    tokenUrl: env.GHL_TOKEN_URL,
    clientId: requireEnvValue(
      env.GHL_CLIENT_ID,
      ["GHL_CLIENT_ID"],
      "GoHighLevel OAuth"
    ),
    clientSecret: requireEnvValue(
      env.GHL_CLIENT_SECRET,
      ["GHL_CLIENT_SECRET"],
      "GoHighLevel OAuth"
    ),
    redirectUri: requireEnvValue(
      env.GHL_REDIRECT_URI,
      ["GHL_REDIRECT_URI"],
      "GoHighLevel OAuth"
    )
  };
}

export function getWafeqOAuthEnv(): {
  authorizeUrl: string;
  tokenUrl: string;
  revokeUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string | undefined;
} {
  return {
    authorizeUrl: env.WAFEQ_AUTHORIZE_URL,
    tokenUrl: env.WAFEQ_TOKEN_URL,
    revokeUrl: env.WAFEQ_REVOKE_URL,
    clientId: requireEnvValue(
      env.WAFEQ_CLIENT_ID,
      ["WAFEQ_CLIENT_ID"],
      "Wafeq OAuth"
    ),
    clientSecret: requireEnvValue(
      env.WAFEQ_CLIENT_SECRET,
      ["WAFEQ_CLIENT_SECRET"],
      "Wafeq OAuth"
    ),
    redirectUri: requireEnvValue(
      env.WAFEQ_REDIRECT_URI,
      ["WAFEQ_REDIRECT_URI"],
      "Wafeq OAuth"
    ),
    scope: env.WAFEQ_SCOPE
  };
}

