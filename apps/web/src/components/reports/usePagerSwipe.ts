import { useRef, useState, type PointerEvent } from "react";

const SWIPE_PX = 48;

// Horizontal swipe tracking: left reports +1 (next), right reports -1 (previous).
// `dx` is the live drag offset, 0 when idle.
type Start = { x: number; y: number; pointer: number };

// True when a drag of (x, y) is at least `min` px and mostly horizontal.
const horizontal = (x: number, y: number, min: number) => Math.abs(x) >= min && Math.abs(x) >= Math.abs(y);

export function usePagerSwipe(onSwipe: (step: 1 | -1) => void) {
  const start = useRef<Start | null>(null);
  const [dx, setDx] = useState(0);
  const live = (e: PointerEvent) => (start.current?.pointer === e.pointerId ? start.current : null);

  const onPointerCancel = () => {
    start.current = null;
    setDx(0);
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, pointer: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = live(e);
    if (s && horizontal(e.clientX - s.x, e.clientY - s.y, 8)) setDx(e.clientX - s.x);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = live(e);
    onPointerCancel();
    if (s && horizontal(e.clientX - s.x, e.clientY - s.y, SWIPE_PX)) onSwipe(e.clientX < s.x ? 1 : -1);
  };
  return { dx, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } };
}
