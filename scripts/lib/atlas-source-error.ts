/**
 * Part of the atlas-source module: only atlas-source.mjs (and its sibling
 * atlas-source-*.ts files) import it.
 */

/** Detection ambiguity, an unreadable checkout, or an implausibly small parse. */
export class AtlasSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AtlasSourceError";
  }
}
