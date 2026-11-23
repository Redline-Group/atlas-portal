import { useCopyState } from "../hooks/useCopyState";
import { buildOverrideSnippet } from "./palette-storage";
import { PALETTE_TOKENS } from "./palette-tokens";

const BAR_STYLE: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 24,
  paddingBottom: 16,
  borderBottom: "1px solid var(--border)",
  alignItems: "center",
};

const COPIED_FLASH_MS = 1500;

function applyStyle(enabled: boolean): React.CSSProperties {
  return {
    fontSize: 11,
    padding: "6px 14px",
    background: enabled ? "var(--accent)" : "var(--surface)",
    color: enabled ? "var(--bg)" : "var(--tan-3)",
    border: `1px solid ${enabled ? "var(--accent)" : "var(--border)"}`,
    borderRadius: 4,
    cursor: enabled ? "pointer" : "not-allowed",
    fontWeight: 600,
  };
}

function secondaryStyle(enabled: boolean): React.CSSProperties {
  return {
    fontSize: 11,
    padding: "6px 14px",
    background: "var(--surface)",
    color: "var(--tan-3)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    cursor: enabled ? "pointer" : "not-allowed",
  };
}

export type PaletteToolbarProps = {
  /** The unsaved override values; "copy as css" exports them. */
  draft: Record<string, string>;
  /** Whether the draft differs from what this browser has saved. */
  isDirty: boolean;
  /** Whether this browser has saved overrides. */
  hasSaved: boolean;
  onApply: () => void;
  onReset: () => void;
};

/** The draft's actions (apply, reset, copy as CSS) and its status note. */
export function PaletteToolbar({ draft, isDirty, hasSaved, onApply, onReset }: PaletteToolbarProps) {
  const { copied, copy } = useCopyState(COPIED_FLASH_MS);
  const hasDraft = Object.keys(draft).length > 0;
  const canReset = hasSaved || hasDraft;

  return (
    <div style={BAR_STYLE}>
      <button onClick={onApply} disabled={!isDirty} className="mono" style={applyStyle(isDirty)}>
        apply
      </button>
      <button onClick={onReset} disabled={!canReset} className="mono" style={secondaryStyle(canReset)}>
        reset
      </button>
      <button
        onClick={() => void copy(buildOverrideSnippet(draft, PALETTE_TOKENS))}
        disabled={!hasDraft}
        className="mono"
        style={secondaryStyle(hasDraft)}
      >
        copy as css
      </button>
      {copied && (
        <span className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>
          copied
        </span>
      )}
      {isDirty && !copied && (
        <span className="mono" style={{ fontSize: 10, color: "var(--tan-3)" }}>
          unsaved changes
        </span>
      )}
    </div>
  );
}
