// Phone layout for Potential Mistakes: one finding at a time, stacked
// vertically. Swipe left for the next row, right for the previous; the
// previous/next buttons and arrow keys do the same for anyone who isn't swiping.
import { useCallback, useState } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import type { MistakeRow } from "@/lib/potentialMistakesIndex";
import type { ReportQuery } from "@/lib/reportFilter";
import { MistakeCard } from "./MistakeCard";
import { usePagerSwipe } from "./usePagerSwipe";

export type PotentialMistakesPagerProps = {
  rows: readonly MistakeRow[];
  rq: ReportQuery;
};

export function PotentialMistakesPager({ rows, rq }: PotentialMistakesPagerProps) {
  const [id, setId] = useState(rows[0]?.id);
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");

  const index = Math.max(0, rows.findIndex((r) => r.id === id));
  const row = rows[index] ?? rows[0];
  const at = index === 0 ? "first" : index === rows.length - 1 ? "last" : "middle";

  const go = useCallback(
    (i: number) => {
      const next = rows[Math.min(rows.length - 1, Math.max(0, i))];
      if (next) setId(next.id);
    },
    [rows],
  );

  const swipe = usePagerSwipe((step) => go(index + step));

  if (!row) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Potential mistakes"
      data-focus-hint="mistakes-pager"
      data-state={at}
      tabIndex={0}
      className="outline-none"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(index - 1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          go(index + 1);
        }
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <button
          type="button"
          aria-label="Previous finding"
          disabled={index === 0}
          className="min-h-11 min-w-11 text-tan-2 disabled:text-tan-3"
          onClick={() => go(index - 1)}
        >
          ←
        </button>
        <p className="mono text-xs text-tan-3 m-0" aria-live="polite">
          {index + 1} of {rows.length}
        </p>
        <button
          type="button"
          aria-label="Next finding"
          disabled={index === rows.length - 1}
          className="min-h-11 min-w-11 text-tan-2 disabled:text-tan-3"
          onClick={() => go(index + 1)}
        >
          →
        </button>
      </div>
      <div
        className="touch-pan-y"
        style={reduce || !swipe.dx ? undefined : { transform: `translateX(${swipe.dx}px)` }}
        {...swipe.handlers}
      >
        <MistakeCard r={row} rq={rq} />
      </div>
    </section>
  );
}
