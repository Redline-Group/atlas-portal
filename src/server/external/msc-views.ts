// Curated MSC views for chat/MCP: never a raw workbook dump, never Comparison-block Σ as a headline.

import type { SettlementsBundle } from "../../lib/settlements.ts";
import type { ForumMonthTopic } from "../../lib/forumMonths.ts";
import { aggregateView } from "./msc-view-aggregate.ts";
import { compareView } from "./msc-view-compare.ts";
import { wrap, type MscViewArgs } from "./msc-view-kit.ts";
import { monthView } from "./msc-view-month.ts";
import { seriesView } from "./msc-view-series.ts";
import { termsView } from "./msc-view-terms.ts";
import { venuesView } from "./msc-view-venues.ts";

export { MSC_METRICS, type MscMetric } from "./msc-flows.ts";
export type { MscViewArgs } from "./msc-view-kit.ts";

// Order is what callers see in the tool schema and the unknown-view error.
const VIEWS = [monthView, seriesView, compareView, venuesView, aggregateView, termsView] as const;

export type MscViewName = (typeof VIEWS)[number]["name"];
export const MSC_VIEWS = VIEWS.map((v) => v.name) as [MscViewName, ...MscViewName[]];

export function buildMscView(
  bundle: SettlementsBundle,
  topics: readonly ForumMonthTopic[],
  raw: MscViewArgs,
): Record<string, unknown> {
  const name = raw.view ?? "month";
  const view = VIEWS.find((v) => v.name === name);
  if (!view) return wrap([], { error: `unknown view: ${raw.view}`, views: MSC_VIEWS });
  return view.build({ bundle, topics, args: raw, view: view.name });
}
