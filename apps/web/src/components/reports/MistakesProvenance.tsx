// Provenance callout for the Edit Candidates report.
//
// The text sweep's rows are an AI reading stored when each document was swept,
// not recomputed from the atlas being served, so the banner is load-bearing: it
// says who wrote the rows and how they are kept current, names the atlas commit
// the sweep last covered, lists every source with any that is unavailable, and
// says how many rows point at renumbered or deleted documents or are hidden
// because their quoted text is gone.
import { useId, useState } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { LiveCheckNotes } from "./MistakesLiveCheck";
import { MistakesSources } from "./MistakesSources";
import { MOBILE_AT } from "./PotentialMistakesTable";
import type { SourceStatus } from "./useCandidateSources";

const SHA_LEN = 8;
const LEAD = "Found by an AI sweep and automatic checks — candidates, not confirmed errors.";

/** What the text sweep last covered; null when its rows could not be loaded. */
export interface SweepStamp {
  generatedAt: string;
  atlasSha: string;
  documentsScanned: number;
}

export function MistakesProvenance({
  sweep,
  sources,
  total,
  drifted,
  fixed,
}: {
  sweep: SweepStamp | null;
  sources: readonly SourceStatus[];
  total: number;
  /** Rows whose target doc was renumbered or is gone from the served atlas. */
  drifted: number;
  /** Rows hidden because their quote is absent from their document. */
  fixed: number;
}) {
  const mobile = useMediaQuery(MOBILE_AT);
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const collapsed = mobile && !open;

  return (
    <div
      className="rounded border border-[var(--border)] px-3 py-2.5 mb-4 text-xs leading-relaxed"
      style={{ borderLeftWidth: "3px", borderLeftColor: "var(--warn)" }}
      data-state={mobile ? (open ? "open" : "closed") : undefined}
    >
      {mobile ? (
        <button
          type="button"
          className="text-left w-full text-tan-2"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((v) => !v)}
        >
          <strong className="text-tan">{LEAD}</strong>
          {collapsed && <span aria-hidden="true">…</span>}
        </button>
      ) : (
        <p className="text-tan-2">
          <strong className="text-tan">{LEAD}</strong> <DisclaimerBody total={total} />
        </p>
      )}
      <div id={bodyId} hidden={collapsed || undefined}>
        {mobile && (
          <p className="text-tan-2 mt-1.5">
            <DisclaimerBody total={total} />
          </p>
        )}
        <SweepNote sweep={sweep} />
        <MistakesSources sources={sources} />
        <LiveCheckNotes drifted={drifted} fixed={fixed} />
      </div>
    </div>
  );
}

function SweepNote({ sweep }: { sweep: SweepStamp | null }) {
  return (
    <p className="text-tan-3 mt-1.5">
      The text sweep is <strong className="text-tan-2">re-run automatically</strong>: as the Atlas updates, the atlas
      worker reads each new or changed document, and the documents that cite it, again.{" "}
      {sweep && (
        <>
          It last covered the Atlas at commit <span className="mono text-accent">{sweep.atlasSha.slice(0, SHA_LEN)}</span> on{" "}
          <span className="mono">{sweep.generatedAt.slice(0, 10)}</span> ({sweep.documentsScanned.toLocaleString()} documents).{" "}
        </>
      )}
      A candidate a reviewer has ruled out stays off the list. A sweep candidate whose quoted text is no longer in its
      document is hidden as likely fixed upstream.
    </p>
  );
}

function DisclaimerBody({ total }: { total: number }) {
  return (
    <>
      These {total} candidates are places where the Atlas text may need an update, from a typo to a value the chain no
      longer matches. Each one is a <em>suspicion</em>, not a confirmed error: read the quoted text against the linked
      document before acting on it.
    </>
  );
}
