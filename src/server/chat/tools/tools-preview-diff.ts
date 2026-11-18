// atlas_preview_diff's result: what a PR preview adds, changes and removes,
// relative to the base its redline was computed against (meta.bases.auto).
import type { Indexes } from "../../retrieval/indexes.ts";
import type { AtlasNode } from "../../../types.ts";
import type { ToolResult } from "./tools.ts";
import type { ToolOpen } from "../../preview/tool-access.ts";
import { loadPreviewDocs, previewCite, previewPatchFor, readPreviewDiff, readPreviewOldSide, renderPatch, type PreviewDocs, type PreviewOldSide } from "../../preview/bundle-read.ts";
import { CITATION_NOTE, MAIN_ALSO_CHANGED_NOTE, PREVIEW_SOURCE_CLASS, byDocNo, previewHeader } from "./tools-preview-common.ts";
import { previewCaps } from "../large-read.ts";

export interface PreviewDiffArgs {
  change?: "added" | "changed" | "removed";
  offset: number;
  limit: number;
  patch_lines: number;
}

type Change = "added" | "changed" | "removed";
interface Row {
  change: Change;
  node: Pick<AtlasNode, "id" | "doc_no" | "title" | "type" | "parentId">;
}

function parentOf(node: Row["node"], docs: PreviewDocs, ix: Indexes) {
  if (!node.parentId) return null;
  const p = docs.byId.get(node.parentId) ?? ix.docMap.get(node.parentId);
  return p ? { id: p.id, doc_no: p.doc_no, title: p.title } : { id: node.parentId };
}

function collectRows(ix: Indexes, docs: PreviewDocs, diff: NonNullable<ReturnType<typeof readPreviewDiff>>, old: PreviewOldSide): Row[] {
  const rows: Row[] = [];
  for (const id of diff.added) {
    const n = docs.byId.get(id);
    if (n) rows.push({ change: "added", node: n });
  }
  for (const id of diff.changed) {
    const n = docs.byId.get(id);
    if (n) rows.push({ change: "changed", node: n });
  }
  for (const id of diff.removed ?? []) {
    const n = old.removed.get(id) ?? ix.docMap.get(id);
    rows.push({ change: "removed", node: n ? { ...n, title: n.title ?? "", type: n.type ?? "" } : { id, doc_no: "", title: "", type: "", parentId: null } });
  }
  return rows.sort((x, y) => byDocNo(x.node, y.node));
}

/** `resultChars` is this result's granted budget: page sizes above 100 documents and 40 patch lines need a large one (large-read.ts). */
export function buildPreviewDiff(ix: Indexes, open: Extract<ToolOpen, { status: "ready" }>, args: PreviewDiffArgs, resultChars?: number): ToolResult {
  const caps = previewCaps(resultChars);
  const a = { ...args, limit: Math.min(args.limit, caps.limit), patch_lines: Math.min(args.patch_lines, caps.patchLines) };
  const { sha, meta, id } = open;
  const diff = readPreviewDiff(sha);
  if (!diff) {
    return { source_class: PREVIEW_SOURCE_CLASS, status: "no-diff", preview: previewHeader(meta, id), message: "This preview was built without a diff." };
  }
  const docs = loadPreviewDocs(sha);
  const old = readPreviewOldSide(sha);
  const all = collectRows(ix, docs, diff, old).filter((r) => !a.change || r.change === a.change);
  const page = all.slice(a.offset, a.offset + a.limit);
  const mainAlso = new Set(diff.mainAlsoChanged ?? []);
  const documents = page.map((row) => previewDocument(row, { sha, diff, docs, ix, old, mainAlso, patchLines: a.patch_lines }));
  return previewPage(meta, id, diff, documents, a.offset + page.length, all.length);
}

function previewDocument(
  { change, node }: Row,
  ctx: { sha: string; diff: NonNullable<ReturnType<typeof readPreviewDiff>>; docs: PreviewDocs; ix: Indexes; old: PreviewOldSide; mainAlso: Set<string>; patchLines: number },
) {
  const { sha, diff, docs, ix, old, mainAlso, patchLines } = ctx;
  const patch = patchLines > 0 ? previewPatchFor(node.id, change, diff, docs, old) : [];
  return {
    change,
    id: node.id,
    doc_no: node.doc_no,
    title: node.title,
    type: node.type,
    parent: parentOf(node, docs, ix),
    ...(diff.renumbered[node.id] ? { renumbered: diff.renumbered[node.id] } : {}),
    ...(diff.retitled[node.id] ? { retitled: diff.retitled[node.id] } : {}),
    ...(diff.retyped?.[node.id] ? { retyped: diff.retyped[node.id] } : {}),
    ...(diff.reusedSlot[node.id] ? { reused_slot: diff.reusedSlot[node.id] } : {}),
    ...(diff.identitySwap[node.id] ? { identity_swap: diff.identitySwap[node.id] } : {}),
    ...(mainAlso.has(node.id) ? { main_also_changed: true } : {}),
    ...(patch.length ? { patch: renderPatch(patch, patchLines) } : {}),
    // A removed document opens in the preview too, faint where it stood; /atlas/<uuid> would be main's live copy.
    cite: previewCite(sha, node.id),
  };
}

const ALREADY_ON_MAIN_NOTE =
  "already_on_main counts documents this branch also changes whose change live main already has; they are not listed as changes.";

function previewPage(meta: Extract<ToolOpen, { status: "ready" }>["meta"], id: string, diff: NonNullable<ReturnType<typeof readPreviewDiff>>, documents: unknown[], next: number, total: number): ToolResult {
  return {
    source_class: PREVIEW_SOURCE_CLASS,
    preview: previewHeader(meta, id),
    counts: {
      added: diff.added.length,
      changed: diff.changed.length,
      removed: diff.removed ? diff.removed.length : null,
      renumbered: Object.keys(diff.renumbered).length,
      retitled: Object.keys(diff.retitled).length,
      identity_swaps: Object.keys(diff.identitySwap).length,
      ...(diff.alreadyOnMain?.length ? { already_on_main: diff.alreadyOnMain.length } : {}),
      ...(diff.mainAlsoChanged?.length ? { main_also_changed: diff.mainAlsoChanged.length } : {}),
    },
    documents,
    has_more: next < total,
    ...(next < total ? { next_offset: next } : {}),
    ...(diff.removed ? {} : { removed_note: "Removed documents were not recorded for this build." }),
    ...(diff.alreadyOnMain?.length ? { already_on_main_note: ALREADY_ON_MAIN_NOTE } : {}),
    ...(diff.mainAlsoChanged?.length ? { main_also_changed_note: MAIN_ALSO_CHANGED_NOTE } : {}),
    citation_note: CITATION_NOTE,
  };
}
