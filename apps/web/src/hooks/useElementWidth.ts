import { useEffect, useState, type RefObject } from "react";

/** Content width of `ref`'s element, `initial` until it is first measured.
 *  Updates at most once per frame, and only when the width moves by more than
 *  `tolerance` px, so a consumer that lays out against it does not re-render on
 *  every pixel of a drag. */
export function useElementWidth(ref: RefObject<HTMLElement | null>, initial: number, tolerance: number): number {
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId = 0;
    const ro = new ResizeObserver(([entry]) => {
      const newWidth = entry.contentRect.width;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setWidth((prev) => (Math.abs(prev - newWidth) > tolerance ? newWidth : prev));
      });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [ref, tolerance]);
  return width;
}
