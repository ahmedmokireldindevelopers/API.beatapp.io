import { HighLevel } from "@gohighlevel/api-client";

import { supabase } from "@/lib/supabase";

type JsonObject = Record<string, unknown>;
type SessionData = Record<string, unknown>;

const SDK_PROVIDER = "ghl_sdk_session";

type IntegrationRecord = {
  provider: string;
  location_id: string;
  company_id: string;
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  meta: unknown;
  updated_at: string;
};

function asObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toIsoFromExpiresIn(expiresIn?: number | null): string | null {
  if (!expiresIn || Number.isNaN(expiresIn)) {
    return null;
  }
  return new Date(Date.now() + Number(expiresIn) * 1000).toISOString();
}

function extractTokensFromSessionData(data: SessionData): {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
} {
  const accessToken = asString(data.accessToken) || asString(data.access_token);
  const refreshToken =
    asString(data.refreshToken) || asString(data.refresh_token);
  const expiresAt =
    asString(data.expiresAt) ||
    asString(data.expires_at) ||
    asString(data.expiryDate) ||
    asString(data.expiry_date);
  return { accessToken, refreshToken, expiresAt };
}

function integrationToSession(
  key: string,
  record: IntegrationRecord
): SessionData | null {
  const meta = asObject(record.meta);
  const sdkSession = asObject(meta.sdkSession);
  const base = Object.keys(sdkSession).length > 0 ? sdkSession : meta;

  const accessToken =
    asString(base.accessToken) ||
    asString(base.access_token) ||
    record.access_token;
  const refreshToken =
    asString(base.refreshToken) ||
    asString(base.refresh_token) ||
    record.refresh_token;
  const expiresAt =
    asString(base.expiresAt) ||
    asString(base.expires_at) ||
    record.expires_at ||
    null;

  if (!accessToken && !refreshToken) {
    return null;
  }

  const locationId =
    asString(base.locationId) || asString(base.location_id) || record.location_id;
  const companyId =
    asString(base.companyId) || asString(base.company_id) || record.company_id;

  return {
    ...base,
    sessionKey: key,
    accessToken,
    access_token: accessToken,
    refreshToken,
    refresh_token: refreshToken,
    expiresAt,
    expires_at: expiresAt,
    locationId,
    location_id: locationId,
    companyId,
    company_id: companyId
  };
}

const supabaseSessionStorage = {
  async init(): Promise<void> {},
  async disconnect(): Promise<void> {},

  async setSession(
    key: string,
    data: SessionData,
    ttl?: number
  ): Promise<void> {
    const { accessToken, refreshToken, expiresAt } =
      extractTokensFromSessionData(data);
    const ttlExpiresAt = toIsoFromExpiresIn(ttl ?? null);
    const effectiveExpiresAt = expiresAt || ttlExpiresAt;

    const { error } = await supabase.from("integrations").upsert(
      {
        provider: SDK_PROVIDER,
        location_id: key,
        company_id: "",
        user_id: "",
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: effectiveExpiresAt,
        meta: {
          sessionKey: key,
          sdkSession: data,
          ttlSeconds: ttl ?? null
        },
        updated_at: new Date().toISOString()
      },
      { onConflict: "provider,location_id,company_id,user_id" }
    );

    if (error) {
      throw new Error(`Failed to persist HighLevel SDK session: ${error.message}`);
    }
  },

  async getSession(key: string): Promise<SessionData | null> {
    const tryFetch = async (
      provider: string,
      column: "location_id" | "company_id"
    ): Promise<IntegrationRecord | null> => {
      const query = supabase
        .from("integrations")
        .select(
          "provider,location_id,company_id,user_id,access_token,refresh_token,expires_at,meta,updated_at"
        )
        .eq("provider", provider)
        .eq(column, key)
        .maybeSingle();

      const { data, error } = await query;
      if (error) {
        return null;
      }
      return (data as IntegrationRecord | null) ?? null;
    };

    const record =
      (await tryFetch(SDK_PROVIDER, "location_id")) ||
      (await tryFetch("ghl", "location_id")) ||
      (await tryFetch("ghl", "company_id"));

    if (!record) {
      return null;
    }

    return integrationToSession(key, record);
  },

  async deleteSession(key: string): Promise<boolean> {
    const { error } = await supabase
      .from("integrations")
      .delete()
      .eq("provider", SDK_PROVIDER)
      .eq("location_id", key)
      .eq("company_id", "")
      .eq("user_id", "");
    return !error;
  }
};

let highLevelClient: Record<string, unknown> | null = null;

function getHighLevelClientConfig(): Record<string, unknown> {
  const privateIntegrationToken =
    process.env.HIGHLEVEL_PIT || process.env.GHL_PIT;
  if (privateIntegrationToken) {
    return { privateIntegrationToken };
  }

  const clientId = process.env.HIGHLEVEL_CLIENT_ID || process.env.GHL_CLIENT_ID;
  const clientSecret =
    process.env.HIGHLEVEL_CLIENT_SECRET || process.env.GHL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing HighLevel SDK auth config: set HIGHLEVEL_PIT (or GHL_PIT) OR HIGHLEVEL_CLIENT_ID/HIGHLEVEL_CLIENT_SECRET (or GHL_CLIENT_ID/GHL_CLIENT_SECRET)."
    );
  }

  return {
    clientId,
    clientSecret,
    sessionStorage: supabaseSessionStorage
  };
}

export function getHighLevelClient(): Record<string, unknown> {
  if (!highLevelClient) {
    highLevelClient = new (HighLevel as unknown as new (cfg: unknown) => Record<
      string,
      unknown
    >)(getHighLevelClientConfig());
  }
  return highLevelClient;
}

export function isHighLevelSdkConfigured(): boolean {
  const hasPit = Boolean(process.env.HIGHLEVEL_PIT || process.env.GHL_PIT);
  const hasOauth = Boolean(
    (process.env.HIGHLEVEL_CLIENT_ID || process.env.GHL_CLIENT_ID) &&
      (process.env.HIGHLEVEL_CLIENT_SECRET || process.env.GHL_CLIENT_SECRET)
  );
  return hasPit || hasOauth;
}

async function upsertSdkSessionKey(
  sessionKey: string,
  payload: {
    locationId: string | null;
    companyId: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: string | null;
    raw: JsonObject;
  }
): Promise<void> {
  if (!sessionKey) {
    return;
  }

  const { error } = await supabase.from("integrations").upsert(
    {
      provider: SDK_PROVIDER,
      location_id: sessionKey,
      company_id: "",
      user_id: "",
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken,
      expires_at: payload.expiresAt,
      meta: {
        sessionKey,
        sdkSession: {
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          expiresAt: payload.expiresAt,
          locationId: payload.locationId,
          companyId: payload.companyId
        },
        raw: payload.raw
      },
      updated_at: new Date().toISOString()
    },
    { onConflict: "provider,location_id,company_id,user_id" }
  );

  if (error) {
    throw new Error(`Failed to upsert HighLevel SDK session: ${error.message}`);
  }
}

export async function saveHighLevelOAuthSession(params: {
  locationId: string | null;
  companyId: string | null;
  tokenJson: JsonObject;
}): Promise<void> {
  const accessToken =
    asString(params.tokenJson.access_token) ||
    asString(params.tokenJson.accessToken);
  const refreshToken =
    asString(params.tokenJson.refresh_token) ||
    asString(params.tokenJson.refreshToken);

  const expiresInRaw =
    params.tokenJson.expires_in ?? params.tokenJson.expiresIn ?? null;
  const expiresIn =
    typeof expiresInRaw === "number"
      ? expiresInRaw
      : typeof expiresInRaw === "string"
        ? Number(expiresInRaw)
        : null;
  const expiresAt = toIsoFromExpiresIn(expiresIn);

  const payload = {
    locationId: params.locationId,
    companyId: params.companyId,
    accessToken,
    refreshToken,
    expiresAt,
    raw: params.tokenJson
  };

  await upsertSdkSessionKey(params.locationId || "", payload);
  await upsertSdkSessionKey(params.companyId || "", payload);
}
