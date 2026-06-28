import { useState } from "react";
import ApplicationRow from "./ApplicationRow";

/**
 * One collapsible section per status (Applied, Screening, Interview,
 * Offer, Rejected). Replaces the old side-by-side PipelineColumn -
 * sections now stack vertically and can individually collapse, so a
 * status with many entries (e.g. "Applied") doesn't force scrolling
 * past it to reach a status with few entries (e.g. "Interview").
 *
 * Collapsed/expanded state is local to this component (resets on page
 * reload) rather than persisted - simplest option, revisit if it turns
 * out people want it remembered across sessions.
 */
export default function StatusSection({ status, applications, onRowClick, onStatusChange }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "var(--space-2) var(--space-1)",
          borderBottom: `2px solid ${status.color}`,
          marginBottom: expanded ? "var(--space-2)" : 0,
        }}
      >
        <span style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
          ▸
        </span>
        <span style={{ fontWeight: 600, color: status.color }}>{status.label}</span>
        <span>{applications.length}</span>
      </button>

      {expanded && (
        <div>
          {applications.length === 0 ? (
            <div style={{ padding: "var(--space-3) var(--space-4)" }}>
              Nothing here yet
            </div>
          ) : (
            applications.map((app) => (
              <ApplicationRow
                key={app.id}
                application={app}
                onRowClick={onRowClick}
                onStatusChange={onStatusChange}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}