// What an answer drew on besides Atlas text, for the "other sources" row: the
// links it carries to chains, outside records and previews (classified by where
// they point, not by anything the model wrote), and the source classes of the
// tools it called (provenance/toolSources.ts, the table the tool results are
// stamped from).
import { classifyLink, type LinkClass } from "@/lib/provenance/linkClass";
import { normalizeSources, type SourceClass } from "@/lib/provenance/sources";
import { PREVIEW_TOOL_NAMES, toolSources } from "@/lib/provenance/toolSources";
import type { ToolCallRecord } from "./api";

export interface OtherLink {
  href: string;
  text: string;
  class: LinkClass;
}

// An inline link to a web address or a preview path; atlas citations are the
// Sources row's, and reference-style definitions only ever name atlas documents.
const OTHER_LINK_RE = /\[([^\]\n]+)\]\(((?:https?:\/\/|\/preview\/)[^\s)]+)\)/gi;

/** Links in the answer that point at a chain, an outside record or a preview, once each, in order. */
export function extractOtherLinks(content: string): OtherLink[] {
  const seen = new Set<string>();
  const out: OtherLink[] = [];
  for (const m of content.matchAll(OTHER_LINK_RE)) {
    const [, text, href] = m;
    const cls = classifyLink(href);
    if (!cls || seen.has(href)) continue;
    seen.add(href);
    out.push({ href, text, class: cls });
  }
  return out;
}

export interface ToolClassUse {
  class: SourceClass | "preview";
  /** The tools whose results carry it, in call order, once each. */
  tools: string[];
}

/** The classes the turn's successful tool calls drew on, in registry order, preview last. */
export function toolClassesUsed(calls: readonly ToolCallRecord[] | undefined): ToolClassUse[] {
  const byClass = new Map<SourceClass | "preview", string[]>();
  const note = (cls: SourceClass | "preview", name: string) => {
    const names = byClass.get(cls) ?? [];
    if (!names.includes(name)) names.push(name);
    byClass.set(cls, names);
  };
  for (const c of calls ?? []) {
    if (!c.ok) continue;
    if (PREVIEW_TOOL_NAMES.has(c.name)) note("preview", c.name);
    for (const cls of toolSources(c.name) ?? []) note(cls, c.name);
  }
  const ordered = normalizeSources([...byClass.keys()].filter((k): k is SourceClass => k !== "preview"));
  return [...ordered, ...(byClass.has("preview") ? (["preview"] as const) : [])].map((cls) => ({ class: cls, tools: byClass.get(cls)! }));
}
