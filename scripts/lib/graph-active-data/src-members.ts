// --- Table 3: SRC Membership Registry ---
import { slugify } from "../graph-patterns.mjs";
import { extractEthAddresses } from "../table-parser.ts";
import type { Doc } from "../graph-records.ts";
import { addTableEntity, linkAddress, listIn, tableRows, type ActiveDataCtx, type ActiveDataTable } from "./context.ts";

const SRC_UUID = "d9c6ed16-5b0d-4a6f-bb43-387398090afc";
const GOVERNANCE_ADDRESS = { address: "governance", edge: "governance" };

function extractSrcMembers(ctx: ActiveDataCtx, doc: Doc): void {
  for (const row of tableRows(doc)) {
    const name = row["Name or Alias"]?.trim();
    if (!name || ctx.entityMap.has(slugify(name))) continue;
    const ent = addTableEntity(ctx, name, "src_member", 1, SRC_UUID, {
      source: "active_data_table",
      domain_expertise: row["Domain Expertise"]?.trim(),
      start_date: row["Start Date"]?.trim(),
      term_status: row["Term Status"]?.trim(),
      standing: row["Standing"]?.trim(),
    });
    const govRaw = row["Verified Governance Address"]?.trim();
    const govAddrs = govRaw && govRaw !== "N/A" ? extractEthAddresses(govRaw) : [];
    for (const addr of govAddrs) linkAddress(ctx, ent, addr, GOVERNANCE_ADDRESS, name);
    listIn(ctx, ent, SRC_UUID);
    ctx.stats.srcMembers++;
  }
}

export const srcMembersTable: ActiveDataTable = { uuid: SRC_UUID, extract: extractSrcMembers };
