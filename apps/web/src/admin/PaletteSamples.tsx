export function PaletteTextSamples() {
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

const ENTITY_SAMPLES = [
  { label: "Agent",            token: "entity-agent" },
  { label: "Facilitator",      token: "entity-facilitator-org" },
  { label: "GovOps",           token: "entity-govops-org" },
  { label: "Aligned Delegate", token: "entity-delegate-org" },
  { label: "Foundation",       token: "entity-foundation" },
] as const;

export function PaletteEntitySamples() {
  return (
    <div>
      <p className="mono" style={{ fontSize: 10, color: "var(--tan-3)", margin: "0 0 6px" }}>
        entity type labels
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {ENTITY_SAMPLES.map(({ label, token }) => (
          <span
            key={token}
            className="mono"
            style={{ fontSize: 11, padding: "2px 8px", borderRadius: 3, border: `1px solid var(--${token})`, color: `var(--${token})` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PaletteStatusSamples() {
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
