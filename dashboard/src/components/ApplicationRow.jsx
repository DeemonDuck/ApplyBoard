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

/**
 * A single application as a thin horizontal row (Notion-database-row
 * style), replacing the old card. Columns: company, role, location,
 * notes preview, days since applied, status dropdown.
 *
 * The status dropdown is the mechanism that moves a row between
 * sections - selecting a new value calls onStatusChange, which the
 * parent uses to PATCH the backend and re-fetch, so the row re-renders
 * under its new section automatically (no drag-and-drop logic needed).
 *
 * Clicking anywhere else on the row opens the full edit modal, same as
 * the old card's click behavior.
 */
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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRowClick(application)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onRowClick(application);
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1.4fr 1fr 1.6fr 110px 160px",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-3) var(--space-4)",
        borderBottom: "1px solid var(--ink-line)",
        cursor: "pointer",
      }}
    >
      <div style={{ fontWeight: 600 }}>{application.company}</div>

      <div>{application.role}</div>

      <div>{application.location || "—"}</div>

      <div
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {application.notes || "—"}
      </div>

      <div>{daysSince(application.date_applied)}</div>

      {/* stopPropagation so clicking/changing the dropdown doesn't also
          trigger the row's onClick (which opens the full edit modal) */}
      <div onClick={(e) => e.stopPropagation()}>
        <select
          value={application.status}
          onChange={handleStatusChange}
          disabled={changingStatus}
        >
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}