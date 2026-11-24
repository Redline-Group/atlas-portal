// Where a Prime Agent's Instance Configuration Document is filed, read from the
// titles of the headings above it. Cousin matching (apps/web/src/lib/cousins.ts)
// groups instances by this, and build-graph's cousin-filing tripwire warns when
// an ICD fits neither known shape.
//
//   direct:  <status directory> › ICD                       (most primitives)
//   venue:   <status directory> › <chain> › <venue> › ICD   (Allocation System)
//
// Anything else is "unknown", which cousin matching treats narrowly (same
// instance name only) so a regrouping upstream shrinks the list, never widens it.

export type IcdFiling =
  | { kind: "direct"; completed: boolean }
  | { kind: "venue"; venue: string; completed: boolean }
  | { kind: "unknown"; completed: boolean };

// A status heading leads with the status ("Active Instances", "Completed
// Instances Directory", "In Progress Invocations", "Suspended Instances",
// "Archived Invocations/Instances", "Failed Invocations"); chain headings such as
// "Ethereum Mainnet Instances" do not, so they never pass for one.
const STATUS_DIRECTORY = /^(active|completed|in progress|suspended|archived|failed)\b.*\b(instances|invocations)\b/i;

export const normTitle = (title: string | undefined): string => (title ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export const isStatusDirectory = (title: string | undefined): boolean => STATUS_DIRECTORY.test((title ?? "").trim());

const isCompletedDirectory = (title: string | undefined): boolean => /^completed\b/i.test((title ?? "").trim());

/** `headings` are the ICD's ancestor titles, nearest first. */
export function icdFiling(headings: (string | undefined)[]): IcdFiling {
  const [parent, grandparent, great] = headings;
  if (isStatusDirectory(parent)) return { kind: "direct", completed: isCompletedDirectory(parent) };
  if (parent && grandparent && !isStatusDirectory(grandparent) && isStatusDirectory(great)) {
    return { kind: "venue", venue: normTitle(parent), completed: isCompletedDirectory(great) };
  }
  return { kind: "unknown", completed: headings.slice(0, 4).some(isCompletedDirectory) };
}

/** Ancestor titles of `docNo`, nearest first, resolved through doc_no prefixes. */
export function headingTitles(docNo: string, titleOfDocNo: (docNo: string) => string | undefined, levels = 3): (string | undefined)[] {
  const segs = docNo.split(".");
  const out: (string | undefined)[] = [];
  for (let i = 1; i <= levels && segs.length - i > 0; i++) out.push(titleOfDocNo(segs.slice(0, -i).join(".")));
  return out;
}
