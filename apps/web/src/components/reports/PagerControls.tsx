interface Props {
  index: number;
  count: number;
  onStep: (step: number) => void;
}

const BUTTON = "min-h-11 min-w-11 text-tan-2 disabled:text-tan-3";

export function PagerControls({ index, count, onStep }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <button
        type="button"
        aria-label="Previous finding"
        disabled={index === 0}
        className={BUTTON}
        onClick={() => onStep(-1)}
      >
        ←
      </button>
      <p className="mono text-xs text-tan-3 m-0" aria-live="polite">
        {index + 1} of {count}
      </p>
      <button
        type="button"
        aria-label="Next finding"
        disabled={index === count - 1}
        className={BUTTON}
        onClick={() => onStep(1)}
      >
        →
      </button>
    </div>
  );
}
