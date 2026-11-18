// Pure computation + disk-write for a preview build's diff artifacts:
//   diff.json    what changed (added/changed/removed ids and the flags beside
//                them) — eager, drives the reader's marks, filter and counts;
//   before.json  each changed document as it stood on the diff base — lazy,
//                the old side of the reader's redline (src/lib/previewPatch.ts);
//   removed.json each removed document in full, with where it stood — eager,
//                so the reader can show it in place.
// The new side of every redline is the preview's own docs, which the reader
// already holds, so no line diff is stored at all.
//
// Everything compares the head against `base`, the diff base's merge base, so
// a redline shows only the branch's own edits: what main changed after the
// fork never reads as the branch reverting it. `live` (live main, for a base
// other than live main itself) then drops what main already has: a document is
// a change only if it differs from the merge base AND from live main. An edit
// main already made, a document main already added with the same UUID, and a
// removal main already made are not changes, since merging them changes nothing.
// What that drops is recorded (`alreadyOnMain`), so the reader can say so
// rather than show the document as untouched. A merged PR gets no `live`
// (diff-base-write.ts): everything it changed is on main by then, and its
// preview must keep showing what it did.

import fs from "node:fs";
import path from "node:path";
import { diffSnapshots, docDiffers, type Snapshot, type SnapshotDiff } from "./snapshot.ts";
import { typeChanged } from "../../../scripts/lib/history-events.ts";
import type { BeforeEntry, RemovedDoc } from "../../lib/previewPatch.ts";
import { detectIdentitySwaps, type IdentitySwap, type FormerUuid } from "./identity.ts";
import { diffSides, findRenumberedOnly } from "./renumber-only.ts";
import { removedDocs } from "./removed-docs.ts";

export interface PreviewDiffJson {
  added: string[];
  changed: string[];
  /** In the base, gone from the head. Absent on bundles built before it was recorded. */
  removed?: string[];
  renumbered: Record<string, [string, string]>;
  /** Changed docs whose only change is the doc number (renumber-only.ts).
   *  Absent on bundles built before it was recorded. */
  renumberedOnly?: string[];
  retitled: Record<string, [string, string]>;
  /** Changed docs whose `[Type]` differs: id → [before, after]. Absent on bundles built before it was recorded. */
  retyped?: Record<string, [string, string]>;
  /** Docs the branch changed whose change live main already has, so they are
   *  not listed above. Absent when no live-main rule applied. */
  alreadyOnMain?: string[];
  /** Listed docs that main has also changed since the branch was cut (see
   *  mainAlsoChanged). Absent when no live-main rule applied. */
  mainAlsoChanged?: string[];
  reusedSlot: Record<string, { title: string; movedTo?: string }>;
  identitySwap: Record<string, IdentitySwap>;
  formerUuid: Record<string, FormerUuid>;
}

export interface DiffArtifacts {
  diff: PreviewDiffJson;
  before: Record<string, BeforeEntry>;
  removed: RemovedDoc[];
}

/** Drop what live main already has (see the header), and say what was dropped. */
function ownChanges(d: SnapshotDiff, head: Snapshot, live: Snapshot | undefined): SnapshotDiff & { alreadyOnMain?: string[] } {
  if (!live) return d;
  const differsFromLive = (id: string) => {
    const l = live.get(id);
    const h = head.get(id);
    return !l || !h || docDiffers(l, h);
  };
  const kept = {
    added: d.added.filter(differsFromLive),
    changed: d.changed.filter(differsFromLive),
    removed: d.removed.filter((id) => live.has(id)),
  };
  const all = [...d.added, ...d.changed, ...d.removed];
  const keptIds = new Set([...kept.added, ...kept.changed, ...kept.removed]);
  return { ...kept, alreadyOnMain: all.filter((id) => !keptIds.has(id)) };
}

/** Listed docs main has also moved on since the fork: one the branch changes
 *  or removes that live main has since edited or deleted, or one the branch
 *  adds whose UUID main has since added too. The redline shows only the
 *  branch's own edits, so this is what says the document on main is no longer
 *  the one the redline starts from. */
function mainAlsoChanged(ids: string[], base: Snapshot, live: Snapshot): string[] {
  return ids.filter((id) => {
    const b = base.get(id);
    const l = live.get(id);
    if (!b) return !!l;
    return !l || docDiffers(b, l);
  });
}

function headingChanges(changed: string[], base: Snapshot, head: Snapshot) {
  const renumbered: Record<string, [string, string]> = {};
  const retitled: Record<string, [string, string]> = {};
  const retyped: Record<string, [string, string]> = {};
  for (const id of changed) {
    const b = base.get(id)!;
    const h = head.get(id)!;
    if (b.doc_no !== h.doc_no) renumbered[id] = [b.doc_no, h.doc_no];
    if (b.title !== h.title) retitled[id] = [b.title ?? "", h.title ?? ""];
    if (typeChanged(b, h)) retyped[id] = [b.type!, h.type!];
  }
  return { renumbered, retitled, retyped };
}

/** Each changed document's old heading fields, and its old body when that changed. */
function beforeEntries(changed: string[], base: Snapshot, head: Snapshot): Record<string, BeforeEntry> {
  const out: Record<string, BeforeEntry> = {};
  for (const id of changed) {
    const b = base.get(id)!;
    const body = (b.content ?? "") === (head.get(id)?.content ?? "") ? {} : { content: b.content ?? "" };
    out[id] = { doc_no: b.doc_no, title: b.title, type: b.type, ...body };
  }
  return out;
}

/** Added docs that take a doc number another document held on the base. */
function reusedSlots(added: string[], base: Snapshot, head: Snapshot) {
  const baseDocNos = new Map<string, string>();
  for (const [id, node] of base) baseDocNos.set(node.doc_no, id);
  const reusedSlot: Record<string, { title: string; movedTo?: string }> = {};
  for (const id of added) {
    const occupant = baseDocNos.get(head.get(id)?.doc_no ?? "");
    if (!occupant || occupant === id) continue;
    reusedSlot[id] = { title: base.get(occupant)?.title ?? occupant.slice(0, 8), movedTo: head.get(occupant)?.doc_no };
  }
  return reusedSlot;
}

export function computeDiffArtifacts(base: Snapshot, head: Snapshot, live?: Snapshot): DiffArtifacts {
  const { added, changed, removed, alreadyOnMain } = ownChanges(diffSnapshots(base, head), head, live);
  const { identitySwap, formerUuid } = detectIdentitySwaps({ changed, added, mainById: base, previewById: head });
  const diff: PreviewDiffJson = {
    added,
    changed,
    removed,
    ...headingChanges(changed, base, head),
    renumberedOnly: findRenumberedOnly(changed, diffSides(base, head)),
    reusedSlot: reusedSlots(added, base, head),
    identitySwap,
    formerUuid,
    ...(alreadyOnMain ? { alreadyOnMain } : {}),
    ...(live ? { mainAlsoChanged: mainAlsoChanged([...added, ...changed, ...removed], base, live) } : {}),
  };
  return { diff, before: beforeEntries(changed, base, head), removed: removedDocs(removed, base, head) };
}

/** The diff set's file stems, in the order they are written. */
export const DIFF_FILES = ["diff", "before", "removed"] as const;

/** The three files under one name: "" for the plain auto set, ".sky" / ".repo" for a candidate's. */
export function writeDiffArtifacts(outDir: string, a: DiffArtifacts, suffix = ""): void {
  for (const name of DIFF_FILES) fs.writeFileSync(path.join(outDir, `${name}${suffix}.json`), JSON.stringify(a[name]));
}
