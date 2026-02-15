export const metadata = {
  title: "Documentation | BeatApp"
};
export const dynamic = "force-static";

export default function DocumentationPage() {
  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: "2rem", lineHeight: 1.7 }}>
      <h1>BeatApp Documentation</h1>

      <h2>Available Endpoints</h2>
      <ul>
        <li>GET /api/health</li>
        <li>GET /api/oauth/crm/callback</li>
        <li>GET /api/oauth/wafeq/callback</li>
        <li>POST /api/oauth/wafeq/revoke</li>
        <li>GET /api/wafeq/connect?locationId=YOUR_LOCATION_ID</li>
        <li>POST /api/wafeq/link</li>
      </ul>

      <h2>OAuth Callback URLs</h2>
      <ul>
        <li>https://api.beatapp.io/api/oauth/crm/callback</li>
        <li>https://api.beatapp.io/api/oauth/wafeq/callback</li>
      </ul>

      <h2>Quick Health Check</h2>
      <p>https://api.beatapp.io/api/health</p>

      <h2>Support</h2>
      <p>
        If you need implementation help or onboarding support, visit <a href="/support">Support</a>.
      </p>
    </main>
  );
}
