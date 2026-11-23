import { settleChevron } from "./chevronSettle";

// Compositor animations give instant click feedback while the heavy rung update blocks the main thread.

// Read from the computed transform so a click mid hover-drift continues from the live angle.
export function currentAngleDeg(el: HTMLElement, fallback: number): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return fallback;
  const [a, b] = m[1].split(",").map(Number);
  return (Math.atan2(b, a) * 180) / Math.PI;
}

function spinTo(btn: HTMLElement, from: number, to: number): Animation {
  return btn.animate(
    [{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }],
    { duration: 240, easing: "ease-out", fill: "forwards" },
  );
}

// Independent scale/opacity props compose with the rotate instead of fighting it.
function pulse(btn: HTMLElement): Animation {
  return btn.animate(
    [
      { scale: "1", opacity: "1" },
      { scale: "1.4", opacity: "1", offset: 0.5 },
      { scale: "1", opacity: "1" },
    ],
    { duration: 520, easing: "ease-in-out", iterations: Infinity },
  );
}

// Two frames so the feedback paints before React's synchronous re-render blocks the task.
// `after` is a backstop: if the state doesn't change, no effect would stop the pulse.
function commitAfterPaint(commit: () => void, after: () => void): void {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      commit();
      requestAnimationFrame(after);
    }),
  );
}

export class ChevronFeedback {
  private spinning: Animation | null = null;
  private pulsing: Animation | null = null;
  private unsettle: (() => void) | null = null;

  swing(btn: HTMLElement, restAngle: number, toAngle: number, commit: () => void): void {
    // Sample before settling: settleChevron starts a transition back toward rest.
    const from = currentAngleDeg(btn, restAngle);
    this.unsettle?.();
    this.unsettle = settleChevron(btn);
    if (!btn.animate) return commit();
    this.spin(btn, from, toAngle);
    this.pulsing?.cancel();
    this.pulsing = pulse(btn);
    commitAfterPaint(commit, this.stopPulse);
  }

  stopPulse = (): void => {
    this.pulsing?.cancel();
    this.pulsing = null;
  };

  dispose = (): void => {
    this.unsettle?.();
    this.spinning?.cancel();
    this.pulsing?.cancel();
  };

  // Release the fill:forwards hold only once finished, when CSS holds the same angle. cancel() rejects `finished`.
  private spin(btn: HTMLElement, from: number, to: number): void {
    this.spinning?.cancel();
    const anim = spinTo(btn, from, to);
    this.spinning = anim;
    const release = () => {
      if (this.spinning !== anim) return;
      anim.cancel();
      this.spinning = null;
    };
    anim.finished?.then(release).catch(() => {});
  }
}
