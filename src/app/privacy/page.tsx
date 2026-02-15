export const metadata = {
  title: "Privacy Policy | BeatApp"
};

export default function PrivacyPage() {
  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: "2rem", lineHeight: 1.7 }}>
      <h1>Privacy Policy</h1>
      <p>Last updated: February 15, 2026</p>

      <h2>1. Data We Process</h2>
      <p>
        We process integration-related data required to provide connected services, including OAuth tokens, account
        identifiers, and operational metadata.
      </p>

      <h2>2. Purpose of Processing</h2>
      <p>
        Data is used to authenticate platform connections, execute sync workflows, and maintain service stability and
        security.
      </p>

      <h2>3. Storage and Security</h2>
      <p>
        We apply technical controls to protect stored integration credentials and records. Access is restricted to
        authorized backend components and operators.
      </p>

      <h2>4. Data Sharing</h2>
      <p>
        We do not sell personal data. Data is shared only with required service providers and connected platforms as
        needed to deliver functionality.
      </p>

      <h2>5. Retention and Deletion</h2>
      <p>
        Integration records are retained while the connection is active. You may request disconnection and deletion
        based on applicable legal and contractual obligations.
      </p>

      <h2>6. Contact</h2>
      <p>For privacy requests, contact: privacy@beatapp.io</p>
    </main>
  );
}
