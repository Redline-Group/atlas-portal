import type { SettlementReport, SettlementsBundle } from "../../lib/settlements.ts";
import type { ForumMonthTopic } from "../../lib/forumMonths.ts";
import { forumTopicUrlForMonth } from "../../lib/forumMonths.ts";
import { mscEnvelope, workbookUrl, type MscEnvelope, type MscSourceRow } from "./envelope.ts";

export interface MscViewArgs {
  view?: string;
  prime?: string;
  actor_slug?: string;
  month?: string;
  metric?: string;
  last_n?: number;
  from?: string;
  to?: string;
}

export interface MscViewContext {
  bundle: SettlementsBundle;
  topics: readonly ForumMonthTopic[];
  args: MscViewArgs;
  view: string;
}

export type MscViewBuild = (ctx: MscViewContext) => Record<string, unknown>;

export interface MscView {
  name: string;
  build: MscViewBuild;
}

export const THREE_WAY_NOTE =
  "The three genuine flows are To Sky, supply kept (prime agent revenue − cost of funds), and demand-side. Cost of funds is a component of To Sky, not a fourth destination.";

// Travels with every money-bearing view, not just terms: a roll-up reads exactly like "what did Sky earn".
export const NOT_NET_REVENUE =
  "to_sky is the interest a Prime owes Sky plus Sky Direct Exposure, as calculated by Soter. It is NOT the Sky Protocol's Net Revenue: the Atlas defines that as Income minus Expenses recognised on a cash basis at the Sky Surplus Buffer (A.2.3.1.2.1.1, A.2.3.1.2.1). These amounts sit inside one Income component (Stability Fees From Base Rate, A.2.3.1.2.1.2.1); Expenses such as the Sky Savings Rate paid to sUSDS holders (A.2.3.1.2.1.3.1) are not deducted here, and the allocation waterfall (A.2.3.1.2) has not been applied. Never present these figures, or a sum of them, as Sky's net revenue.";

export function wrap(sources: MscSourceRow[], body: Record<string, unknown>): MscEnvelope & Record<string, unknown> {
  return { ...mscEnvelope(sources), ...body };
}

export interface ForumHit {
  title: string;
  url: string;
  posted_at: string | null;
}

export function forumForMonth(topics: readonly ForumMonthTopic[], month: string): ForumHit | null {
  const url = forumTopicUrlForMonth(topics, month);
  if (!url) return null;
  const hit = topics.find((t) => t.url === url);
  return { title: hit?.title ?? "", url, posted_at: hit?.postedAt ?? null };
}

export function forumSources(forum: ForumHit | null): MscSourceRow[] {
  return forum ? [{ kind: "sky_forum", title: forum.title, url: forum.url, posted_at: forum.posted_at }] : [];
}

export function workbookSource(report: SettlementReport): MscSourceRow {
  return { kind: "soter_workbook", prime: report.prime, month: report.month, url: workbookUrl(report.prime, report.month) };
}

function latestMonth(reports: readonly SettlementReport[]): string | null {
  if (reports.length === 0) return null;
  return [...reports].sort((a, b) => a.month.localeCompare(b.month)).at(-1)!.month;
}

export function monthOrLatest(month: string | undefined, reports: readonly SettlementReport[]): string | null {
  return month && month !== "latest" ? month : latestMonth(reports);
}
