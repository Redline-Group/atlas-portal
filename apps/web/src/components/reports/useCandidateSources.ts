// Loads every Edit Candidates source (lib/editCandidates/registry.ts) on its
// own clock. Each source is soft: one that fails is reported by name and the
// rest still render, and a slow one joins the list when it arrives.
import { useEffect, useMemo, useState } from "react";
import type { SourceBatch } from "@/lib/editCandidates/rows";
import type { Mistake } from "@/lib/potentialMistakesIndex";
import type { AtlasNode } from "@/types";
import { CANDIDATE_SOURCES } from "../../lib/editCandidates/registry";

type Settled = { findings: Mistake[] } | "failed";

export interface SourceStatus {
  id: string;
  label: string;
  hint: string;
  state: "pending" | "ready" | "failed";
}

export interface CandidateSources {
  batches: SourceBatch[];
  status: SourceStatus[];
}

function summarize(settled: Record<string, Settled>): CandidateSources {
  const batches = CANDIDATE_SOURCES.flatMap((meta) => {
    const s = settled[meta.id];
    return s && s !== "failed" ? [{ meta, findings: s.findings }] : [];
  });
  const status = CANDIDATE_SOURCES.map(({ id, label, hint }): SourceStatus => {
    const s = settled[id];
    return { id, label, hint, state: !s ? "pending" : s === "failed" ? "failed" : "ready" };
  });
  return { batches, status };
}

export function useCandidateSources(docs: Record<string, AtlasNode> | null, today: string): CandidateSources {
  const [settled, setSettled] = useState<Record<string, Settled>>({});
  useEffect(() => {
    if (!docs) return;
    let live = true;
    const settle = (id: string, s: Settled) => live && setSettled((prev) => ({ ...prev, [id]: s }));
    for (const source of CANDIDATE_SOURCES) {
      source.load({ docs, today }).then(
        (findings) => settle(source.id, { findings }),
        () => settle(source.id, "failed"),
      );
    }
    return () => {
      live = false;
    };
  }, [docs, today]);
  return useMemo(() => summarize(settled), [settled]);
}
