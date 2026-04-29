import QRCode from "qrcode";

/**
 * Server-rendered QR card. Generates the SVG inline via the `qrcode` package
 * (no client-side JS) and styles it with the brand palette so it reads like
 * an Element 78 component, not a generic QR widget.
 *
 * The encoded payload is just `e78://checkin/<userId>` — gym staff scan it
 * and look up the user. Future hardening: include a short-lived signed JWT
 * so a stolen QR can't be replayed.
 */
export async function QrCard({
  userId,
  memberName,
  memberId,
  tierLabel,
}: {
  userId: string;
  memberName: string;
  memberId: string;
  tierLabel: string;
}) {
  const payload = `e78://checkin/${userId}`;
  const svg = await QRCode.toString(payload, {
    type: "svg",
    margin: 1,
    color: { dark: "#0a0e14", light: "#f2eee8" },
    errorCorrectionLevel: "M",
    width: 240,
  });

  return (
    <div style={{
      borderRadius: 22, padding: 22,
      background: "linear-gradient(140deg, var(--bone) 0%, #ffffff 100%)",
      color: "var(--ink)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
      maxWidth: 360, margin: "0 auto",
      boxShadow: "0 8px 32px rgba(10,14,20,0.18)",
    }}>
      <div className="e-mono" style={{ color: "var(--electric-deep)", fontSize: 10, letterSpacing: "0.25em", textAlign: "center" }}>
        SCAN AT THE FRONT DESK
      </div>

      <div
        // The qrcode library returns a full SVG document; render it raw.
        dangerouslySetInnerHTML={{ __html: svg }}
        style={{ width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}
        aria-label="Member check-in QR code"
      />

      <div style={{ width: "100%", borderTop: "1px solid rgba(10,14,20,0.08)", paddingTop: 12, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1, letterSpacing: "0.02em" }}>
          {memberName}
        </div>
        <div className="e-mono" style={{ marginTop: 6, fontSize: 10, color: "rgba(10,14,20,0.55)", letterSpacing: "0.2em" }}>
          {memberId} · {tierLabel}
        </div>
      </div>
    </div>
  );
}
