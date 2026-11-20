const ENTITY_SAMPLES = [
  { label: "Agent",            token: "entity-agent" },
  { label: "Facilitator",      token: "entity-facilitator-org" },
  { label: "GovOps",           token: "entity-govops-org" },
  { label: "Aligned Delegate", token: "entity-delegate-org" },
  { label: "Foundation",       token: "entity-foundation" },
] as const;

/** One outlined label per entity-type colour token. */
export function PreviewEntityLabels() {
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
