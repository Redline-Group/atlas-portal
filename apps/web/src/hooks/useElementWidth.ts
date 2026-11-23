import { useEffect, useState, type RefObject } from "react";

/** Throttled to one update per frame and `tolerance` px so a drag does not re-render every pixel. */
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
