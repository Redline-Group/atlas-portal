/**
 * Atlas layout detection + loading — the ONE place that knows the atlas has had
 * more than one on-disk layout. Consumers ask for nodes; they never ask which
 * layout produced them.
 *
 *   monolith      pre-#236      a single composed `Sky Atlas/Sky Atlas.md`
 *   atomized      #236 → #294   ~11k `content/<segs>/document.md` (+ `_index.md`)
 *   consolidated  #294 →        16 composed files directly in `content/`
 *
 * Consolidated files are composed-monolith format (no frontmatter) but their
 * heading levels are FILE-RELATIVE: every bucket opens at `#` — `# A.6.1.1.1 -
 * Spark` — whatever depth its subtree sits at in the whole Atlas (upstream
 * sync/partition.py, "Heading levels"). Concatenating them and parsing as-is
 * therefore made the 11 artifact roots depth-1 orphans (parentId null), which
 * cut 7,917 docs off from A.6 for every ancestor walk on the server — ancestor-
 * scoped chat/MCP search, atlas_get ancestor chains, parent_of edges — while the
 * reader's doc_no-derived tree hid it. `restoreAbsoluteLevels` (a port of
 * upstream's `partition.restore_absolute_levels`) re-derives every level from
 * the doc numbers before parsing, exactly as upstream's own reassembly does.
 * Mirrors sync/atlas_source.py + decompose_multi.reassemble.
 *
 * ⛔ DETECTION IS EXPLICIT AND FAILS LOUD. A walk that finds no documents must
 * never be read as "some other layout" — post-#294 that is also what an empty or
 * truncated checkout produces, and the two are indistinguishable. Guessing here
 * is how a broken checkout becomes a successful build of an empty atlas.
 */

import fs from "node:fs";
import path from "node:path";

import { parse, parseTree } from "./atlas-parser.mjs";
import { bucketFromFilename, bucketOrderKey, compareBuckets } from "./atlas-source-buckets.ts";
import { AtlasSourceError } from "./atlas-source-error.ts";
import { canonicalSortKey, orderDocuments, splitIntoBlocks } from "./atlas-source-order.ts";
import { MAX_HEADING_LEVEL, restoreAbsoluteLevels, structuralDepth } from "./atlas-source-levels.ts";

// Pure ports of upstream's bucket-name, heading-level and document-order rules
// live in sibling modules; re-exported so this stays the one entry point.
export {
  AtlasSourceError,
  canonicalSortKey,
  orderDocuments,
  splitIntoBlocks,
  bucketFromFilename,
  bucketOrderKey,
  compareBuckets,
  MAX_HEADING_LEVEL,
  restoreAbsoluteLevels,
  structuralDepth,
};

export const LAYOUT = {
  MONOLITH: "monolith",
  ATOMIZED: "atomized",
  CONSOLIDATED: "consolidated",
};

// Paths relative to the atlas repo root.
export const MONOLITH_REL = "Sky Atlas/Sky Atlas.md";
export const CONTENT_REL = "content";

// The atomized tree is identified by its root scope document, not by a recursive
// "is there any document.md" scan — that is both slow and true of a partially
// written tree. Mirror of atlas_source.detect_layout.
const ATOM_ROOT_REL = ["A", "0", "document.md"];

/** Bucket files in reassembly order: [{ bucket, file }, …]. Duplicate bucket → throw. */
export function listBuckets(contentRoot) {
  const byBucket = new Map();
  for (const e of fs.readdirSync(contentRoot, { withFileTypes: true })) {
    if (!e.isFile()) continue;
    const bucket = bucketFromFilename(e.name);
    if (!bucket) continue;
    if (byBucket.has(bucket))
      throw new AtlasSourceError(
        `two files claim bucket ${bucket}: ${byBucket.get(bucket)} and ${e.name}`,
      );
    byBucket.set(bucket, e.name);
  }
  return [...byBucket.keys()]
    .sort(compareBuckets)
    .map((bucket) => ({ bucket, file: byBucket.get(bucket) }));
}

/** Rebuild the composed markdown from the split files. Mirror of decompose_multi.reassemble.
 *
 *  Reassembly orders DOCUMENTS, not buckets (upstream partition.order_documents).
 *  Bucket contiguity is not something the Atlas provides: `A.6.1.2 - List Of
 *  Executor Agent Artifacts` lives in the `A.6` file yet is emitted AFTER every
 *  Prime Agent file, so the `A.6` bucket is two runs — and a third `List Of …`
 *  Section would make it three. Concatenating whole files put A.6.1.2 before
 *  Spark and, once levels were restored, made the depth stack hang every Prime
 *  off A.6.1.2 (the last depth-3 heading seen) instead of A.6.1.1. */
export function readConsolidated(contentRoot) {
  const buckets = listBuckets(contentRoot);
  if (!buckets.length)
    throw new AtlasSourceError(`no Atlas bucket files in ${contentRoot}`);
  const linesBySource = new Map();
  for (const b of buckets) linesBySource.set(b.file, fs.readFileSync(path.join(contentRoot, b.file), "utf8").split("\n"));
  return restoreAbsoluteLevels(orderDocuments(linesBySource).join("\n"));
}

/** Layout of an existing content/ directory. Throws on a half-migrated or empty tree. */
function detectContentLayout(contentRoot) {
  let buckets;
  try {
    buckets = listBuckets(contentRoot);
  } catch (e) {
    if (e instanceof AtlasSourceError) throw e;
    throw new AtlasSourceError(`cannot read ${contentRoot}: ${e.message}`);
  }
  const hasAtomRoot = fs.existsSync(path.join(contentRoot, ...ATOM_ROOT_REL));

  if (buckets.length && hasAtomRoot)
    throw new AtlasSourceError(
      `${contentRoot} contains BOTH consolidated bucket files (${buckets.length}) and an ` +
        "atomized content tree. That is a half-finished migration — refusing to guess.",
    );
  if (buckets.length) return LAYOUT.CONSOLIDATED;
  if (hasAtomRoot) return LAYOUT.ATOMIZED;

  throw new AtlasSourceError(
    `${contentRoot} matches neither layout: no \`A.<n> - <name>.md\` bucket files and no ` +
      "A/0/document.md. An empty or truncated checkout reaches here and must NOT be " +
      "treated as a pre-cutover ref.",
  );
}

/** Classify an atlas checkout. Throws on ambiguity, emptiness, or an unreadable tree. */
export function detectLayout(atlasSrcDir) {
  const contentRoot = path.join(atlasSrcDir, CONTENT_REL);
  if (fs.existsSync(contentRoot)) return detectContentLayout(contentRoot);

  if (fs.existsSync(path.join(atlasSrcDir, MONOLITH_REL))) return LAYOUT.MONOLITH;

  throw new AtlasSourceError(
    `${atlasSrcDir} has no content/ and no ${MONOLITH_REL} — the atlas submodule is not ` +
      "populated (run `pnpm pull-atlas`) or the checkout is truncated.",
  );
}

// Floor below which a parse is treated as a broken checkout rather than a small
// atlas. The real atlas is ~11k nodes; nothing legitimate lands under this.
export const MIN_NODES_DEFAULT = 1000;

/** Detect, parse, and refuse to return an implausibly small atlas.
 *  → { layout, nodes, nodeMap } */
export function loadAtlasSource(atlasSrcDir, opts = {}) {
  const layout = detectLayout(atlasSrcDir);
  const contentRoot = path.join(atlasSrcDir, CONTENT_REL);

  const parsed =
    layout === LAYOUT.CONSOLIDATED
      ? parse(readConsolidated(contentRoot))
      : layout === LAYOUT.ATOMIZED
        ? parseTree(contentRoot)
        : parse(fs.readFileSync(path.join(atlasSrcDir, MONOLITH_REL), "utf8"));

  const envFloor = Number.parseInt(process.env.ATLAS_MIN_NODES ?? "", 10);
  const min =
    opts.minNodes ?? (Number.isFinite(envFloor) ? envFloor : MIN_NODES_DEFAULT);
  if (parsed.nodes.length < min)
    throw new AtlasSourceError(
      `parsed only ${parsed.nodes.length} nodes from the ${layout} layout at ${atlasSrcDir} ` +
        `(floor ${min}). Refusing to publish an empty atlas — the checkout is truncated or ` +
        "the layout changed again. Set ATLAS_MIN_NODES to override.",
    );

  return { layout, ...parsed };
}
