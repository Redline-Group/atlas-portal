import {
  reportsForPrime,
  settlementPrimeKeys,
  type SettlementReport,
  type SettlementsBundle,
} from "../../lib/settlements.ts";
import {
  forumForMonth,
  monthOrLatest,
  wrap,
  type ForumHit,
  type MscViewArgs,
  type MscViewBuild,
  type MscViewContext,
} from "./msc-view-kit.ts";

// Derived, never a literal list: primes appear upstream as Soter publishes them.
export function primesInBundle(bundle: SettlementsBundle): string[] {
  return [...new Set(bundle.reports.map((r) => r.prime))].sort();
}

function resolvePrime(args: MscViewArgs): string {
  return (args.prime ?? args.actor_slug ?? "").trim();
}

function pickReport(bundle: SettlementsBundle, slug: string, month?: string): SettlementReport | null {
  const reports = reportsForPrime(bundle, slug);
  if (reports.length === 0) return null;
  const m = monthOrLatest(month, reports);
  return reports.find((r) => r.month === m) ?? null;
}

// Errors carry `available_primes` so a wrong guess is retried, not read as "no settlement data".
export function forPrime(build: (ctx: MscViewContext, slug: string) => Record<string, unknown>): MscViewBuild {
  return (ctx) => {
    const { view, bundle } = ctx;
    const slug = resolvePrime(ctx.args);
    if (!slug) {
      return wrap([], {
        error: `prime or actor_slug is required for view=${view}`,
        view,
        available_primes: primesInBundle(bundle),
      });
    }
    if (settlementPrimeKeys(slug).length === 0) {
      return wrap([], { error: `unrecognised prime: ${slug}`, view, available_primes: primesInBundle(bundle) });
    }
    return build(ctx, slug);
  };
}

type ReportBuild = (report: SettlementReport, forum: ForumHit | null, ctx: MscViewContext) => Record<string, unknown>;

export function forReport(build: ReportBuild): MscViewBuild {
  return forPrime((ctx, slug) => {
    const report = pickReport(ctx.bundle, slug, ctx.args.month);
    if (report) return build(report, forumForMonth(ctx.topics, report.month), ctx);
    // An invented slug usually lands here, not on "unrecognised prime", so this needs the roster too.
    return wrap([], {
      view: ctx.view,
      error: "no published workbook for this prime/month",
      prime: slug,
      month: ctx.args.month ?? null,
      available_primes: primesInBundle(ctx.bundle),
    });
  });
}
