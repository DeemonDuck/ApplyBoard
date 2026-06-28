import { useState } from "react";
import { STATUSES } from "../constants";

function daysSince(dateString) {
  const then = new Date(dateString);
  const now = new Date();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function ApplicationRow({ application, onRowClick, onStatusChange }) {
  const [changingStatus, setChangingStatus] = useState(false);

  async function handleStatusChange(e) {
    const newStatus = e.target.value;
    if (newStatus === application.status) return;
    setChangingStatus(true);
    try {
      await onStatusChange(application.id, newStatus);
    } finally {
      setChangingStatus(false);
    }
  }

  const daysNum = Math.floor((new Date() - new Date(application.date_applied)) / (1000 * 60 * 60 * 24));
  const daysText = daysSince(application.date_applied);
  const daysColor = daysNum <= 3 ? "var(--status-applied)" : daysNum <= 14 ? "var(--status-interview)" : "var(--paper-dim)";
  const statusColor = STATUSES.find((s) => s.key === application.status)?.color || "transparent";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRowClick(application)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onRowClick(application);
      }}
      className="app-row"
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1.4fr 1fr 1.6fr 110px 160px",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-3) var(--space-4)",
        borderBottom: "1px solid var(--ink-line)",
        cursor: "pointer",
        borderLeft: `3px solid ${statusColor}`,
      }}
    >
      <div style={{ fontWeight: 600, color: "var(--paper)" }}>{application.company}</div>

      <div style={{ color: "var(--paper-dim)" }}>{application.role}</div>

      <div style={{ color: "var(--paper-faint)", fontSize: "13px" }}>{application.location || "—"}</div>

      <div
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "var(--paper-faint)",
          fontSize: "13px",
        }}
      >
        {application.notes || "—"}
      </div>

      <div
        style={{
          color: daysColor,
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.02em",
        }}
      >
        {daysText}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <select
          value={application.status}
          onChange={handleStatusChange}
          disabled={changingStatus}
          style={{
            background: "var(--ink)",
            color: statusColor,
            border: "1px solid var(--ink-line)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 8px",
            fontSize: "12px",
            fontFamily: "var(--font-body)",
            cursor: "pointer",
            width: "100%",
            outline: "none",
          }}
        >
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key} style={{ background: "var(--ink-raised)", color: "var(--paper)" }}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}