// Phone layout for Potential Mistakes: one finding at a time, stacked
// vertically. Swipe left for the next row, right for the previous; the
// previous/next buttons and arrow keys do the same for anyone who isn't swiping.
import type { KeyboardEvent } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import type { MistakeRow } from "@/lib/potentialMistakesIndex";
import type { ReportQuery } from "@/lib/reportFilter";
import { MistakeCard } from "./MistakeCard";
import { PagerControls } from "./PagerControls";
import { usePagerIndex } from "./usePagerIndex";
import { usePagerSwipe } from "./usePagerSwipe";

export type PotentialMistakesPagerProps = {
  rows: readonly MistakeRow[];
  rq: ReportQuery;
};

export function PotentialMistakesPager({ rows, rq }: PotentialMistakesPagerProps) {
  const { index, row, at, go } = usePagerIndex(rows);
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const swipe = usePagerSwipe((step) => go(index + step));
  const onArrowKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    go(index + (e.key === "ArrowLeft" ? -1 : 1));
  };

  if (!row) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Potential mistakes"
      data-focus-hint="mistakes-pager"
      data-state={at}
      tabIndex={0}
      className="outline-none"
      onKeyDown={onArrowKey}
    >
      <PagerControls index={index} count={rows.length} onStep={(step) => go(index + step)} />
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
