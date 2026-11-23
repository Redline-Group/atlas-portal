import { usePreviewDiff } from "../lib/previewDiff";
import { TipRow } from "./AddressTooltipRow";

// diff.json keys addresses the way addresses.atlas.json does: EVM lowercased,
// case-sensitive Solana base58 as written.
const keyOf = (address: string): string => (address.startsWith("0x") ? address.toLowerCase() : address);

/** The hover card's "preview" row, only for an address this preview brings in:
 *  no document on its diff base names it. Such an address has usually never
 *  been read on chain, which is why its card shows no Safe or holdings. */
export function AddressTooltipPreview({ address }: { address: string }) {
  const { newAddresses } = usePreviewDiff();
  if (!newAddresses?.has(keyOf(address))) return null;
  return (
    <TipRow label="preview">
      <span className="text-tan" data-preview-new>+ new in this preview</span>
    </TipRow>
  );
}
