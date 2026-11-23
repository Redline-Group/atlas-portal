// NFAT Facilities: the deals a Halo Agent runs for subscribing Prime Agents.
// A halo lists them under a child titled "NFAT Facilities", grouped by status
// ("Active NFAT Facilities") and then by network. A facility is the document
// holding "Parameters" (the deal terms) and "Technical Architecture", whose
// two parts are the NFAT Facility Contract and the Diamond PAU the halo
// operates it through. The Allocation System Primitive's "List Of Approved
// NFAT Facilities" Active Data names each one's document, which is the check
// that none went unread.
import { extractParamsFromRoot } from "./graph-instances.mjs";
import { UUID_LINK_RE } from "./graph-patterns.mjs";
import { parseMarkdownTable } from "./table-parser.mjs";
import type { NfatFacility, NfatFacilityStatus, NfatParams } from "../../src/lib/nfatFacility.ts";

interface Doc {
  id: string;
  doc_no: string;
  title: string;
  type?: string;
  content?: string;
}
type Children = Map<string, Doc[]>;

const SECTION_RE = /\bNFAT Facilities$/i;
const STATUS_RE = /^(Active|Completed) NFAT Facilities$/i;
const TERMS_RE = /^Parameters$/i;
const ARCHITECTURE_RE = /^Technical Architecture$/i;
const CONTRACT_RE = /\bNFAT Facility Contract$/i;
const PAU_RE = /\bDiamond PAU$/i;
const MULTISIG_RE = /\bMultisig$/i;
export const APPROVED_LIST_RE = /^List Of Approved NFAT Facilities$/i;

/** The children index without the given documents, so a param walk stops short of them. */
export function withoutDocs(children: Children, drop: Doc[]): Children {
  const gone = new Set(drop.map((d) => d.id));
  const get = (docNo: string) => children.get(docNo)?.filter((k) => !gone.has(k.id));
  return { get } as Children; // the param walk only reads `get`
}

/** A halo's "NFAT Facilities" child, which its own contract params leave out. */
export const nfatSection = (halo: Doc, children: Children): Doc | undefined => children.get(halo.doc_no)?.find((k) => SECTION_RE.test(k.title));

const params = (root: Doc | undefined, children: Children) => extractParamsFromRoot(root, children) as NfatParams;

function facility(doc: Doc, status: NfatFacilityStatus | null, network: string | null, children: Children): NfatFacility {
  const kids = children.get(doc.doc_no) ?? [];
  const parts = children.get(kids.find((k) => ARCHITECTURE_RE.test(k.title))?.doc_no ?? "") ?? [];
  const pau = parts.find((k) => PAU_RE.test(k.title));
  const multisigs = (children.get(pau?.doc_no ?? "") ?? []).filter((k) => MULTISIG_RE.test(k.title));
  if (!pau || !parts.some((k) => CONTRACT_RE.test(k.title)))
    console.warn(`  [drift] NFAT Facility "${doc.title}" (${doc.doc_no}) states no ${pau ? "NFAT Facility Contract" : "Diamond PAU"}; its card will lack it`);
  return {
    id: doc.id, name: doc.title, doc_no: doc.doc_no, status, network, approved: false,
    terms: params(kids.find((k) => TERMS_RE.test(k.title)), children),
    contract: params(parts.find((k) => CONTRACT_RE.test(k.title)), children),
    pau: params(pau, withoutDocs(children, multisigs)),
    multisigs: multisigs.map((m) => ({ id: m.id, name: m.title })),
  };
}

const isFacility = (doc: Doc, children: Children) => (children.get(doc.doc_no) ?? []).some((k) => TERMS_RE.test(k.title) || ARCHITECTURE_RE.test(k.title));

/** Every facility below a status section: directly, or under the network sections that group them. */
function facilitiesUnder(doc: Doc, status: NfatFacilityStatus | null, network: string | null, children: Children): NfatFacility[] {
  return (children.get(doc.doc_no) ?? []).flatMap((k) => (isFacility(k, children) ? [facility(k, status, network, children)] : facilitiesUnder(k, status, k.title, children)));
}

/** The facility documents the Approved NFAT Facilities Active Data links, by UUID. */
export function approvedNfatFacilities(allDocs: Doc[]): Set<string> {
  const lists = allDocs.filter((d) => d.type === "Active Data" && APPROVED_LIST_RE.test(d.title));
  const cells = lists.flatMap((d) => parseMarkdownTable(d.content ?? "").flatMap((row: Record<string, string>) => Object.values(row)));
  return new Set(cells.flatMap((c) => [...(c ?? "").matchAll(UUID_LINK_RE)].map((m) => m[2])));
}

/** The NFAT Facilities a halo lists, in document order, each marked when the approved list names it. */
export function nfatFacilities(halo: Doc, children: Children, approved: Set<string> = new Set()): NfatFacility[] {
  const section = nfatSection(halo, children);
  if (!section) return [];
  const groups = children.get(section.doc_no) ?? [];
  const found = groups.flatMap((g) => facilitiesUnder(g, (g.title.match(STATUS_RE)?.[1] as NfatFacilityStatus | undefined) ?? null, null, children));
  if (groups.some((g) => (children.get(g.doc_no) ?? []).length > 0) && found.length === 0)
    console.warn(`  [drift] tripwire: ${halo.title}'s NFAT Facilities section (${section.doc_no}) has documents but no facility was read (a facility holds "Parameters" or "Technical Architecture")`);
  return found.map((f) => ({ ...f, approved: approved.has(f.id) }));
}
