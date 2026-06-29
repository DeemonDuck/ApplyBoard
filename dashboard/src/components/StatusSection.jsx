import ApplicationRow from "./ApplicationRow";

/**
 * One section per status (Applied, Screening, Interview, Offer, Rejected).
 *
 * ACCORDION BEHAVIOR: expanded/collapsed state used to live locally in
 * this component (each section toggled independently). It's now lifted
 * up to App.jsx and passed in as `isExpanded` + `onToggle`, so only ONE
 * section can be open at a time across the whole list - opening one
 * collapses whichever was previously open. This is what allows the
 * background image to represent "the current stage you're looking at"
 * rather than an ambiguous mix of multiple open sections at once.
 */
export default function StatusSection({ status, applications, isExpanded, onToggle, onRowClick, onStatusChange }) {
  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          width: "100%",
          background: "rgba(20, 30, 20, 0.6)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          border: "none",
          padding: "var(--space-2) var(--space-3)",
          borderBottom: `2px solid ${status.color}`,
          marginBottom: isExpanded ? "var(--space-2)" : 0,
          borderRadius: "var(--radius-sm)",
        }}
      >
        <span style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
          ▸
        </span>
        <span style={{ fontWeight: 600, color: status.color }}>{status.label}</span>
        <span>{applications.length}</span>
      </button>

      {isExpanded && (
        <div style={{
          background: "rgba(20, 30, 20, 0.6)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          borderRadius: "var(--radius-sm)",
        }}>
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