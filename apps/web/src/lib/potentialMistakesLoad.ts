// Browser-side loader for the text sweep's candidates. Split out of
// potentialMistakesIndex.ts so that module stays pure and testable.
//
// The atlas worker's rows (GET /api/edit-candidates) are the live record; the
// committed potential-mistakes.json is its seed and the fallback when the API
// is unreachable or the worker has swept nothing yet. The static file is
// fetched from BASE_URL rather than the atlas-versioned data base: it is
// committed data, not built per atlas sha.
import { fetchJson } from "@/lib/verify";
import type { MistakesFile } from "@/lib/potentialMistakesIndex";

let cache: Promise<MistakesFile> | null = null;

const swept = (f: MistakesFile | null): f is MistakesFile => !!f && Array.isArray(f.findings) && f.documentsScanned > 0;

const fromStatic = (): Promise<MistakesFile> =>
  fetchJson<MistakesFile>(`${import.meta.env.BASE_URL}potential-mistakes.json`, "potential-mistakes.json");

export function loadPotentialMistakes(): Promise<MistakesFile> {
  if (!cache) {
    cache = fetchJson<MistakesFile>("/api/edit-candidates", "edit-candidates")
      .catch(() => null)
      .then((live) => (swept(live) ? live : fromStatic()))
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}

/** Test-only: drop the memoised fetch so the next load hits the network again. */
export function resetPotentialMistakesCache(): void {
  cache = null;
}
