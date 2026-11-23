import type { CSSProperties } from "react";
import { useChevronSwing } from "./useChevronSwing";
import { pendulumLabels } from "./pendulumVerbs";
import { rungClass, rungHoverAngle, rungReverseHoverAngle, type Rung } from "./subtreeState";

export interface PendulumChevronProps {
  nodeId: string;
  docNo: string;
  rung: Rung;
  /** A flat filtered view is active: the swing skips the invisible rung 0. */
  flat: boolean;
}

// Swings a row's children between hidden, titles and titles+bodies; the hover lean is CSS.
export function PendulumChevron({ nodeId, docNo, rung, flat }: PendulumChevronProps) {
  const { ref, swing } = useChevronSwing(nodeId, rung, flat);
  const labels = pendulumLabels(rung, flat, docNo);
  const stateClass = rungClass(rung.level);
  return (
    <button
      ref={ref}
      type="button"
      className={`atlas-node-toggle atlas-node-expand-all${stateClass ? ` ${stateClass}` : ""}`}
      style={
        {
          ["--hover-deg" as string]: `${rungHoverAngle(rung, flat)}deg`,
          ["--hover-deg-alt" as string]: `${rungReverseHoverAngle(rung, flat)}deg`,
        } as CSSProperties
      }
      aria-label={labels.name}
      title={labels.tooltip}
      data-mod-hint="pendulum"
      onClick={swing}
    >
      »
    </button>
  );
}
