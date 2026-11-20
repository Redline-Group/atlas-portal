/** The text tiers, the accent link, error text and a search highlight. */
export function PreviewTextHierarchy() {
  return (
    <div>
      <p className="mono" style={{ fontSize: 10, color: "var(--tan-3)", margin: "0 0 6px" }}>
        text hierarchy + interactive
      </p>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "baseline", background: "var(--bg)", padding: "10px 12px", borderRadius: 4 }}>
        <span style={{ color: "var(--tan)", fontSize: 14 }}>Primary</span>
        <span style={{ color: "var(--tan-2)", fontSize: 13 }}>Secondary</span>
        <span style={{ color: "var(--tan-3)", fontSize: 12 }}>Tertiary</span>
        <span style={{ color: "var(--gray)", fontSize: 12 }}>Muted</span>
        <span style={{ color: "var(--accent)", fontSize: 13 }}>Accent link</span>
        <span style={{ color: "var(--error-text)", fontSize: 12 }} className="mono">error text</span>
        <mark style={{ background: "var(--red-dim)", color: "var(--tan)", borderRadius: 2, padding: "0 2px", fontSize: 13 }}>
          highlighted term
        </mark>
      </div>
    </div>
  );
}
