export const metadata = {
  title: "Terms and Conditions | BeatApp"
};

export default function TermsPage() {
  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: "2rem", lineHeight: 1.7 }}>
      <h1>Terms and Conditions</h1>
      <p>Last updated: February 15, 2026</p>

      <h2>1. Service</h2>
      <p>
        BeatApp provides integration services between connected platforms, including OAuth-based account connections,
        data sync operations, and related API utilities.
      </p>

      <h2>2. Account Responsibility</h2>
      <p>
        You are responsible for securing credentials, API keys, and access to connected third-party accounts. You must
        ensure you have authorization to connect and process data for each account.
      </p>

      <h2>3. Acceptable Use</h2>
      <p>
        You agree not to misuse the service, attempt unauthorized access, or violate applicable laws and provider
        policies.
      </p>

      <h2>4. Availability</h2>
      <p>
        We may update, suspend, or modify features to improve reliability, security, or compliance. We do not guarantee
        uninterrupted availability.
      </p>

      <h2>5. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, BeatApp is not liable for indirect, incidental, or consequential
        damages arising from the use of the service.
      </p>

      <h2>6. Contact</h2>
      <p>For legal questions, contact: support@beatapp.io</p>
    </main>
  );
}
