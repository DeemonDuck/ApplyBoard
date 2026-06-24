import { STATUSES } from "../constants";

/**
 * The strip at the top of the page — total count plus a per-status
 * breakdown. Numbers are mono, like a ledger total being tallied.
 */
export default function StatsHeader({ stats }) {
  if (!stats) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-6)",
        flexWrap: "wrap",
        padding: "var(--space-5) 0",
        borderBottom: "1px solid var(--ink-line)",
        marginBottom: "var(--space-6)",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "32px",
            lineHeight: 1,
            color: "var(--paper)",
          }}
        >
          {stats.total}
        </div>
        <div
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--paper-faint)",
            marginTop: "2px",
          }}
        >
          Total applications
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap" }}>
        {STATUSES.map((s) => (
          <div key={s.key}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "20px",
                lineHeight: 1,
                color: s.color,
              }}
            >
              {stats[s.key] ?? 0}
            </div>
            <div
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--paper-faint)",
                marginTop: "2px",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
