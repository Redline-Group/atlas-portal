import { formatReadTime } from "@/lib/provenance/asOf";
import { SourceMark } from "./SourceMark";
import { TipRow } from "./AddressTooltipRow";

/**
 * The hover card's "as of" row, once for the card's chain values: when the
 * balances (and a Safe's setup) were read, and when the prices valuing them
 * were quoted. Nothing when no reading time is known.
 */
export function AddressTooltipAsOf({ readAt, priceAt }: { readAt: string | null; priceAt: string | null }) {
  const read = formatReadTime(readAt);
  if (!read) return null;
  const quoted = formatReadTime(priceAt);
  return (
    <TipRow label="as of">
      <SourceMark source="onchain" unlinked /> read {read}
      {quoted && (
        <>
          {" · prices "}
          <SourceMark source="external" unlinked /> DefiLlama {quoted}
        </>
      )}
    </TipRow>
  );
}
