// The shape every report entry in this directory declares. One entry is the
// whole registration of a report's metadata: everything routes.ts and
// reportCatalog.ts publish about a report is derived from these entries.
import type { SourceClass } from "../provenance/sources";

/** A search pill: its short label and the input's placeholder. */
export interface ScopeConfig {
  label: string;
  placeholder: string;
}

/** Keys of REPORT_GROUP_DEFS in groups.ts. */
export type ReportGroupKey = "roles" | "onchain" | "rules" | "structure" | "health";

export interface ReportMeta {
  /** The /reports/<id> slug, the analytics `report` property and the CSV slug. */
  id: string;
  /** h1, document title, index card title, visit history and chat page context. */
  title: string;
  /** One line on what the report shows: the index card and the chat's page context. */
  description: string;
  group: ReportGroupKey;
  /**
   * What the report draws on besides Atlas text, which is the unmarked default.
   * Shown as chips on the index card and under the report's title, and as the
   * preamble of its CSV. Declare every class the report's rows or prose use.
   */
  sources: readonly SourceClass[];
  /** Search pill on the report page. Absent: the generic "reports" pill. */
  scope?: ScopeConfig;
  /** `atlas_report_*` tool that returns this report in one call; tool-registry.test.ts checks it exists. */
  chatTool?: string;
}
