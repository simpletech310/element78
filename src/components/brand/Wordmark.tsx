export function Wordmark({ size = 28, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <span
      className="e-display"
      style={{ fontSize: size, color, letterSpacing: "0.04em" }}
    >
      ELEMENT
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.5em",
          letterSpacing: 0,
          marginLeft: "0.4em",
          verticalAlign: "0.2em",
          border: `1px solid ${color === "currentColor" ? "currentColor" : color}`,
          padding: "0.15em 0.4em",
          borderRadius: 2,
        }}
      >
        78
      </span>
    </span>
  );
}

export function E78Logo({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <span className="e78-logo" style={{ fontSize: size, color }}>
      <span>Element</span>
      <span className="num">78</span>
    </span>
  );
}
