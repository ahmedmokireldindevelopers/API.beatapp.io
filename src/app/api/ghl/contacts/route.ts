import { getHighLevelClient, isHighLevelSdkConfigured } from "@/lib/highlevel";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

export async function GET(req: Request) {
  if (!isHighLevelSdkConfigured()) {
    return json(
      {
        error:
          "HighLevel SDK is not configured. Set HIGHLEVEL_PIT (or GHL_PIT) OR HIGHLEVEL_CLIENT_ID/HIGHLEVEL_CLIENT_SECRET."
      },
      500
    );
  }

  const url = new URL(req.url);
  const locationId = url.searchParams.get("locationId");
  const pageLimitRaw = url.searchParams.get("pageLimit");
  const query = url.searchParams.get("query");

  if (!locationId) {
    return json(
      {
        error: "Missing locationId",
        example: "/api/ghl/contacts?locationId=YOUR_LOCATION_ID&pageLimit=5"
      },
      400
    );
  }

  const pageLimit = pageLimitRaw ? Number(pageLimitRaw) : 10;
  if (!Number.isFinite(pageLimit) || pageLimit <= 0 || pageLimit > 100) {
    return json(
      {
        error: "Invalid pageLimit",
        details: "pageLimit must be a number between 1 and 100"
      },
      400
    );
  }

  try {
    const highLevel = getHighLevelClient() as Record<string, unknown>;
    const contactsApi = highLevel.contacts as Record<string, unknown> | undefined;
    const searchFn = contactsApi?.searchContactsAdvanced as
      | ((payload: Record<string, unknown>) => Promise<unknown>)
      | undefined;

    if (typeof searchFn !== "function") {
      return json(
        {
          error:
            "HighLevel SDK contacts.searchContactsAdvanced is unavailable on this installed SDK version."
        },
        500
      );
    }

    const response = await searchFn({
      locationId,
      pageLimit,
      query: query || undefined
    });

    return json({
      ok: true,
      locationId,
      pageLimit,
      data: response
    });
  } catch (err) {
    return json(
      {
        error: "HighLevel SDK request failed",
        message: err instanceof Error ? err.message : String(err)
      },
      500
    );
  }
}
