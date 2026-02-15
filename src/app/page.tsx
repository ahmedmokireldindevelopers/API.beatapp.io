export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", lineHeight: 1.6 }}>
      <h1>BeatApp Integrations</h1>
      <p>Use API routes for OAuth callbacks:</p>
      <ul>
        <li>/api/health</li>
        <li>/api/oauth/ghl/callback</li>
        <li>/api/oauth/wafeq/callback</li>
        <li>POST /api/oauth/wafeq/revoke</li>
        <li>/api/wafeq/connect?locationId=YOUR_LOCATION_ID</li>
        <li>POST /api/wafeq/link</li>
      </ul>
    </main>
  );
}
