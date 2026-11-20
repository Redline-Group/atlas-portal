import { useRef, useState, type PointerEvent } from "react";

type Start = { x: number; y: number; pointer: number };

/** A drag follows the finger only once it has travelled this far sideways. */
const DRAG_PX = 8;

/** The gesture's origin, or null for a mouse button other than the primary one. */
function beginSwipe(e: PointerEvent<HTMLElement>): Start | null {
  if (e.pointerType === "mouse" && e.button !== 0) return null;
  e.currentTarget.setPointerCapture?.(e.pointerId);
  return { x: e.clientX, y: e.clientY, pointer: e.pointerId };
}

/** Sideways travel of `e` from `s`. Null for another pointer, for travel under
 *  `min` px, and for a gesture more vertical than horizontal (a scroll). */
function sidewaysTravel(s: Start | null, e: PointerEvent<HTMLElement>, min: number): number | null {
  if (!s || e.pointerId !== s.pointer) return null;
  const x = e.clientX - s.x;
  const y = e.clientY - s.y;
  return Math.abs(x) < min || Math.abs(x) < Math.abs(y) ? null : x;
}

/** Horizontal swipe on one element. `dx` is the live drag offset (0 at rest);
 *  `onSwipe` receives +1 for a leftward swipe (next) and -1 for a rightward
 *  one (previous) once the pointer lifts at least `swipePx` from its origin. */
export function useSwipe(onSwipe: (step: 1 | -1) => void, swipePx: number) {
  const start = useRef<Start | null>(null);
  const [dx, setDx] = useState(0);
  const reset = () => {
    start.current = null;
    setDx(0);
  };
  const handlers = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      start.current = beginSwipe(e) ?? start.current;
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const x = sidewaysTravel(start.current, e, DRAG_PX);
      if (x !== null) setDx(x);
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const x = sidewaysTravel(start.current, e, swipePx);
      reset();
      if (x !== null) onSwipe(x < 0 ? 1 : -1);
    },
    onPointerCancel: reset,
  };
  return { dx, handlers };
}
