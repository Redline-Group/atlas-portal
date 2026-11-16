import { useId, useState } from "react";
import type { VerifyState } from "./useChatStream";
import { SourceMark as ProvenanceMark } from "../SourceMark";
import { VerifyFindings, hasFindings } from "./VerifyFindings";

// Verification chip for an assistant answer (chat reliability harness,
// refutation-only design — the verifier only ever reports what the evidence
// CONTRADICTS, never what it confirms). Sits by the Sources cluster:
// "verifying…" while the audit runs, then the resolved verdict; findings
// expand on click. "unverified" (harness off or degraded) renders nothing —
// absence of a badge is the quiet default.
const LABEL: Record<string, string> = {
  checking: "verifying…",
  pass: "no contradictions found by an AI check",
};

function chipLabel(verify: VerifyState): string {
  if (verify.status === "checking" || verify.status === "pass") return LABEL[verify.status];
  if (verify.status === "fail") {
    const n = verify.contradictions.length;
    return n > 0 ? `${n} statement${n === 1 ? "" : "s"} disputed by an AI check` : "failed verification";
  }
  // warn — ruling-only now that an unagreed candidate can never drive `warn`.
  return "caution: the answer issues a ruling";
}

// Every verdict but "checking" is a model's: a contradiction a reader sees has
// passed the model confirm gate, a pass means the model auditors found none, and
// a ruling is the model's judgement of what the answer did.
function byAiCheck(verify: VerifyState): boolean {
  return verify.status === "pass" || verify.status === "warn" || (verify.status === "fail" && verify.contradictions.length > 0);
}

export function VerifyBadge({ verify, onAtlas }: { verify: VerifyState; onAtlas: (uuid: string) => void }) {
  const [open, setOpen] = useState(false);
  const findingsId = useId();
  if (verify.status === "unverified") return null;

  // Every hard failure counts, each of which can be a turn's ONLY finding —
  // omitting one let a red chip refuse to expand and explain itself. The
  // list lives in hasFindings so the chip and the findings list can never
  // disagree about whether there is anything to show.
  const label = chipLabel(verify);
  const expandable = hasFindings(verify) && verify.status !== "checking";

  return (
    <div className="rlc-verify">
      <button
        className="rlc-verify-chip"
        data-status={verify.status}
        onClick={() => expandable && setOpen((v) => !v)}
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        aria-controls={expandable ? findingsId : undefined}
      >
        <span className="rlc-verify-dot" aria-hidden="true" />
        {byAiCheck(verify) && <ProvenanceMark source="ai" bare unlinked className="mr-1" />}
        {label}
      </button>
      {open && <VerifyFindings id={findingsId} verify={verify} onAtlas={onAtlas} />}
    </div>
  );
}
