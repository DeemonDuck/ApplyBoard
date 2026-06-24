import ApplicationCard from "./ApplicationCard";

/**
 * One column in the pipeline view, e.g. all "Interview" stage applications.
 * The header count uses mono font to feel like a precise readout, not a
 * decorative number.
 */
export default function PipelineColumn({ status, applications, onCardClick }) {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: "240px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "var(--space-2) var(--space-1)",
          marginBottom: "var(--space-3)",
          borderBottom: `2px solid ${status.color}`,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "15px",
            fontWeight: 600,
            color: status.color,
          }}
        >
          {status.label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--paper-faint)",
          }}
        >
          {applications.length}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: "60px" }}>
        {applications.length === 0 ? (
          <div
            style={{
              fontSize: "12px",
              color: "var(--paper-faint)",
              fontStyle: "italic",
              padding: "var(--space-3) var(--space-1)",
            }}
          >
            Nothing here yet
          </div>
        ) : (
          applications.map((app) => (
            <ApplicationCard key={app.id} application={app} onClick={() => onCardClick(app)} />
          ))
        )}
      </div>
    </div>
  );
}
