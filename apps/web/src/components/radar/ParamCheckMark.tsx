import type { ReactNode } from "react";
import { explorerTxUrl } from "@/lib/explorer";
import { atlasOnchainHref } from "@/lib/routes";
import { AtlasLink } from "../AtlasLink";
import { Tooltip } from "../Tooltip";
import { ChainVerdict } from "../ChainGlyph";
import type { ParamMark } from "../../lib/paramChecks";
import type { RowMark, TipLine } from "../../lib/rowMark";
import { SourceMark } from "../SourceMark";
import { formatReadTime } from "@/lib/provenance/asOf";

// Red is kept for "the atlas is probably wrong" (the chain holds what the atlas
// leaves unstated), because the reader updates the atlas. A disagreement could
// be either side's, so it is amber; a key the contract never set is grey, and
// so is a difference the chain is still expected to catch up on (a clock).
const LOOK: Record<ParamMark, { glyph: React.ReactNode; color: string }> = {
  match: { glyph: <ChainVerdict kind="match" />, color: "var(--terminal-green)" },
  mismatch: { glyph: <ChainVerdict kind="mismatch" />, color: "var(--warn)" },
  pending: { glyph: <ChainVerdict kind="pending" />, color: "var(--tan-3)" },
  "not-set": { glyph: <ChainVerdict kind="not-set" />, color: "var(--tan-3)" },
  "not-stated": { glyph: <ChainVerdict kind="not-stated" />, color: "var(--tan-3)" },
  candidate: { glyph: <ChainVerdict kind="candidate" />, color: "var(--error-text)" },
  unsure: { glyph: <ChainVerdict kind="unsure" />, color: "var(--tan-3)" },
};

const dim = { color: "var(--tan-3)" };

/** How long a pointer rests on a mark before its tooltip opens. */
export const CHECK_TIP_MS = 550;

function Line({ line }: { line: TipLine }) {
  if ("text" in line) return <p>{line.text}</p>;
  if ("label" in line) {
    return (
      <p className="flex justify-between gap-3">
        <span style={dim}>{line.label}</span>
        <span className="text-right" style={{ color: "var(--tan)" }}>{line.value}</span>
      </p>
    );
  }
  const when = formatReadTime(line.readAt);
  const read = when && `read ${when}`;
  // A limit read live with no history (a Solana account) has no set time.
  if (!line.set.time) return read ? <p style={dim}>{read}</p> : null;
  return (
    <p style={dim}>
      set{" "}
      <a href={explorerTxUrl(line.chain, line.set.tx)} target="_blank" rel="noopener" className="hover:underline">
        {line.set.time.slice(0, 10)}
      </a>
      {read && ` · ${read}`}
    </p>
  );
}

function MarkTip({ mark }: { mark: RowMark }) {
  const look = LOOK[mark.mark];
  return (
    <div className="mono text-[10px] space-y-1" style={{ minWidth: 200, maxWidth: 360 }}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold" style={{ color: look.color }}>{look.glyph} {mark.head}</p>
        <SourceMark source="onchain" plain className="shrink-0" hint="This mark compares the Atlas's value with what the contract holds." />
      </div>
      {mark.lines.map((line, i) => <Line key={i} line={line} />)}
    </div>
  );
}

/**
 * A card row's verdict against the chain, in the card's mark column: ✓ ✗ ! ?, a clock (pending),
 * – or a circled ! (the chain holds an ID or value the atlas leaves unstated), linked to the stating document's Onchain tab. A row with nothing
 * to check shows `children` in the same slot instead (the card's derived symbol), so the column holds one symbol per row and lines up.
 */
export function ParamCheckMark({ mark, children }: { mark: RowMark | null; children?: ReactNode }) {
  const look = mark ? LOOK[mark.mark] : null;
  const glyph = look && <span style={{ color: look.color }}>{look.glyph}</span>;
  return (
    <span className={`${mark ? "relative z-10 " : ""}mono text-[10px] shrink-0 w-4 ml-2 text-center font-semibold`} data-check={mark?.mark}>
      {mark ? (
        <Tooltip content={<MarkTip mark={mark} />} delay={CHECK_TIP_MS}>
          {mark.docId ? (
            <AtlasLink to={atlasOnchainHref(mark.docId)} aria-label={mark.head}>{glyph}</AtlasLink>
          ) : (
            <span role="img" tabIndex={0} aria-label={mark.head}>{glyph}</span>
          )}
        </Tooltip>
      ) : (
        children
      )}
    </span>
  );
}
