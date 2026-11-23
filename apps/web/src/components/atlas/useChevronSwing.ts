import { useEffect, useRef, useState } from "react";
import type { MouseEvent, RefObject } from "react";
import { ChevronFeedback } from "../../lib/chevronFeedback";
import { track } from "../../lib/analytics";
import { useAtlasActions } from "./AtlasActionsContext";
import { rungAngle, swingRung, type Rung } from "./subtreeState";

export function useChevronSwing(
  nodeId: string,
  rung: Rung,
  flat: boolean,
): { ref: RefObject<HTMLButtonElement | null>; swing: (event?: MouseEvent) => void } {
  const { pendulum } = useAtlasActions();
  const ref = useRef<HTMLButtonElement>(null);
  const [feedback] = useState(() => new ChevronFeedback());
  // Stops only the pulse: cancelling the spin here (~2 frames in) would teleport the chevron.
  useEffect(() => feedback.stopPulse(), [feedback, rung.level]);
  useEffect(() => feedback.dispose, [feedback]);
  const swing = (event?: MouseEvent) => {
    // Alt, not shift: shift on a row is already split-pane navigation.
    const reverse = !!event?.altKey;
    const target = swingRung(rung, { flat, reverse }).level;
    track("reader_expand_all", { node_id: nodeId, action: target, reverse });
    const commit = () => pendulum?.(nodeId, { reverse });
    const btn = ref.current;
    if (btn) feedback.swing(btn, rungAngle(rung.level), rungAngle(target), commit);
    else commit();
  };
  return { ref, swing };
}
