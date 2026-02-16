# BeatApp Integrations (Next.js + Supabase)

OAuth callbacks for:
- GoHighLevel Marketplace app install
- Wafeq account connection per GHL sub-account (`locationId`)

## Callback URLs

Production callbacks:

- `https://api.beatapp.io/api/oauth/crm/callback`
- `https://api.beatapp.io/api/oauth/wafeq/callback`

## API Routes

- `GET /api/health`
- `GET /api/ghl/contacts?locationId=XXX&pageLimit=10`
- `POST /api/ghl/webhook`
- `GET /api/oauth/crm/callback`
- `GET /api/wafeq/connect?locationId=XXX`
- `GET /api/oauth/wafeq/callback`
- `POST /api/oauth/wafeq/revoke`
- `POST /api/wafeq/link` (alternative API Key flow)

## Public Pages

- `https://api.beatapp.io/terms`
- `https://api.beatapp.io/privacy`
- `https://api.beatapp.io/documentation`
- `https://api.beatapp.io/support`

## Supabase SQL

Run `supabase/schema.sql` in Supabase SQL Editor.

## Environment Variables

Copy `.env.example` to `.env.local` and fill values.

Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`
- GHL auth mode:
- Mode A (SDK PIT): `HIGHLEVEL_PIT` (or `GHL_PIT`)
- Mode B (OAuth): `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET`, `GHL_TOKEN_URL`, `GHL_REDIRECT_URI`

Wafeq OAuth required (if using OAuth flow):
- `WAFEQ_CLIENT_ID`
- `WAFEQ_CLIENT_SECRET`
- `WAFEQ_REDIRECT_URI`

Optional:
- `HIGHLEVEL_PIT` (or `GHL_PIT`) for SDK auth via Private Integration Token
- `HIGHLEVEL_CLIENT_ID` and `HIGHLEVEL_CLIENT_SECRET` (SDK OAuth aliases; fallback to `GHL_CLIENT_ID/GHL_CLIENT_SECRET`)
- `GHL_WEBHOOK_PUBLIC_KEY` (optional override; defaults to official HighLevel public key)
- `SUPABASE_PUBLISHABLE_KEY` (not used by server upserts, but useful for client-side features)
- `SUPABASE_ANON_KEY` (legacy/client-side key; not enough for server upserts)
- `WAFEQ_PROBE_URL` (default: `https://api.wafeq.com/v1/organization`)
- `WAFEQ_AUTHORIZE_URL` (default: `https://app.wafeq.com/oauth/authorize/`)
- `WAFEQ_TOKEN_URL` (default: `https://app.wafeq.com/oauth/token/`)
- `WAFEQ_REVOKE_URL` (default: `https://app.wafeq.com/oauth/token/revoke/`)
- `WAFEQ_SCOPE`
- `OAUTH_STATE_SECRET`

## Local Run

```bash
npm install
npm run dev
```

Health check:

```text
http://localhost:3000/api/health
```

## Vercel

1. Push to GitHub.
2. Import project into Vercel.
3. Add same env vars in Vercel Project Settings.
4. Deploy.

For future restore/import:
- Use `secure-env/.env.template` as the full key map.
- Copy it to local `secure-env/.env`, fill secrets, then use Vercel `Import .env`.

## Notes

- `src/app/api/oauth/crm/callback/route.ts` handles GHL token exchange + upsert in `integrations`.
- `src/lib/highlevel.ts` configures the official `@gohighlevel/api-client` SDK with Supabase-backed session storage.
- `src/app/api/ghl/contacts/route.ts` demonstrates calling GHL through SDK (`contacts.searchContactsAdvanced`).
- `src/app/api/wafeq/link/route.ts` links Wafeq by API key and stores it by `locationId`.
- `src/app/api/wafeq/connect/route.ts` generates Wafeq authorize URL for each `locationId`.
- `src/app/api/oauth/wafeq/callback/route.ts` exchanges Wafeq code and stores OAuth tokens.
- `src/app/api/oauth/wafeq/revoke/route.ts` revokes Wafeq token and disconnects integration.
- `src/app/api/ghl/webhook/route.ts` verifies `x-wh-signature`, filters selected events, deduplicates by `webhookId`, and stores payloads in `ghl_webhook_events`.

## HighLevel Webhook Setup

Use this webhook URL in HighLevel Marketplace:

- `https://api.beatapp.io/api/ghl/webhook`

Enable these events:

- `ContactCreate`, `ContactUpdate`
- `OpportunityCreate`, `OpportunityUpdate`, `OpportunityStatusUpdate`
- `InvoiceCreate`, `InvoiceUpdate`, `InvoicePaid`, `InvoiceVoid`

## Wafeq API Key Example

```bash
curl -X POST https://api.beatapp.io/api/wafeq/link \
  -H "Content-Type: application/json" \
  -d '{"locationId":"XXX","apiKey":"YOUR_WAFEQ_API_KEY"}'
```

## HighLevel SDK Contacts Example

```bash
curl "https://api.beatapp.io/api/ghl/contacts?locationId=YOUR_LOCATION_ID&pageLimit=5"
```

## Wafeq Revoke Example

```bash
curl -X POST https://api.beatapp.io/api/oauth/wafeq/revoke \
  -H "Content-Type: application/json" \
  -d '{"locationId":"XXX"}'
```
