// Console tables for the edit-candidates eval (./eval-edit-candidates.ts).
import type { GoldCase } from "./eval-edit-candidates-gold.ts";
import type { ExplainRun } from "./eval-edit-candidates-explain.ts";
import { SCREEN_SCORES, type ScreenAnswer } from "./eval-edit-candidates-screen.ts";
import { auc, operatingPoint, scoreExplain, type Scored } from "./eval-edit-candidates-score.ts";

export type ScreenRows = Record<string, Array<ScreenAnswer | null>>;
export type ExplainRows = Record<string, Array<ExplainRun | null>>;
export type Prices = Record<string, { prompt: number; completion: number }>;

const TARGETS = [0.8, 0.9, 0.95];
const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
const usd = (n: number): string => `$${n.toFixed(n < 1 ? 4 : 2)}`;
const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[xs.length >> 1] ?? 0;

function scored(cases: readonly GoldCase[], answers: Array<ScreenAnswer | null>, score: string): Scored[] {
  return cases.flatMap((c, i) => {
    const a = answers[i];
    const s = a ? SCREEN_SCORES[score](a) : null;
    return s === null ? [] : [{ label: c.label, score: s }];
  });
}

export function printScreen(cases: readonly GoldCase[], rows: ScreenRows): void {
  console.log("\n== Stage 1 screen: clean documents sent on (and vetoed ones) at each defect-document recall ==");
  for (const [model, answers] of Object.entries(rows)) {
    const ok = answers.filter((a): a is ScreenAnswer => a !== null);
    const cost = ok.reduce((s, a) => s + (a.cost ?? 0), 0);
    const per1k = usd((cost / Math.max(ok.length, 1)) * 1000);
    console.log(`\n${model}: ${ok.length}/${answers.length} answered · ${per1k} per 1k docs · p50 ${median(ok.map((a) => a.latencyMs))} ms`);
    for (const score of Object.keys(SCREEN_SCORES)) {
      const s = scored(cases, answers, score);
      const cells = TARGETS.map((t) => operatingPoint(s, t)).map(
        (p) => `@${pct(p.recall)} clean ${pct(p.cleanFlagged)} vetoed ${pct(p.vetoedFlagged)} (t=${p.threshold.toFixed(2)})`,
      );
      console.log(`  ${score.padEnd(22)} auc ${auc(s).toFixed(3)} · ${cells.join(" · ")}`);
    }
  }
}

/** Documents a screen sends on at the threshold keeping `target` of defect documents. */
export function sentBy(cases: readonly GoldCase[], answers: Array<ScreenAnswer | null>, score: string, target: number): Set<string> {
  const { threshold } = operatingPoint(scored(cases, answers, score), target);
  const at = (i: number): number => (answers[i] ? (SCREEN_SCORES[score](answers[i]!) ?? 0) : 0);
  return new Set(cases.filter((_, i) => at(i) >= threshold).map((c) => c.uuid));
}

function explainLine(cases: readonly GoldCase[], runs: Array<ExplainRun | null>, sent?: ReadonlySet<string>): string {
  const s = scoreExplain(cases, runs.flatMap((r) => r?.findings ?? []), sent);
  const byPass = Object.entries(s.goldFoundByPass).map(([p, [a, b]]) => `${p} ${a}/${b}`).join(", ");
  const gold = `gold ${s.goldFound}/${s.goldTotal} (${pct(s.goldFound / Math.max(s.goldTotal, 1))}; ${byPass})`;
  return `${gold} · vetoes raised ${s.vetoesRaised}/${s.vetoesTotal} · clean flagged ${s.cleanFlagged}/${s.cleanTotal} · bad quotes ${s.invalid}/${s.valid + s.invalid}`;
}

export function printExplain(cases: readonly GoldCase[], rows: ExplainRows, prices: Prices): void {
  console.log(`\n== Stage 2 explain, every case read (${cases.length} documents) ==`);
  for (const [model, runs] of Object.entries(rows)) {
    const ok = runs.filter((r): r is ExplainRun => r !== null);
    const input = ok.reduce((t, r) => t + r.usage.input, 0);
    const output = ok.reduce((t, r) => t + r.usage.output, 0);
    const p = prices[model];
    const cost = p ? input * p.prompt + output * p.completion : NaN;
    const speed = (median(ok.map((r) => r.latencyMs)) / 1000).toFixed(1);
    console.log(`\n${model}: ${ok.length}/${runs.length} batches · ${input} in / ${output} out · ${usd(cost)} (${usd((cost / cases.length) * 1000)} per 1k docs) · p50 ${speed} s per batch`);
    console.log(`  ${explainLine(cases, runs)}`);
  }
}

export function printPipeline(cases: readonly GoldCase[], screens: ScreenRows, explains: ExplainRows, score: string, target: number): void {
  console.log(`\n== Both stages: screen on "${score}" at ${pct(target)} defect-document recall, then explain only what it sent on ==`);
  for (const [sm, answers] of Object.entries(screens)) {
    const sent = sentBy(cases, answers, score, target);
    for (const [em, runs] of Object.entries(explains)) {
      console.log(`${sm} → ${em}\n  sent ${sent.size}/${cases.length} · ${explainLine(cases, runs, sent)}`);
    }
  }
}
