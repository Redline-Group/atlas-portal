import { formatReadTime } from "@/lib/provenance/asOf";
import { SourceMark } from "./SourceMark";
import { TipRow } from "./AddressTooltipRow";

/**
 * The hover card's "as of" row, once for the card's chain values: when the
 * balances (and a Safe's setup) were read, and when the prices valuing them
 * were quoted. Nothing when no reading time is known.
 */
// The glyphs in a hover card are links to their explanation in the legend, and
// open in a new tab so reading the card is not interrupted.
const NEW_TAB = { target: "_blank", rel: "noopener noreferrer" } as const;

export function AddressTooltipAsOf({ readAt, priceAt }: { readAt: string | null; priceAt: string | null }) {
  const read = formatReadTime(readAt);
  if (!read) return null;
  const quoted = formatReadTime(priceAt);
  return (
    <TipRow label="as of">
      <SourceMark source="onchain" bare {...NEW_TAB} /> read {read}
      {quoted && (
        <>
          {" · prices "}
          <SourceMark source="external" bare {...NEW_TAB} /> DefiLlama {quoted}
        </>
      )}
    </TipRow>
  );
}
