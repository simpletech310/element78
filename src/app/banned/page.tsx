export default function BannedPage() {
  return (
    <div style={{ background: "#0A0E14", color: "#F2EEE8", fontFamily: "system-ui, sans-serif", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div style={{ fontFamily: "serif", fontSize: 48, lineHeight: 1, fontWeight: 200 }}>ACCOUNT SUSPENDED.</div>
        <p style={{ marginTop: 24, fontSize: 14, color: "rgba(242,238,232,0.7)", lineHeight: 1.6 }}>
          Your account has been suspended. If you believe this is a mistake,
          contact support@element78.com with your account email.
        </p>
      </div>
    </div>
  );
}
