import { useState } from "react";
import ApplicationRow from "./ApplicationRow";

const STAGE_ICONS = {
  Applied: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.7 }}>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
  Screening: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.7 }}>
      <path d="M12 20V12M12 12C12 12 10 8 8 8C8 8 10 10 12 12C14 10 16 8 16 8C16 8 14 12 12 12Z" 
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Interview: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.7 }}>
      <circle cx="12" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M12 14V20" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Offer: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.7 }}>
      <path d="M12 2C12 2 8 6 8 10C8 13 10 15 12 15C14 15 16 13 16 10C16 6 12 2 12 2Z" 
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 15V22" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 20H15" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  Rejected: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.7 }}>
      <path d="M12 4C12 4 8 8 8 12C8 15 10 17 12 17C14 17 16 15 16 12C16 8 12 4 12 4Z" 
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6"/>
      <path d="M12 17V21" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 21L14 21" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
};

export default function StatusSection({ status, applications, onRowClick, onStatusChange }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "var(--space-3) var(--space-2)",
          borderBottom: `1px solid ${status.color}`,
          marginBottom: expanded ? "var(--space-2)" : 0,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <span
          style={{
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: status.color,
            fontSize: "12px",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          ▸
        </span>

        <span style={{ color: status.color, display: "inline-flex", alignItems: "center" }}>
          {STAGE_ICONS[status.key]}
        </span>

        <span style={{ fontWeight: 600, color: status.color, fontSize: "14px", letterSpacing: "0.02em" }}>
          {status.label}
        </span>

        <span
          style={{
            color: "var(--paper-faint)",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            marginLeft: "auto",
            paddingRight: "var(--space-2)",
          }}
        >
          {applications.length}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            background: "rgba(255,255,255,0.015)",
            borderRadius: "0 0 var(--radius-md) var(--radius-md)",
            padding: applications.length === 0 ? "var(--space-3) 0" : 0,
          }}
        >
          {applications.length === 0 ? (
            <div
              style={{
                padding: "var(--space-4) var(--space-4)",
                color: "var(--paper-faint)",
                fontSize: "13px",
                fontStyle: "italic",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
                <path d="M12 22V12M12 12C12 12 9 9 9 6C9 6 11 8 12 10C13 8 15 6 15 6C15 6 12 9 12 12Z" 
                  stroke="var(--paper-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Nothing here yet — fertile ground for new seeds
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