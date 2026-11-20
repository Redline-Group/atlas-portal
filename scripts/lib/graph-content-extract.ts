/**
 * Content-extraction helpers for pattern-driven graph extraction: the readers
 * that pull an assignment, a Responsible Party or a name list out of one
 * document's prose.
 */

// Extract "X is Y." or "X is the Y." from content
export function extractAssignment(content: string | null | undefined, prefix: string): string | null {
  const re = new RegExp(prefix + "\\s+is\\s+(?:the\\s+)?([^.\\[]+)\\.", "i");
  const m = content?.match(re);
  return m ? m[1].trim() : null;
}

// Active Data Controllers declare a Responsible Party in one of two forms:
//   "The Responsible Party is <role/name>."
//   "Responsible Party: <role/name>."
// The value may be a role alone ("Operational GovOps"), a named entity alone
// ("Soter Labs"), or role+name ("Operational GovOps Soter Labs"). Role-only
// declarations are resolved via the entity chain at edge-emission time.
const RP_RE_IS = /(?:The\s+)?Responsible Party\s+is\s+(?:the\s+)?([^.[\n]+?)\s*\./i;
const RP_RE_COLON = /Responsible Party:\s*([^\n]+?)\s*(?:\.\s*$|\.(?=\s|\n)|$)/im;
const RP_ROLES = [
  { re: /^Operational GovOps\b\s*/i, key: "operational_govops" },
  { re: /^Core GovOps\b\s*/i, key: "core_govops" },
  { re: /^Operational Facilitator\b\s*/i, key: "operational_facilitator" },
  { re: /^Core Facilitator\b\s*/i, key: "core_facilitator" },
  { re: /^Support Facilitators?\b\s*/i, key: "support_facilitators" },
];

export function extractRP(content: string | null | undefined): string | null {
  if (!content) return null;
  return (content.match(RP_RE_IS)?.[1] ?? content.match(RP_RE_COLON)?.[1] ?? "").trim() || null;
}

// Process-step "Update" docs (type=Core, mostly A.2.2.9.*) carry the same
// "Responsible Party:" bulleted field as ADCs, but a doc may carry SEVERAL
// steps each with their own declaration — unlike extractRP (one declaration
// per ADC), every occurrence must be seen.
const STEP_RP_RE = /Responsible\s+Part(?:y|ies)\s*:\s*([^\n]+)/gi;

export function extractAllRP(content: string | null | undefined): string[] {
  if (!content) return [];
  const out: string[] = [];
  for (const m of content.matchAll(STEP_RP_RE)) {
    const raw = m[1].replace(/\.\s*$/, "").trim();
    if (raw) out.push(raw);
  }
  return out;
}

// Process-step RP declarations often carry an automation annotation —
// "[automated]", "[if not automated]" (negated — NOT automated), inconsistent
// internal spacing, and not necessarily at the end of the string. Detect
// (negation-aware) and strip it in one pass before role/name resolution; the
// caller keeps the raw, unstripped value for meta/provenance.
const AUTOMATION_BRACKET_RE = /\[([^\]]*)\]/g;

export function extractAutomation(raw: string): { clean: string; automated: boolean } {
  let automated = false;
  const clean = raw
    .replace(AUTOMATION_BRACKET_RE, (whole: string, inner: string) => {
      if (!/automated/i.test(inner)) return whole;
      if (!/\bnot\b/i.test(inner)) automated = true;
      return "";
    })
    .replace(/\s+/g, " ")
    .trim();
  return { clean, automated };
}

// A Responsible Party "name" that starts lowercase is a descriptive phrase,
// not a proper-noun entity — e.g. "entity to which the registration pertains"
// (A.2.7.1.1.1.1.4), where the RP varies per registration. Such declarations
// must never mint an entity (1f) or direct-resolve to one (2s); they stay
// unresolved, carrying only their declared text.
export function isDescriptiveRP(name: string): boolean {
  return /^[a-z]/.test(name.trim());
}

export function rpRoleAndName(raw: string): { role: string | null; name: string } {
  // Defensive: the role is occasionally spelled without a space in prose
  // ("CoreGovOps"); normalize before matching so it isn't misread as a name.
  const normalized = raw.replace(/^(Operational|Core)(GovOps)\b/i, "$1 $2");
  for (const r of RP_ROLES) {
    if (r.re.test(normalized)) return { role: r.key, name: normalized.replace(r.re, "").trim() };
  }
  return { role: null, name: normalized };
}

// Parse a comma/and-separated list, stripping leading "the " / "and ".
export function parseNameList(str: string): string[] {
  return str
    .split(/,\s*/)
    .flatMap((p) => p.split(/\s+and\s+/i))
    .map((s) =>
      s
        .trim()
        .replace(/^(?:the|and)\s+/i, "")
        .trim(),
    )
    .filter(Boolean);
}

// Extract list items from Active Data content (for ERG membership, delegate lists)
export function extractListItems(content: string | null | undefined): string[] {
  return (
    (content ?? "")
      .split("\n")
      .filter((l) => /^[-*]\s+/.test(l.trim()))
      .map((l) =>
        l
          .trim()
          .replace(/^[-*]\s+/, "")
          .trim(),
      )
      // Strip "Recipient: X" or bullet labels; keep plain names.
      .map((l) => l.replace(/^Recipient:\s*/i, "").trim())
      .filter(Boolean)
  );
}
