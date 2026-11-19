// Where a candidate came from and when it was first found. A text-sweep row
// names its pass; a row from another report links to that report's detail.
import { Link } from "../Link";
import { PASS_LABELS, type MistakeRow } from "@/lib/potentialMistakesIndex";

const LINE = "mono text-[10px] text-tan-3 block";

export function MistakeSourceNote({ r }: { r: MistakeRow }) {
  return (
    <>
      {r.detailHref ? (
        <Link to={r.detailHref} className="mono text-[10px] text-accent hover:underline block" title="Open the report with this row's full detail">
          {r.sourceLabel}
        </Link>
      ) : (
        <span className={LINE} title="Which sweep pass reported this">
          {PASS_LABELS[r.pass]}
        </span>
      )}
      {r.found && (
        <span className={LINE} title="When this candidate was first found">
          found {r.found}
        </span>
      )}
    </>
  );
}
