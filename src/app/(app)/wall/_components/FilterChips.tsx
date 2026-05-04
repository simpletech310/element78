import Link from "next/link";

const FILTERS = ["ALL", "EVENTS", "WINS", "TRAINERS", "CHALLENGES", "OPEN MIC"] as const;

export function FilterChips({ active }: { active: string }) {
  const current = (FILTERS as readonly string[]).includes(active.toUpperCase()) ? active.toUpperCase() : "ALL";
  return (
    <div className="no-scrollbar" style={{ padding: "0 22px 12px", display: "flex", gap: 8, overflowX: "auto" }}>
      {FILTERS.map((label) => {
        const isActive = label === current;
        const href = label === "ALL" ? "/wall" : `/wall?filter=${encodeURIComponent(label)}`;
        return (
          <Link
            key={label}
            href={href}
            scroll={false}
            className="e-tag"
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              cursor: "pointer",
              textDecoration: "none",
              background: isActive ? "var(--ink)" : "transparent",
              color: isActive ? "var(--bone)" : "var(--ink)",
              border: isActive ? "none" : "1px solid rgba(10,14,20,0.15)",
            }}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
