import { useEffect, useRef, useState } from "react";
import type { MouseEvent, RefObject } from "react";
import { ChevronFeedback } from "../../lib/chevronFeedback";
import { track } from "../../lib/analytics";
import { useAtlasActions } from "./AtlasActionsContext";
import { rungAngle, swingRung, type Rung } from "./subtreeState";

/**
 * One click of a row's pendulum chevron: resolves the rung the click lands on,
 * plays the chevron's instant feedback (see chevronFeedback.ts), and commits
 * the swing to the reader. `ref` goes on the chevron button.
 */
export function useChevronSwing(
  nodeId: string,
  rung: Rung,
  flat: boolean,
): { ref: RefObject<HTMLButtonElement | null>; swing: (event?: MouseEvent) => void } {
  const { pendulum } = useAtlasActions();
  const ref = useRef<HTMLButtonElement>(null);
  const [feedback] = useState(() => new ChevronFeedback());
  // Once CSS reflects the new rung (the pendulum landed), stop the "working…"
  // pulse. The rotation is deliberately NOT cancelled here: this effect fires
  // roughly two frames after the click, which would cut the spin short and
  // teleport the chevron. The spin releases itself when it finishes.
  useEffect(() => feedback.stopPulse(), [feedback, rung.level]);
  useEffect(() => feedback.dispose, [feedback]);
  const swing = (event?: MouseEvent) => {
    // Alt reverses the swing: from the middle it goes back the way it came,
    // from either end it crosses straight to the far end. The target is
    // resolved here too, not just in the reader, so the chevron animates to
    // the angle it will actually land on. (Alt, not shift — shift on a row is
    // already split-pane navigation.)
    const reverse = !!event?.altKey;
    const target = swingRung(rung, { flat, reverse }).level;
    track("reader_expand_all", { node_id: nodeId, action: target, reverse });
    // The heavy state update: a rung write across a node's immediate children,
    // plus body-forcing.
    const commit = () => pendulum?.(nodeId, { reverse });
    const btn = ref.current;
    if (btn) feedback.swing(btn, rungAngle(rung.level), rungAngle(target), commit);
    else commit();
  };
  return { ref, swing };
}
