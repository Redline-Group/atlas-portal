// The source class of a link in a chat answer, from where it points. The mark
// is picked here, not by the model: a link renderer that asks the model to
// label its own sources depends on the model writing the right sentence.
//
// Atlas citations (`/atlas/<uuid>`) and every host this does not recognise
// return null: Atlas text is unmarked, and an unknown outside link is not
// claimed to be any class.
import { EXPLORER } from "../explorer";
import type { SourceClass } from "./sources";

/** A preview's copy of a document is its own state, not a source class (see sources.ts). */
export type LinkClass = SourceClass | "preview";

const PREVIEW_PATH_RE = /^\/preview\/([0-9a-f]{40})\//i;

/** The commit sha of a preview path (`/preview/<sha>/…`); null for any other href. */
export function previewShaOf(href: string): string | null {
  return PREVIEW_PATH_RE.exec(href)?.[1].toLowerCase() ?? null;
}

/** Block explorers, from the chain registry: an address, transaction or block page is a chain read. */
const EXPLORER_HOSTS = new Set(
  Object.values(EXPLORER).flatMap((base) => {
    try {
      return [new URL(base).host];
    } catch {
      return [];
    }
  }),
);

/** Someone else's record: the Sky Forum, the vote portal, GitHub (PRs, the polls and executive-vote repos, Soter's settlement workbooks), DefiLlama. */
const EXTERNAL_HOSTS = new Set(["forum.sky.money", "vote.sky.money", "github.com", "defillama.com", "coins.llama.fi"]);

export function classifyLink(href: string | undefined): LinkClass | null {
  if (!href) return null;
  if (previewShaOf(href)) return "preview";
  let host: string;
  try {
    host = new URL(href).host.toLowerCase();
  } catch {
    return null;
  }
  if (EXPLORER_HOSTS.has(host)) return "onchain";
  if (EXTERNAL_HOSTS.has(host)) return "external";
  return null;
}
