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
- `GHL_CLIENT_ID`
- `GHL_CLIENT_SECRET`
- `GHL_TOKEN_URL`
- `GHL_REDIRECT_URI`

Wafeq OAuth required (if using OAuth flow):
- `WAFEQ_CLIENT_ID`
- `WAFEQ_CLIENT_SECRET`
- `WAFEQ_REDIRECT_URI`

Optional:
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

## Notes

- `src/app/api/oauth/crm/callback/route.ts` handles GHL token exchange + upsert in `integrations`.
- `src/app/api/wafeq/link/route.ts` links Wafeq by API key and stores it by `locationId`.
- `src/app/api/wafeq/connect/route.ts` generates Wafeq authorize URL for each `locationId`.
- `src/app/api/oauth/wafeq/callback/route.ts` exchanges Wafeq code and stores OAuth tokens.
- `src/app/api/oauth/wafeq/revoke/route.ts` revokes Wafeq token and disconnects integration.

## Wafeq API Key Example

```bash
curl -X POST https://api.beatapp.io/api/wafeq/link \
  -H "Content-Type: application/json" \
  -d '{"locationId":"XXX","apiKey":"YOUR_WAFEQ_API_KEY"}'
```

## Wafeq Revoke Example

```bash
curl -X POST https://api.beatapp.io/api/oauth/wafeq/revoke \
  -H "Content-Type: application/json" \
  -d '{"locationId":"XXX"}'
```
