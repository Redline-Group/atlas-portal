/**
 * Bucket-file naming and order rules for the consolidated atlas layout. Part of
 * atlas-source.mjs, which re-exports these; nothing else imports this module.
 */

// Mirror of sync/partition.py:FILENAME_RE — keep in sync with upstream.
const BUCKET_FILE_RE = /^(A(?:\.\d+)*) - .*\.md$/;

/** Recover a bucket's doc number from its filename, or null if not a bucket file. */
export function bucketFromFilename(name: string): string | null {
  const m = BUCKET_FILE_RE.exec(name);
  return m ? m[1]! : null;
}

/** Sort key placing buckets in composed-Atlas order. Mirror of partition.order_key.
 *
 *  ⛔ DO NOT SUBSTITUTE FILENAME SORTING. It agrees today and diverges the moment
 *  a tenth Star is added: lexicographically `A.6.1.1.10` sorts between
 *  `A.6.1.1.1` and `A.6.1.1.2`, silently reordering ~2,000 documents. */
export function bucketOrderKey(bucket: string): number[] {
  return bucket.split(".").slice(1).map((s) => Number.parseInt(s, 10));
}

/** Segment-wise compare over `bucketOrderKey`; a prefix sorts before its extensions. */
export function compareBuckets(a: string, b: string): number {
  const ka = bucketOrderKey(a);
  const kb = bucketOrderKey(b);
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    // -1 for a missing segment: `A.6` sorts before `A.6.1`, as Python tuples do.
    const x = ka[i] ?? -1;
    const y = kb[i] ?? -1;
    if (x !== y) return x - y;
  }
  return 0;
}
