// Response validation for the risk-rules assessment. Hand-rolled (no
// response_format — support is inconsistent across the target models); the
// error string doubles as the corrective retry message.

import type { Rating } from "../../src/lib/oeaAssessment";
import type { Preciseness, RiskRating } from "../../src/lib/riskAssessment";
import { stripFences, resolveUuid } from "./assess-common";

const RATINGS = new Set<Rating>(["weak", "mid", "strong"]);

const CATCH_ALL = new Set([
  "c6c6f595-b29d-48b1-8196-79d15428e78c", // A.1.3.2.4 Reports Of Misalignment
  "560e1024-0897-4f1e-ae71-3ba31e29ed57", // A.1.5.9 Adjudication Process
]);

export type RatingValidation =
  | { ok: true; value: RiskRating }
  // citationOnly carries the otherwise-valid rating so the caller can apply
  // the downgrade-to-weak fallback after retries are exhausted.
  | { ok: false; error: string; citationOnly?: boolean; value?: RiskRating };

const blank = (v: unknown) => typeof v !== "string" || !v.trim();

// Shape errors for each field of the model's reply, in the order they are reported.
function fieldErrors(r: RiskRating): string[] {
  const errors: string[] = [];
  if (blank(r?.description)) errors.push("description must be a non-empty string");
  if (!Number.isInteger(r?.preciseness) || r.preciseness < 1 || r.preciseness > 5)
    errors.push("preciseness must be an integer 1-5");
  if (blank(r?.precisenessReasoning)) errors.push("precisenessReasoning must be a non-empty string");
  if (!Array.isArray(r?.metrics) || r.metrics.some((m) => typeof m !== "string"))
    errors.push("metrics must be an array of strings");
  if (!RATINGS.has(r?.enforcement)) errors.push("enforcement must be weak|mid|strong");
  if (blank(r?.enforcementReasoning)) errors.push("enforcementReasoning must be a non-empty string");
  if (!Array.isArray(r?.mechanismUuids) || r.mechanismUuids.some((u) => typeof u !== "string"))
    errors.push("mechanismUuids must be an array of strings");
  return errors;
}

// Rubric checks on an otherwise well-formed rating: mid/strong needs a real
// cited mechanism, and the catch-all mechanisms alone are always weak.
function citationError(r: RiskRating, resolved: string[]): string | null {
  if (r.enforcement === "weak") return null;
  if (resolved.length === 0)
    return `enforcement rated ${r.enforcement} but no citation resolves to a real atlas doc uuid — cite a mechanism from the rubric's catalog or rate weak with "none found"`;
  if (resolved.every((u) => CATCH_ALL.has(u)))
    return `enforcement rated ${r.enforcement} citing only the misalignment/adjudication catch-all — the catch-all alone is always weak; cite a specific mechanism or rate weak`;
  return null;
}

// The validated rating, with citations resolved to real atlas uuids.
function normalize(r: RiskRating, mechanismUuids: string[]): RiskRating {
  return {
    description: r.description.trim().slice(0, 300),
    preciseness: r.preciseness as Preciseness,
    precisenessReasoning: r.precisenessReasoning.trim(),
    metrics: r.metrics,
    enforcement: r.enforcement,
    mechanismUuids,
    enforcementReasoning: r.enforcementReasoning.trim(),
  };
}

export function validateRating(
  raw: string,
  docIds: Set<string>,
  byPrefix: Map<string, string | null>,
): RatingValidation {
  let r: RiskRating;
  try {
    r = JSON.parse(stripFences(raw)) as RiskRating;
  } catch (err) {
    return { ok: false, error: `not valid JSON: ${(err as Error).message}` };
  }
  const errors = fieldErrors(r);
  if (errors.length) return { ok: false, error: errors.join("; ") };
  const resolved = r.mechanismUuids
    .map((u) => resolveUuid(u, docIds, byPrefix))
    .filter((u): u is string => u !== null);
  const value = normalize(r, resolved);
  const error = citationError(r, resolved);
  return error ? { ok: false, citationOnly: true, value, error } : { ok: true, value };
}

// Conservative fallback when retries fail on the citation rule alone
// (rubric: no citable mechanism is always weak).
export function downgradeEnforcement(r: RiskRating): RiskRating {
  return {
    ...r,
    enforcement: "weak",
    mechanismUuids: [],
    enforcementReasoning: `${r.enforcementReasoning} [downgraded from ${r.enforcement}: no valid mechanism citation]`,
  };
}
