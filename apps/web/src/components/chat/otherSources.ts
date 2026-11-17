// What an answer drew on besides Atlas text, for the "other sources" row: the
// links it carries to chains, outside records and previews (classified by where
// they point, not by anything the model wrote), and the source classes of the
// tools it called (provenance/toolSources.ts, the table the tool results are
// stamped from).
import { classifyLink, previewShaOf, type LinkClass } from "@/lib/provenance/linkClass";
import { SOURCE_CLASS_IDS } from "@/lib/provenance/sources";
import { PREVIEW_TOOL_NAMES, toolSources } from "@/lib/provenance/toolSources";
import type { ToolCallRecord } from "./api";

export interface OtherLink {
  href: string;
  text: string;
  class: LinkClass;
}

// An inline link to a web address or a preview path, with an optional title
// (`[text](url "title")`); atlas citations are the Sources row's, and
// reference-style definitions only ever name atlas documents.
const OTHER_LINK_RE = /\[([^\]\n]+)\]\(((?:https?:\/\/|\/preview\/)[^\s)]+)(?:\s+"[^"\n]*")?\)/gi;

// Fenced blocks and inline code render as code, so a link written inside one is
// not a link and is not a source.
const CODE_RE = /(```|~~~)[\s\S]*?(?:\1|$)|`[^`\n]+`/g;

/**
 * Links in the answer that point at a chain, an outside record or a preview, once
 * each, in order. A link into the preview being viewed opens in place like an
 * Atlas citation (markdown.tsx), so it is not listed.
 */
export function extractOtherLinks(content: string, previewSha?: string): OtherLink[] {
  const seen = new Set<string>();
  const out: OtherLink[] = [];
  for (const m of content.replace(CODE_RE, " ").matchAll(OTHER_LINK_RE)) {
    const [, text, href] = m;
    const cls = classifyLink(href);
    if (!cls || seen.has(href)) continue;
    if (previewSha && previewShaOf(href) === previewSha.toLowerCase()) continue;
    seen.add(href);
    out.push({ href, text, class: cls });
  }
  return out;
}

export interface ToolClassUse {
  class: LinkClass;
  /** The tools whose results carry it, in call order, once each. */
  tools: string[];
}

/** Registry order, with a preview last. */
const CLASS_ORDER: readonly LinkClass[] = [...SOURCE_CLASS_IDS, "preview"];

/** The classes the turn's successful tool calls drew on, in registry order, preview last. */
export function toolClassesUsed(calls: readonly ToolCallRecord[] | undefined): ToolClassUse[] {
  const byClass = new Map<LinkClass, string[]>();
  const note = (cls: LinkClass, name: string) => {
    const names = byClass.get(cls) ?? [];
    if (!names.includes(name)) names.push(name);
    byClass.set(cls, names);
  };
  for (const c of calls ?? []) {
    if (!c.ok) continue;
    if (PREVIEW_TOOL_NAMES.has(c.name)) note("preview", c.name);
    for (const cls of toolSources(c.name) ?? []) note(cls, c.name);
  }
  return CLASS_ORDER.filter((c) => byClass.has(c)).map((c) => ({ class: c, tools: byClass.get(c)! }));
}
