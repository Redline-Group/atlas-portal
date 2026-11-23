import { useState } from "react";
import { ColorPickerModal } from "./ColorPickerModal";
import { ContrastAudit } from "./ContrastAudit";
import { DepthSection } from "./DepthSection";
import { PalettePreview } from "./PalettePreview";
import { SectionRule } from "./PaletteSection";
import { PaletteToolbar } from "./PaletteToolbar";
import { TokenGroupSection } from "./TokenGroupSection";
import { GROUP_ORDER, TOKEN_BY_NAME, type PaletteGroup } from "./palette-tokens";
import { useColorOverrides } from "./useColorOverrides";

const SEMANTIC_GROUPS: readonly PaletteGroup[] = GROUP_ORDER.filter((g) => g !== "depth");

function PaletteIntro() {
  return (
    <>
      <p className="mono" style={{ fontSize: 11, color: "var(--tan-3)", marginBottom: 4 }}>
        admin
      </p>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--tan)", margin: "0 0 4px" }}>
        Palette
      </h1>
      <p style={{ fontSize: 13, color: "var(--tan-3)", margin: "0 0 20px", maxWidth: 600 }}>
        Click a swatch to edit. Apply persists the override in this browser. Copy as CSS gives
        you a snippet to paste into <span className="mono">src/index.css</span> for everyone.
      </p>
    </>
  );
}

export function PalettePage() {
  const { draft, isDirty, hasSaved, setDraftValue, apply, reset, effectiveValue } =
    useColorOverrides();
  const [editing, setEditing] = useState<string | null>(null);
  const editingToken = editing ? TOKEN_BY_NAME.get(editing) : null;
  const grid = { draft, effectiveValue, onSwatchClick: setEditing };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <PaletteIntro />
        <PaletteToolbar draft={draft} isDirty={isDirty} hasSaved={hasSaved} onApply={apply} onReset={reset} />
        {SEMANTIC_GROUPS.map((group) => (
          <TokenGroupSection key={group} group={group} {...grid} />
        ))}
        <SectionRule />
        <DepthSection {...grid} onSetValue={setDraftValue} />
        <SectionRule />
        <ContrastAudit effectiveValue={effectiveValue} />
        <SectionRule />
        <PalettePreview effectiveValue={effectiveValue} />
      </div>

      {editingToken && (
        <ColorPickerModal
          token={editingToken}
          initialValue={effectiveValue(editingToken.name)}
          onCancel={() => setEditing(null)}
          onConfirm={(value) => {
            setDraftValue(editingToken.name, value);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
