export const metadata = {
  title: "Support | BeatApp"
};

export default function SupportPage() {
  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: "2rem", lineHeight: 1.7 }}>
      <h1>BeatApp Support</h1>
      <p>We are available to help with setup, OAuth connections, and production issues.</p>

      <h2>Contact Channels</h2>
      <ul>
        <li>Email: support@beatapp.io</li>
        <li>Technical: dev@beatapp.io</li>
      </ul>

      <h2>When Contacting Support</h2>
      <ul>
        <li>Include your sub-account/location ID</li>
        <li>Include the endpoint and timestamp of the issue</li>
        <li>Include any provider error response you received</li>
      </ul>

      <h2>Status Check</h2>
      <p>System health endpoint: https://api.beatapp.io/api/health</p>
    </main>
  );
}
