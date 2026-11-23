// view=compare: every prime that published in one month, ranked by a metric.

import type { SettlementReport } from "../../lib/settlements.ts";
import { byMetricDesc, componentsOf, flowsOf, metricOf } from "./msc-flows.ts";
import {
  forumForMonth,
  forumSources,
  monthOrLatest,
  NOT_NET_REVENUE,
  THREE_WAY_NOTE,
  workbookSource,
  wrap,
  type MscView,
  type MscViewContext,
} from "./msc-view-kit.ts";

function compareRow(r: SettlementReport) {
  return {
    prime: r.prime,
    month: r.month,
    ...flowsOf(r),
    to_sky_components: componentsOf(r.headline.cof, r.headline.sdeRevenue),
  };
}

function buildCompare({ bundle, topics, args, view }: MscViewContext): Record<string, unknown> {
  const month = monthOrLatest(args.month, bundle.reports);
  if (!month) return wrap([], { view, error: "no published workbooks" });
  const metric = metricOf(args);
  const reports = bundle.reports.filter((r) => r.month === month);
  const rows = reports.map(compareRow).sort(byMetricDesc(metric));
  const forum = forumForMonth(topics, month);
  return wrap([...forumSources(forum), ...reports.map(workbookSource)], {
    view,
    month,
    metric,
    rows,
    forum,
    three_way_note: THREE_WAY_NOTE,
    traps: [NOT_NET_REVENUE],
  });
}

export const compareView = { name: "compare", build: buildCompare } as const satisfies MscView;
