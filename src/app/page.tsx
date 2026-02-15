export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", lineHeight: 1.6 }}>
      <h1>BeatApp Integrations</h1>
      <p>Use API routes for OAuth callbacks:</p>
      <ul>
        <li>/api/health</li>
        <li>/api/ghl/contacts?locationId=YOUR_LOCATION_ID</li>
        <li>/api/oauth/crm/callback</li>
        <li>/api/oauth/wafeq/callback</li>
        <li>POST /api/oauth/wafeq/revoke</li>
        <li>/api/wafeq/connect?locationId=YOUR_LOCATION_ID</li>
        <li>POST /api/wafeq/link</li>
      </ul>
      <p>Public pages:</p>
      <ul>
        <li>/terms</li>
        <li>/privacy</li>
        <li>/documentation</li>
        <li>/support</li>
      </ul>
    </main>
  );
}
