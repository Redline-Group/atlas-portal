import { settleChevron } from "./chevronSettle";

// Instant click feedback for a chevron whose click starts heavy work: advancing
// a large subtree's rung blocks the main thread, so the CSS rotation that keys
// off the new state only lands after the work finishes — the click feels dead.
// A Web Animation on the chevron runs on the compositor, so it turns to its
// target angle and gives a slight pop the moment the click registers, playing
// through the jank. CSS takes the angle back over once the work lands.

// The chevron's CURRENT on-screen angle, read out of the computed transform
// (which reflects the live interpolated value mid-transition, not the endpoint).
// The click animation starts from this rather than from the resting angle: a
// click landing mid hover-drift must carry on from where the lean got to and
// simply speed up, instead of snapping back to rest and re-travelling.
export function currentAngleDeg(el: HTMLElement, fallback: number): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return fallback;
  const [a, b] = m[1].split(",").map(Number);
  return (Math.atan2(b, a) * 180) / Math.PI;
}

// rotate (transform) held via fill:forwards until the CSS angle catches up.
function spinTo(btn: HTMLElement, from: number, to: number): Animation {
  return btn.animate(
    [{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }],
    { duration: 240, easing: "ease-out", fill: "forwards" },
  );
}

// A looping bright scale-up "working…" beat via the independent scale/opacity
// props (they compose with the rotate above instead of fighting it). Runs on
// the compositor, so it keeps pulsing through the main-thread jank.
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

// Defer the heavy commit two frames so the chevron feedback commits to the
// compositor and PAINTS first. Committing at once would let React flush the
// large synchronous re-render in the same task, before the browser ever paints
// the animation — so it would only appear once the work is done.
// Backstop: `after` runs one frame after the commit even if the state did not
// change — a pulse stopped only by a state-keyed effect would otherwise loop
// forever.
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

  /** Turn `btn` from its live angle to `toAngle`, pulse it, and run `commit`
   *  (the heavy state update) once that feedback has painted. `restAngle` is
   *  the angle the chevron rests at now. */
  swing(btn: HTMLElement, restAngle: number, toAngle: number, commit: () => void): void {
    // Sample the live angle BEFORE settling: settleChevron switches the hover
    // rule off, which starts a transition back toward the resting angle, and
    // from then on this would read a value already in retreat.
    const from = currentAngleDeg(btn, restAngle);
    // Hold the new resting angle against a continuing hover before the drift
    // toward the *next* position is allowed to start (see settleChevron).
    this.unsettle?.();
    this.unsettle = settleChevron(btn);
    if (!btn.animate) return commit();
    this.spin(btn, from, toAngle);
    this.pulsing?.cancel();
    this.pulsing = pulse(btn);
    commitAfterPaint(commit, this.stopPulse);
  }

  /** Stop the "working…" pulse: the new state's CSS has landed. */
  stopPulse = (): void => {
    this.pulsing?.cancel();
    this.pulsing = null;
  };

  /** Cancel everything still running; for unmount, so no animation keeps
   *  running on a detached node. */
  dispose = (): void => {
    this.unsettle?.();
    this.spinning?.cancel();
    this.pulsing?.cancel();
  };

  // Carry on from wherever the hover drift had reached — the rotation never
  // stops or reverses on click, it just suddenly gets fast. The fill:forwards
  // hold is released only once the spin has actually FINISHED: by then CSS
  // resolves to the same angle the animation is holding, so the hand-over is
  // seamless. (cancel() rejects `finished`, hence the catch.)
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
