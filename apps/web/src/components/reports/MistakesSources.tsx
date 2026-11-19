// The banner's list of Edit Candidates sources: what each one checks, and
// which are still loading or could not be loaded for this visit.
import type { SourceStatus } from "./useCandidateSources";

const STATE_NOTE: Record<SourceStatus["state"], string> = {
  ready: "",
  pending: " Loading…",
  failed: " Unavailable right now, so its candidates are missing from the list.",
};

export function MistakesSources({ sources }: { sources: readonly SourceStatus[] }) {
  return (
    <ul className="text-tan-3 mt-1.5 list-none p-0 m-0 flex flex-col gap-1">
      {sources.map((s) => (
        <li key={s.id} data-state={s.state}>
          <strong className="text-tan-2">{s.label}.</strong> {s.hint}
          {s.state !== "ready" && (
            <span className="mono" style={{ color: s.state === "failed" ? "var(--warn)" : undefined }}>
              {STATE_NOTE[s.state]}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
