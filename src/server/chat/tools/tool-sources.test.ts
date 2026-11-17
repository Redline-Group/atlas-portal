// The tool → source-class table (src/lib/provenance/toolSources.ts) and its stamp
// in invokeTool. Run under `bun test`.
import { expect, test } from "bun:test";
import { z } from "zod";
import { ATLAS_TOOLS, invokeTool } from "./tool-registry.ts";
import { ASK_EXTERNAL_MSC, EXTERNAL_TOOLS } from "./external-tools.ts";
import { CHAT_TOOLS } from "./llm-tools.ts";
import { EXPORT_TOOL_NAME } from "./export-tool.ts";
import { PREVIEW_TOOLS } from "./tools-preview.ts";
import { PREVIEW_TOOL_NAMES, toolSources } from "../../../lib/provenance/toolSources.ts";
import { REPORTS } from "../../../lib/reports/registry.ts";
import { normalizeSources, SOURCE_CLASS_IDS } from "../../../lib/provenance/sources.ts";
import type { Indexes } from "../../retrieval/indexes.ts";

test("every chat and MCP tool declares what it draws on, in the shared vocabulary", () => {
  for (const t of [...ATLAS_TOOLS, ...EXTERNAL_TOOLS]) {
    const classes = toolSources(t.name);
    expect(classes, `${t.name} has no entry in toolSources.ts`).toBeDefined();
    for (const c of classes!) expect(SOURCE_CLASS_IDS as readonly string[]).toContain(c);
  }
});

test("every tool chat sends the model, chat-only ones included, is declared", () => {
  const names = CHAT_TOOLS.map((t) => (t.type === "function" ? t.function.name : ""));
  expect(names).toContain(ASK_EXTERNAL_MSC);
  expect(names).toContain(EXPORT_TOOL_NAME);
  for (const name of names) expect(toolSources(name), `${name} has no entry in toolSources.ts`).toBeDefined();
  expect(toolSources(ASK_EXTERNAL_MSC)).toEqual(["external"]);
});

test("a report tool takes its classes from the report's own declaration", () => {
  for (const r of REPORTS) {
    if ("chatTool" in r && r.chatTool) expect(toolSources(r.chatTool)).toEqual(normalizeSources(r.sources));
  }
});

test("the preview tools are exactly the ones whose results are a PR preview", () => {
  for (const t of PREVIEW_TOOLS) expect(PREVIEW_TOOL_NAMES.has(t.name), t.name).toBe(t.name.startsWith("atlas_preview_"));
  expect([...PREVIEW_TOOL_NAMES].sort()).toEqual(["atlas_preview_diff", "atlas_preview_get"]);
});

const stub = (name: string, result: Record<string, unknown>, async = false) => ({
  name,
  shape: {} as z.ZodRawShape,
  handler: () => (async ? Promise.resolve(result) : result),
});

test("invokeTool stamps source_classes last, keeping a leading source_class marker first", async () => {
  const sync = await invokeTool({} as Indexes, stub("redline_onchain", { source_class: "preview", rows: [] }), {});
  expect(Object.keys(sync)).toEqual(["source_class", "rows", "source_classes"]);
  expect(sync.source_classes).toEqual(["onchain"]);
  const later = await invokeTool({} as Indexes, stub("atlas_get", { nodes: [] }, true), {});
  expect(later.source_classes).toEqual([]);
});

test("invokeTool leaves a result alone when the tool is not declared in the table", async () => {
  const unknown = await invokeTool({} as Indexes, stub("not_a_tool", { a: 1 }), {});
  expect("source_classes" in unknown).toBe(false);
});

test("a preview tool's result is not stamped: it already says it is a preview, which is not a source class", async () => {
  const r = await invokeTool({} as Indexes, stub("atlas_preview_get", { source_class: "preview", docs: [] }), {});
  expect("source_classes" in r).toBe(false);
  expect(Object.keys(r)).toEqual(["source_class", "docs"]);
});
