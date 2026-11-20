// Phone layout for Edit Candidates: one candidate at a time, stacked
// vertically. Swipe left for the next row, right for the previous; the
// previous/next buttons and arrow keys do the same for anyone who isn't swiping.
import { useCallback, useState, type KeyboardEvent } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useSwipe } from "../../hooks/useSwipe";
import type { MistakeRow } from "@/lib/potentialMistakesIndex";
import type { ReportQuery } from "@/lib/reportFilter";
import { MistakeCard } from "./MistakeCard";
import { PotentialMistakesPagerNav } from "./PotentialMistakesPagerNav";

const SWIPE_PX = 48;

/** Where the candidate on screen sits in the list, for `data-state`. */
const position = (index: number, count: number) => (index === 0 ? "first" : index === count - 1 ? "last" : "middle");

export type PotentialMistakesPagerProps = {
  rows: readonly MistakeRow[];
  rq: ReportQuery;
};

export function PotentialMistakesPager({ rows, rq }: PotentialMistakesPagerProps) {
  const [id, setId] = useState(rows[0]?.id);
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");

  const index = Math.max(0, rows.findIndex((r) => r.id === id));
  const row = rows[index] ?? rows[0];

  const go = useCallback(
    (i: number) => {
      const next = rows[Math.min(rows.length - 1, Math.max(0, i))];
      if (next) setId(next.id);
    },
    [rows],
  );
  const { dx, handlers } = useSwipe((step) => go(index + step), SWIPE_PX);

  if (!row) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    go(index + (e.key === "ArrowLeft" ? -1 : 1));
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Potential mistakes"
      data-focus-hint="mistakes-pager"
      data-state={position(index, rows.length)}
      tabIndex={0}
      className="outline-none"
      onKeyDown={onKeyDown}
    >
      <PotentialMistakesPagerNav index={index} count={rows.length} onGo={go} />
      <div className="touch-pan-y" style={reduce || !dx ? undefined : { transform: `translateX(${dx}px)` }} {...handlers}>
        <MistakeCard r={row} rq={rq} />
      </div>
    </section>
  );
}
