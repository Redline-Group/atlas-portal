/** The header status pills, on the --tan bar they sit on. */
export function PreviewStatusPills() {
  return (
    <div>
      <p className="mono" style={{ fontSize: 10, color: "var(--tan-3)", margin: "0 0 6px" }}>
        status pills (on --tan background)
      </p>
      <div style={{ display: "flex", gap: 0, alignItems: "center", background: "var(--tan)", padding: "0 8px", borderRadius: 3, width: "fit-content" }}>
        <span className="mono" style={{ fontSize: 10, lineHeight: "24px", color: "var(--magenta)", fontWeight: 600, paddingRight: 12 }}>
          update available
        </span>
        <span className="mono" style={{ fontSize: 10, lineHeight: "24px", color: "var(--red)", fontWeight: 600 }}>
          no network
        </span>
      </div>
    </div>
  );
}
