/**
 * Content readers for pattern-driven graph extraction: assignment sentences,
 * name lists and bullet items. Re-exported by graph-patterns.mjs, the one
 * entry point importers use.
 */

// Extract "X is Y." or "X is the Y." from content
export function extractAssignment(content: string | null | undefined, prefix: string) {
  const re = new RegExp(prefix + "\\s+is\\s+(?:the\\s+)?([^.\\[]+)\\.", "i");
  const m = content?.match(re);
  return m ? m[1].trim() : null;
}

// Parse a comma/and-separated list, stripping leading "the " / "and ".
export function parseNameList(str: string) {
  return str
    .split(/,\s*/)
    .flatMap((p) => p.split(/\s+and\s+/i))
    .map((s) =>
      s
        .trim()
        .replace(/^(?:the|and)\s+/i, "")
        .trim(),
    )
    .filter(Boolean);
}

// Extract list items from Active Data content (for ERG membership, delegate lists)
export function extractListItems(content: string | null | undefined) {
  return (
    (content ?? "")
      .split("\n")
      .filter((l) => /^[-*]\s+/.test(l.trim()))
      .map((l) =>
        l
          .trim()
          .replace(/^[-*]\s+/, "")
          .trim(),
      )
      // Strip "Recipient: X" or bullet labels; keep plain names.
      .map((l) => l.replace(/^Recipient:\s*/i, "").trim())
      .filter(Boolean)
  );
}
