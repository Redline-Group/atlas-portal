import { FAILED_READ_NOTE, INFERRED_DECIMALS_NOTE, type LimitCaveats } from "@/lib/pauLimitNotes";

const dim = { color: "var(--tan-3)" };

/** † and ‡ after an amount, one per caveat it carries; the footnote below the table says what each means. */
export function LimitMarks({ failed, inferred }: LimitCaveats) {
  if (!failed && !inferred) return null;
  return (
    <sup className="ml-0.5" style={dim}>
      {failed && <span data-caveat="failed" role="img" aria-label={FAILED_READ_NOTE}>†</span>}
      {inferred && <span data-caveat="inferred" role="img" aria-label={INFERRED_DECIMALS_NOTE}>‡</span>}
    </sup>
  );
}

/** What † and ‡ mean, with how many rows carry each; nothing when no row carries either. */
export function LimitFootnote({ failed, inferred }: { failed: number; inferred: number }) {
  if (!failed && !inferred) return null;
  return (
    <p className="mono text-[11px] mt-1" style={dim}>
      {failed > 0 && <span>† {FAILED_READ_NOTE} ({failed})</span>}
      {failed > 0 && inferred > 0 && " · "}
      {inferred > 0 && <span>‡ {INFERRED_DECIMALS_NOTE} ({inferred})</span>}
    </p>
  );
}
