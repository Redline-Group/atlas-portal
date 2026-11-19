import { useCallback, useState } from "react";
import type { MistakeRow } from "@/lib/potentialMistakesIndex";

// The row on show, its position, and a clamped jump to another index.
export function usePagerIndex(rows: readonly MistakeRow[]) {
  const [id, setId] = useState(rows[0]?.id);
  const index = Math.max(0, rows.findIndex((r) => r.id === id));
  const row = rows[index] ?? rows[0];
  const at = index === 0 ? "first" : index === rows.length - 1 ? "last" : "middle";

  const go = useCallback(
    (i: number) => {
      const next = rows[Math.min(rows.length - 1, Math.max(0, i))];
      if (next) setId(next.id);
    },
    [rows],
  );
  return { index, row, at, go };
}
