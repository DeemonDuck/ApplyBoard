import { STATUSES } from "../constants";

export default function StatsHeader({ stats }) {
  if (!stats) return null;

  const centerRadius = 28;
  const ringGap = 5;
  const maxOuterRadius = 76;

  // Pre-calculate ring geometry so each ring is proportional to its count
  const total = stats.total || 1;
  const availableSpace = maxOuterRadius - centerRadius - (STATUSES.length * ringGap);
  
  let cursor = centerRadius + ringGap;
  const rings = STATUSES.map((s) => {
    const count = stats[s.key] || 0;
    const share = count / total;
    const thickness = count === 0 ? 0 : Math.max(2.5, share * availableSpace);
    const radius = thickness > 0 ? cursor + thickness / 2 : 0;
    cursor += thickness + ringGap;
    return { ...s, count, radius, thickness };
  }).filter((r) => r.count > 0);

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
      {/* SIGNATURE ELEMENT: Living tree cross-section */}
      <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
        <svg
          viewBox="0 0 160 160"
          className="growth-rings-svg"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          {/* Heartwood center */}
          <circle
            cx="80"
            cy="80"
            r={centerRadius}
            fill="var(--ink-raised)"
            stroke="var(--ink-line)"
            strokeWidth="1"
            opacity="0.9"
          />

          {/* Growth rings — one per status, thickness = share of total */}
          {rings.map((ring, i) => (
            <circle
              key={ring.key}
              cx="80"
              cy="80"
              r={ring.radius}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.thickness}
              opacity="0.55"
              className="growth-ring"
              style={{ animationDelay: `${i * 1.2}s` }}
            />
          ))}

          {/* A single wandering seed on the outer edge */}
          <circle cx="80" cy={80 - (rings[rings.length - 1]?.radius || centerRadius + 10)} r="1.5" fill="var(--paper)" opacity="0.5">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 80 80"
              to="360 80 80"
              dur="90s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        {/* Total count centered in the heartwood */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "32px",
              lineHeight: 1,
              color: "var(--paper)",
              letterSpacing: "-0.02em",
            }}
          >
            {stats.total}
          </div>
          <div
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--paper-faint)",
              marginTop: "4px",
              fontFamily: "var(--font-body)",
            }}
          >
            Total
          </div>
        </div>
      </div>

      {/* Per-status breakdown */}
      <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap", alignItems: "flex-start" }}>
        {STATUSES.map((s) => (
          <div key={s.key} style={{ minWidth: "60px" }}>
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
                marginTop: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: s.color,
                  opacity: 0.8,
                }}
              />
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}