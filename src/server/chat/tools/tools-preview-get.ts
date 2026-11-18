// atlas_preview_get's result: a PR preview's full text of named documents, and
// of documents it removes, next to each changed document's text on the diff
// base (where the branch left it, the old side of its patch), for reading a
// proposal in full or checking it against how similar live documents are written.
import type { Indexes } from "../../retrieval/indexes.ts";
import type { AtlasNode } from "../../../types.ts";
import type { ToolResult } from "./tools.ts";
import type { ToolOpen } from "../../preview/tool-access.ts";
import { baseDocOf, loadPreviewDocs, previewCite, previewPatchFor, readPreviewDiff, readPreviewOldSide, removedNode, renderPatch, type PreviewDocs, type PreviewOldSide } from "../../preview/bundle-read.ts";
import { CITATION_NOTE, PREVIEW_SOURCE_CLASS, previewHeader } from "./tools-preview-common.ts";
import { previewCaps } from "../large-read.ts";

export interface PreviewGetArgs {
  ids: string[];
  include_base: boolean;
  include_children: boolean;
}

const PATCH_LINES = 60;

/** A document the preview has, or one it removes (which the reader shows in place). */
function nodeOf(c: GetCtx, id: string): AtlasNode | undefined {
  const removed = c.old.removed.get(id);
  return c.docs.byId.get(id) ?? (removed ? removedNode(removed) : undefined);
}

function ancestors(c: GetCtx, node: AtlasNode) {
  const out: { doc_no: string; title: string }[] = [];
  for (let p = node.parentId ? nodeOf(c, node.parentId) : undefined; p && out.length < 12; p = p.parentId ? nodeOf(c, p.parentId) : undefined) {
    out.unshift({ doc_no: p.doc_no, title: p.title });
  }
  return out;
}

/** The text the patch's old side starts from: the diff base where the branch left it. */
function baseText(c: GetCtx, id: string) {
  const b = baseDocOf(id, c.docs, c.old);
  return b ? { source: c.baseLabel, doc_no: b.doc_no, title: b.title ?? "", content: b.content ?? "" } : null;
}

/** A uuid the preview has or removes, else a doc_no as the preview numbers it. */
function resolveDoc(c: GetCtx, ref: string): AtlasNode | undefined {
  return nodeOf(c, ref.toLowerCase()) ?? c.docs.byDocNo.get(ref);
}

/** What `base` is labelled with: the merge base the redline compares against, or live main when none resolved. */
function baseLabelOf(meta: Extract<ToolOpen, { status: "ready" }>["meta"], ix: Indexes): string {
  const auto = meta.bases?.auto;
  const cand = auto === "sky" || auto === "repo" ? meta.bases?.[auto] : undefined;
  if (cand) return `${cand.repo}:${cand.ref} where this branch left it (${cand.mergeBase.slice(0, 7)}${cand.mergeBaseDate ? `, ${cand.mergeBaseDate.slice(0, 10)}` : ""})`;
  return `live atlas ${(ix.meta.atlasCommit ?? "").slice(0, 7)}`.trim();
}

// Everything one call reads from the bundle once, shared by every document it returns.
interface GetCtx {
  ix: Indexes;
  sha: string;
  args: PreviewGetArgs;
  docs: PreviewDocs;
  diff: ReturnType<typeof readPreviewDiff>;
  added: Set<string>;
  changed: Set<string>;
  old: PreviewOldSide;
  baseLabel: string;
  mainAlsoChanged: Set<string>;
}

function getCtx(ix: Indexes, open: Extract<ToolOpen, { status: "ready" }>, args: PreviewGetArgs): GetCtx {
  const diff = readPreviewDiff(open.sha);
  const added = new Set(diff?.added ?? []);
  const changed = new Set(diff?.changed ?? []);
  const mainAlsoChanged = new Set(diff?.mainAlsoChanged ?? []);
  const base = { baseLabel: baseLabelOf(open.meta, ix), mainAlsoChanged };
  return { ix, sha: open.sha, args, docs: loadPreviewDocs(open.sha), diff, added, changed, old: readPreviewOldSide(open.sha), ...base };
}

const summary = (n: AtlasNode) => ({ id: n.id, doc_no: n.doc_no, title: n.title, type: n.type });

const statusOf = (c: GetCtx, id: string) =>
  c.added.has(id) ? "added" : c.changed.has(id) ? "changed" : c.old.removed.has(id) ? "removed" : "unchanged";

const MAIN_ALSO_CHANGED_NOTE =
  "Main has changed this document since the branch was cut, so its live text differs from `base`. The patch shows only this PR's own edits; read main's current text with atlas_get.";

function documentOut(c: GetCtx, node: AtlasNode) {
  const status = statusOf(c, node.id);
  const parent = node.parentId ? nodeOf(c, node.parentId) : undefined;
  const patch = c.diff && status !== "unchanged" ? previewPatchFor(node.id, status, c.diff, c.docs, c.old) : [];
  return {
    ...summary(node),
    status,
    parent: parent ? summary(parent) : null,
    ancestors: ancestors(c, node),
    content: node.content,
    ...(c.args.include_base && status === "changed" ? { base: baseText(c, node.id) } : {}),
    ...(c.mainAlsoChanged.has(node.id) ? { main_also_changed: MAIN_ALSO_CHANGED_NOTE } : {}),
    ...(patch.length ? { patch: renderPatch(patch, PATCH_LINES) } : {}),
    ...(c.args.include_children ? { children: (c.docs.children.get(node.id) ?? []).map(summary) } : {}),
    cite: previewCite(c.sha, node.id),
  };
}

const STYLE_HINT =
  "To check conformance, compare against live documents of the same type under the same parent: atlas_filter " +
  "({ type, ancestor_id: <parent's live id or doc_no> }) or atlas_search, then atlas_get on two or three of them.";

/** `resultChars` is this result's granted budget: only a large one may ask for more than 5 ids (large-read.ts). */
export function buildPreviewGet(ix: Indexes, open: Extract<ToolOpen, { status: "ready" }>, a: PreviewGetArgs, resultChars?: number): ToolResult {
  const c = getCtx(ix, open, a);
  const max = previewCaps(resultChars).ids;
  const refs = a.ids.slice(0, max).map((ref) => ({ ref, node: resolveDoc(c, ref) }));
  const missing = refs.filter((r) => !r.node).map((r) => r.ref);
  return {
    source_class: PREVIEW_SOURCE_CLASS,
    preview: previewHeader(open.meta, open.id),
    documents: refs.flatMap((r) => (r.node ? [documentOut(c, r.node)] : [])),
    ...(missing.length ? { not_found: missing } : {}),
    ...(a.ids.length > max ? { ids_note: `Only the first ${max} ids were read. Ask again for the rest.` } : {}),
    style_hint: STYLE_HINT,
    citation_note: CITATION_NOTE,
  };
}
