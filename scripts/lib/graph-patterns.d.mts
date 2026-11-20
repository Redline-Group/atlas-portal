// Ambient types so TypeScript consumers (embed-units.ts, scripts_tests)
// can import from graph-patterns.mjs without a rewrite of the JS module.
export function isICD(d: { title: string; content?: string }): boolean;
export function isICDLocation(d: { title: string; content?: string }): boolean;

export const ERG_MEMBERSHIP_UUID: string;
export const ALIGNED_DELEGATES_UUID: string;
export const RANKED_DELEGATE_UUIDS: { get(level: number): string };
export const SPELL_TEAM_UUID: string;
export const ACTIVE_ECOSYSTEM_ACTORS_UUID: string;

export const PRIME_FOUNDATION_RE: RegExp;
export const PROVIDES_SERVICES_RE: RegExp;
export function cleanOrgProseName(raw: string): string;

export function makeEntity(
  slug: string,
  name: string,
  entity_type: string,
  opts?: {
    subtype?: string | null;
    defining_doc_id?: string | null;
    is_active?: number;
    meta?: unknown;
  },
): {
  id: string;
  slug: string;
  name: string;
  entity_type: string;
  subtype: string | null;
  defining_doc_id: string | null;
  is_active: number;
  meta: string | null;
};

export function slugify(name: string): string;
export const UUID_LINK_RE: RegExp;

export function normalizeKey(name: string): string;
export function buildNameIndex<E>(entityMap: Map<string, E>): Map<string, E>;
export function makeWarn(tag: string, stats: { warnings: number }): (msg: string) => void;
export function groupChildrenByParent<D extends { doc_no: string }, K extends string>(
  allDocs: D[],
  kindOf: (d: D) => K | null,
): Map<string, { [P in K]?: D }>;
