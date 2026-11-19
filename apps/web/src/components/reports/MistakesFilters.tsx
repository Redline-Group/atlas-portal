// Filter pill groups for Potential Mistakes. On a phone the groups start
// folded so the finding card isn't pushed below the fold; desktop always
// shows them. Open/closed is local — the active pills still live in the URL.
import { useId, useState } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { KindPills, PlacePills, type MistakeFilterProps } from "./MistakesFilterGroups";
import { MOBILE_AT } from "./PotentialMistakesTable";

export function MistakesFilters(props: MistakeFilterProps) {
  const mobile = useMediaQuery(MOBILE_AT);
  const [open, setOpen] = useState(false);
  const pills = (
    <div className="flex flex-col gap-1.5">
      <KindPills {...props} />
      <PlacePills {...props} />
    </div>
  );

  if (!mobile) return <div className="mb-4">{pills}</div>;

  return (
    <FilterFold open={open} onToggle={() => setOpen((v) => !v)}>
      {pills}
    </FilterFold>
  );
}

function FilterFold({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const bodyId = useId();
  return (
    <div className="mb-4" data-state={open ? "open" : "closed"}>
      <button
        type="button"
        className="mono text-xs text-tan-2 min-h-11"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
      >
        <span className="mr-1.5" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
        Filters
      </button>
      {open && (
        <div id={bodyId} className="mt-1.5">
          {children}
        </div>
      )}
    </div>
  );
}
