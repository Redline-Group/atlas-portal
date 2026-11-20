export type PotentialMistakesPagerNavProps = {
  /** Zero-based position of the candidate on screen. */
  index: number;
  /** How many candidates the pager holds. */
  count: number;
  /** Asks for the candidate at a position; the pager clamps it. */
  onGo: (index: number) => void;
};

export function PotentialMistakesPagerNav({ index, count, onGo }: PotentialMistakesPagerNavProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <button
        type="button"
        aria-label="Previous candidate"
        disabled={index === 0}
        className="min-h-11 min-w-11 text-tan-2 disabled:text-tan-3"
        onClick={() => onGo(index - 1)}
      >
        ←
      </button>
      <p className="mono text-xs text-tan-3 m-0" aria-live="polite">
        {index + 1} of {count}
      </p>
      <button
        type="button"
        aria-label="Next candidate"
        disabled={index === count - 1}
        className="min-h-11 min-w-11 text-tan-2 disabled:text-tan-3"
        onClick={() => onGo(index + 1)}
      >
        →
      </button>
    </div>
  );
}
