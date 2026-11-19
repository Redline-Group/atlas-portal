// Pure scoring for the edit-candidates eval: the screen's ranking quality and
// what it costs in documents sent on, and how many gold findings an explaining
// model wrote down again.
import type { GoldCase, GoldFinding, GoldLabel } from "./eval-edit-candidates-gold.ts";

export interface Scored {
  label: GoldLabel;
  score: number;
}

/** P(a defect document outscores a clean one); ties count half. */
export function auc(rows: readonly Scored[]): number {
  const pos = rows.filter((r) => r.label === "defect").map((r) => r.score);
  const neg = rows.filter((r) => r.label === "clean").map((r) => r.score);
  let wins = 0;
  for (const p of pos) for (const n of neg) wins += p > n ? 1 : p === n ? 0.5 : 0;
  return wins / Math.max(pos.length * neg.length, 1);
}

export interface Operating {
  recall: number;
  threshold: number;
  /** Share of clean documents at or above the threshold: what the explaining model reads for nothing. */
  cleanFlagged: number;
  vetoedFlagged: number;
}

/** The highest threshold that still keeps `target` of the defect documents. */
export function operatingPoint(rows: readonly Scored[], target: number): Operating {
  const pos = rows.filter((r) => r.label === "defect").map((r) => r.score).sort((a, b) => b - a);
  const threshold = pos[Math.min(pos.length - 1, Math.ceil(target * pos.length) - 1)] ?? 0;
  const share = (label: GoldLabel) => {
    const of = rows.filter((r) => r.label === label);
    return of.filter((r) => r.score >= threshold).length / Math.max(of.length, 1);
  };
  return { recall: share("defect"), threshold, cleanFlagged: share("clean"), vetoedFlagged: share("vetoed") };
}

const WINDOW = 20;
const squash = (s: string): string => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();

/** Two quotes point at the same passage: one holds the other, or they share a 20-character run. */
export function sameQuote(a: string, b: string): boolean {
  const [short, long] = [squash(a), squash(b)].sort((x, y) => x.length - y.length);
  if (!short) return false;
  if (long.includes(short)) return true;
  for (let i = 0; i + WINDOW <= short.length; i += 4) if (long.includes(short.slice(i, i + WINDOW))) return true;
  return false;
}

export interface ModelFinding {
  uuid: string;
  quote: string;
}
export interface ExplainScore {
  /** Model findings whose quote is in their document, and those dropped because it is not. */
  valid: number;
  invalid: number;
  goldFound: number;
  goldTotal: number;
  goldFoundByPass: Record<string, [number, number]>;
  vetoesRaised: number;
  vetoesTotal: number;
  /** Clean documents with at least one valid finding: unreviewed, so an upper bound on false alarms. */
  cleanFlagged: number;
  cleanTotal: number;
}

const inDoc = (c: GoldCase, quote: string): boolean => squash(`${c.title}\n${c.text}`).includes(squash(quote));

/** Scores one model's findings over `cases`; `sent` limits the cases to those a screen passed on. */
export function scoreExplain(cases: readonly GoldCase[], found: readonly ModelFinding[], sent?: ReadonlySet<string>): ExplainScore {
  const byUuid = new Map(cases.map((c) => [c.uuid, c]));
  const live = found.filter((f) => !sent || sent.has(f.uuid));
  const valid = live.filter((f) => byUuid.has(f.uuid) && inDoc(byUuid.get(f.uuid)!, f.quote));
  const hit = (uuid: string, g: GoldFinding) => valid.some((f) => f.uuid === uuid && sameQuote(f.quote, g.quote));
  const s: ExplainScore = {
    valid: valid.length, invalid: live.length - valid.length, goldFound: 0, goldTotal: 0, goldFoundByPass: {},
    vetoesRaised: 0, vetoesTotal: 0, cleanFlagged: 0, cleanTotal: 0,
  };
  for (const c of cases) {
    for (const g of c.findings) {
      const pair = (s.goldFoundByPass[g.pass] ??= [0, 0]);
      const ok = hit(c.uuid, g);
      s.goldTotal++; pair[1]++;
      if (ok) { s.goldFound++; pair[0]++; }
    }
    s.vetoesTotal += c.vetoes.length;
    s.vetoesRaised += c.vetoes.filter((g) => hit(c.uuid, g)).length;
    if (c.label !== "clean") continue;
    s.cleanTotal++;
    if (valid.some((f) => f.uuid === c.uuid)) s.cleanFlagged++;
  }
  return s;
}
