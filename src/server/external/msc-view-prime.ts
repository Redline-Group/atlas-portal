// The shared front half of the per-prime views: resolve the prime, then (for
// single-cycle views) the report, and answer a wrong guess with the roster.

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

// The primes this bundle actually has workbooks for, sorted. Derived, never a
// literal list: primes are added upstream as Soter publishes them, and a stale
// hardcoded roster would send the model chasing a prime with no reports (or
// hide a new one entirely).
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

// Both of these errors carry `available_primes`, derived from the loaded
// bundle rather than hardcoded, so a caller that guessed wrong can retry
// correctly on the very next round instead of concluding the data does not
// exist. Without it, `view=venues` with no prime is a dead end: the model
// has no way to learn WHICH views need a prime or what the valid values are,
// so it reports that no settlement data is available while the workbooks
// sit right there on disk.
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

/** A view of one prime's single cycle: `month`, or that prime's newest. */
export function forReport(build: ReportBuild): MscViewBuild {
  return forPrime((ctx, slug) => {
    const report = pickReport(ctx.bundle, slug, ctx.args.month);
    if (report) return build(report, forumForMonth(ctx.topics, report.month), ctx);
    // The error a WRONG prime actually lands on: settlementPrimeKeys maps most
    // strings to candidate keys, so an invented slug reaches here rather than
    // the "unrecognised prime" branch above. It therefore needs the roster too
    // — otherwise a single bad guess still reads as "there is no settlement
    // data", which is the failure this whole path exists to prevent.
    return wrap([], {
      view: ctx.view,
      error: "no published workbook for this prime/month",
      prime: slug,
      month: ctx.args.month ?? null,
      available_primes: primesInBundle(ctx.bundle),
    });
  });
}
