import { STATUS_MAP } from "../constants";

function daysSince(dateString) {
  const then = new Date(dateString);
  const now = new Date();
  const diffMs = now - then;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

/**
 * A single application card. Clicking it opens the detail/edit panel.
 *
 * The "days since applied" line is the signature detail of this design —
 * the real cost of losing track of applications isn't just "where did I
 * apply", it's "how long has this been sitting without a follow-up".
 * Stamping that on every card turns the dashboard into something that
 * nudges you to actually follow up, not just a passive log.
 */
export default function ApplicationCard({ application, onClick }) {
  const statusInfo = STATUS_MAP[application.status] || STATUS_MAP.Applied;

  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "var(--ink-raised)",
        border: "1px solid var(--ink-line)",
        borderLeft: `3px solid ${statusInfo.color}`,
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        marginBottom: "var(--space-3)",
        color: "var(--paper)",
        transition: "border-color 0.15s ease, transform 0.1s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--paper-faint)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--ink-line)")}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "16px",
          fontWeight: 600,
          marginBottom: "2px",
        }}
      >
        {application.company}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "var(--paper-dim)",
          marginBottom: "var(--space-3)",
        }}
      >
        {application.role}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--paper-faint)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {application.platform}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--paper-faint)",
          }}
        >
          {daysSince(application.date_applied)}
        </span>
      </div>
    </button>
  );
}
