import { STATUS_MAP } from "../constants";

/**
 * A small pill showing the application's current status, colored
 * consistently with the column/header it belongs to.
 */
export default function StatusBadge({ status }) {
  const info = STATUS_MAP[status] || STATUS_MAP.Applied;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: info.color,
        border: `1px solid ${info.color}`,
        borderRadius: "var(--radius-sm)",
        padding: "3px 8px",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: info.color,
          display: "inline-block",
        }}
      />
      {info.label}
    </span>
  );
}
