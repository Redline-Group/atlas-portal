import { reportsForPrime } from "../../lib/settlements.ts";
import { flowsOf } from "./msc-flows.ts";
import { THREE_WAY_NOTE, workbookSource, wrap, type MscView, type MscViewContext } from "./msc-view-kit.ts";
import { forPrime } from "./msc-view-prime.ts";

function buildSeries({ bundle, args, view }: MscViewContext, slug: string): Record<string, unknown> {
  let reports = reportsForPrime(bundle, slug);
  if (args.from) reports = reports.filter((r) => r.month >= args.from!);
  if (args.to) reports = reports.filter((r) => r.month <= args.to!);
  const lastN = Math.min(24, Math.max(1, args.last_n ?? 12));
  reports = reports.slice(-lastN);
  return wrap(reports.slice(-3).map(workbookSource), {
    view,
    prime: reports[0]?.prime ?? slug,
    points: reports.map((r) => ({ month: r.month, ...flowsOf(r), cof: r.headline.cof })),
    three_way_note: THREE_WAY_NOTE,
  });
}

export const seriesView = { name: "series", build: forPrime(buildSeries) } as const satisfies MscView;
