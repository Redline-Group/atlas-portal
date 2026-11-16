// What each chat and MCP tool's result draws on besides Atlas text, declared
// once. Both transports stamp it on the result as `source_classes`
// (tool-registry.ts invokeTool) and the chat client reads it back by tool name
// for the "other sources" row, so the model, an MCP caller and the reader all
// see the same answer from the same table.
//
// An empty list means the result is Atlas text. A report tool takes its list
// from the report's own declaration (src/lib/reports/), never a second copy.
import { REPORTS } from "../reports/registry";
import { normalizeSources, type SourceClass } from "./sources";

const NONE: readonly SourceClass[] = [];

/** Every tool that is not a report. */
const TOOL_SOURCES: Record<string, readonly SourceClass[]> = {
  // Atlas text and its structure.
  atlas_get: NONE,
  atlas_search: NONE,
  atlas_neighbors: NONE,
  atlas_filter: NONE,
  atlas_query: NONE,
  // Our reading of it: vocabularies, entities, graph edges, extracted parameters.
  atlas_describe: ["derived"],
  atlas_traverse: ["derived"],
  atlas_entities: ["derived"],
  atlas_edges: ["derived"],
  atlas_entity: ["derived"],
  atlas_entity_params: ["derived", "onchain"],
  atlas_params: ["derived", "onchain"],
  atlas_get_address: ["derived", "external", "onchain"],
  // The git log, read and classified by the app; PR metadata is GitHub's.
  atlas_history: ["derived"],
  atlas_recent_changes: ["derived"],
  atlas_history_stats: ["derived"],
  atlas_changed_between: ["derived"],
  atlas_first_seen: ["derived"],
  atlas_pr: ["external"],
  atlas_open_prs: ["external"],
  // Unmerged PR content: a preview, which has its own mark (PREVIEW_TOOLS).
  atlas_preview_diff: NONE,
  atlas_preview_get: NONE,
  // Chain reads the atlas worker stored.
  redline_onchain: ["onchain"],
  redline_liquidity_changes: ["onchain", "derived"],
  // Soter Labs workbooks and Sky Forum permalinks.
  external_msc: ["external"],
  // Report tools with no page in the reports registry.
  atlas_report_multisigs: ["derived"],
  atlas_report_primitive_matrix: ["derived"],
};

/** Tools whose results are a PR preview's text, not the live Atlas. */
export const PREVIEW_TOOL_NAMES: ReadonlySet<string> = new Set(["atlas_preview_diff", "atlas_preview_get"]);

const REPORT_TOOL_SOURCES: Record<string, readonly SourceClass[]> = Object.fromEntries(
  REPORTS.flatMap((r) => ("chatTool" in r && r.chatTool ? [[r.chatTool, normalizeSources(r.sources)] as const] : [])),
);

/** The classes a tool's result draws on, in registry order; undefined for a name no table declares. */
export function toolSources(name: string): readonly SourceClass[] | undefined {
  return TOOL_SOURCES[name] ?? REPORT_TOOL_SOURCES[name];
}
